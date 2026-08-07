import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createWompiPaymentProvider } from './wompi.js';

const sha256 = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

const wompi = createWompiPaymentProvider({
  publicKey: 'pub_test_abc',
  privateKey: 'prv_test_abc',
  integritySecret: 'integrity_secret',
  eventsSecret: 'events_secret',
});

describe('WompiPaymentProvider — firma de integridad', () => {
  it('firma reference+amount+currency+secret con SHA-256', () => {
    const co = wompi.prepareCheckout({
      amount: { amount: 8500000, currency: 'COP' },
      reference: 'REF1',
    });
    expect(co.signature).toBe(sha256('REF18500000COPintegrity_secret'));
    expect(co.amountInCents).toBe(8500000);
    expect(co.publicKey).toBe('pub_test_abc');
  });
});

describe('WompiPaymentProvider — webhook', () => {
  function makeEvent(checksumOverride?: string) {
    const timestamp = 1717000000;
    const props = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
    const concatenated = 'txid' + 'APPROVED' + '8500000';
    const checksum = sha256(`${concatenated}${timestamp}events_secret`);
    return {
      event: 'transaction.updated',
      data: {
        transaction: {
          id: 'txid',
          status: 'APPROVED',
          reference: 'REF1',
          amount_in_cents: 8500000,
          currency: 'COP',
          payment_method_type: 'CARD',
        },
      },
      timestamp,
      signature: { properties: props, checksum: checksumOverride ?? checksum },
    };
  }

  it('acepta una firma válida', () => {
    expect(wompi.verifyWebhookSignature(makeEvent())).toBe(true);
  });

  it('rechaza una firma manipulada', () => {
    expect(wompi.verifyWebhookSignature(makeEvent('deadbeef'))).toBe(false);
  });

  it('parsea la transacción y mapea el estado', () => {
    const parsed = wompi.parseWebhook(makeEvent());
    expect(parsed?.transaction.status).toBe('approved');
    expect(parsed?.transaction.reference).toBe('REF1');
    expect(parsed?.transaction.amount.amount).toBe(8500000);
    expect(parsed?.providerEventId).toBe('txid:APPROVED');
  });
});
