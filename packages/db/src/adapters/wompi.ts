import { createHash } from 'node:crypto';
import type {
  CheckoutData,
  PaymentProvider,
  ProviderTransaction,
  ProviderTxStatus,
} from '@dejatellevar/core';

/**
 * WompiPaymentProvider — adaptador del puerto PaymentProvider.
 *
 * ÚNICO archivo que conoce Wompi. Habla su API REST por `fetch` (sin SDK). El
 * dinero vive en la cuenta del PSP; la plataforma nunca lo custodia (§5.4). Flujo:
 * prepareCheckout (con firma de integridad) → el cliente paga en el widget →
 * Wompi manda el webhook `transaction.updated` → verifyWebhookSignature + parseWebhook.
 */

export interface WompiConfig {
  publicKey: string;
  privateKey: string;
  integritySecret: string;
  eventsSecret: string;
  /** Se deduce del prefijo de la clave pública si no se pasa. */
  baseUrl?: string;
}

function baseUrlFor(publicKey: string): string {
  return publicKey.startsWith('pub_prod')
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';
}

function mapStatus(wompi: string): ProviderTxStatus {
  switch (wompi) {
    case 'APPROVED':
      return 'approved';
    case 'DECLINED':
      return 'declined';
    case 'VOIDED':
      return 'voided';
    case 'ERROR':
      return 'error';
    default:
      return 'pending';
  }
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** Resuelve una ruta con puntos ("transaction.id") contra un objeto. */
function pick(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

interface WompiTx {
  id: string;
  reference: string;
  status: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string | null;
}

export function createWompiPaymentProvider(config: WompiConfig): PaymentProvider {
  if (!config.publicKey || !config.integritySecret) {
    throw new Error('Faltan WOMPI_PUBLIC_KEY / WOMPI_INTEGRITY_SECRET.');
  }
  const baseUrl = (config.baseUrl ?? baseUrlFor(config.publicKey)).replace(/\/+$/, '');

  return {
    prepareCheckout({ amount, reference, redirectUrl }): CheckoutData {
      // Firma de integridad: SHA256(reference + amountInCents + currency + secret).
      const signature = sha256Hex(
        `${reference}${amount.amount}${amount.currency}${config.integritySecret}`,
      );
      return {
        provider: 'wompi',
        publicKey: config.publicKey,
        reference,
        amountInCents: amount.amount,
        currency: amount.currency,
        signature,
        redirectUrl,
      };
    },

    async getTransaction(transactionId): Promise<ProviderTransaction | null> {
      const res = await fetch(`${baseUrl}/transactions/${transactionId}`, {
        headers: { authorization: `Bearer ${config.privateKey}` },
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { data?: WompiTx };
      const t = body.data;
      if (!t) return null;
      return {
        id: t.id,
        reference: t.reference,
        status: mapStatus(t.status),
        amount: { amount: t.amount_in_cents, currency: (t.currency as 'COP' | 'USD') ?? 'COP' },
        method: t.payment_method_type ?? null,
      };
    },

    async refund({ transactionId, amount }): Promise<{ ok: boolean }> {
      const res = await fetch(`${baseUrl}/transactions/${transactionId}/void`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${config.privateKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ amount_in_cents: amount.amount }),
      });
      return { ok: res.ok };
    },

    verifyWebhookSignature(rawEvent): boolean {
      const event = rawEvent as {
        data?: unknown;
        timestamp?: number | string;
        signature?: { checksum?: string; properties?: string[] };
      };
      const props = event.signature?.properties;
      const checksum = event.signature?.checksum;
      if (!Array.isArray(props) || !checksum || event.timestamp === undefined) return false;
      const concatenated = props.map((p) => String(pick(event.data, p) ?? '')).join('');
      const computed = sha256Hex(`${concatenated}${event.timestamp}${config.eventsSecret}`);
      return computed.toLowerCase() === checksum.toLowerCase();
    },

    parseWebhook(rawEvent) {
      const event = rawEvent as {
        event?: string;
        data?: { transaction?: WompiTx };
        timestamp?: number | string;
      };
      const t = event.data?.transaction;
      if (!t?.id) return null;
      const status = mapStatus(t.status);
      return {
        // Wompi no da id de evento: se sintetiza para idempotencia por (tx, estado).
        providerEventId: `${t.id}:${t.status}`,
        transaction: {
          id: t.id,
          reference: t.reference,
          status,
          amount: { amount: t.amount_in_cents, currency: (t.currency as 'COP' | 'USD') ?? 'COP' },
          method: t.payment_method_type ?? null,
        },
      };
    },
  };
}
