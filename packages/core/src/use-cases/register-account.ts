import type { Account } from '../entities.js';
import { type DomainError, domainError } from '../errors.js';
import type {
  AccountRepository,
  AuthProvider,
  Clock,
  ConsentEvidence,
  ConsentRepository,
  EventPublisher,
  PolicyVersionRepository,
} from '../ports.js';
import { type Result, err, ok } from '../result.js';

export interface RegisterAccountInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  acceptMarketing: boolean;
  /** Prueba del consentimiento (Ley 1581): IP y user agent de la solicitud. */
  evidence: ConsentEvidence;
}

export interface RegisterAccountDeps {
  auth: AuthProvider;
  accounts: AccountRepository;
  policies: PolicyVersionRepository;
  consents: ConsentRepository;
  events: EventPublisher;
  clock: Clock;
}

/**
 * RegisterAccount — alta de cuenta con consentimiento probatorio.
 *
 * Invariantes:
 *  - El correo no puede estar ya registrado.
 *  - Términos y privacidad son OBLIGATORIOS y se registran con versión de
 *    política, marca de tiempo, IP y user agent (Ley 1581: un booleano no basta).
 *  - El consentimiento de marketing es opcional y separable.
 *  - El usuario en el proveedor de auth y la cuenta local quedan enlazados por
 *    external_auth_id.
 */
export async function registerAccount(
  deps: RegisterAccountDeps,
  input: RegisterAccountInput,
): Promise<Result<Account, DomainError>> {
  const { auth, accounts, policies, consents, events } = deps;

  const existing = await accounts.findByEmail(input.email);
  if (existing) {
    return err(domainError('EMAIL_TAKEN', 'Ya existe una cuenta con ese correo'));
  }

  // Las políticas obligatorias deben estar configuradas (datos semilla §6).
  const termsPolicy = await policies.latestFor('terms');
  const privacyPolicy = await policies.latestFor('privacy');
  if (!termsPolicy || !privacyPolicy) {
    return err(
      domainError(
        'POLICY_NOT_CONFIGURED',
        'Las políticas de términos y privacidad no están publicadas',
      ),
    );
  }

  // Crea el usuario en el proveedor de auth (Supabase). Si falla, no creamos cuenta.
  let externalUserId: string;
  try {
    const created = await auth.createUser({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
    });
    externalUserId = created.externalUserId;
  } catch (e) {
    return err(domainError('AUTH_FAILED', 'No se pudo crear el usuario de autenticación', e));
  }

  const account = await accounts.create({
    email: input.email,
    fullName: input.fullName,
    phone: input.phone ?? null,
    externalAuthId: externalUserId,
  });

  // Consentimientos obligatorios + marketing opcional.
  await consents.record({
    accountId: account.id,
    policyVersionId: termsPolicy.id,
    purpose: 'terms',
    granted: true,
    evidence: input.evidence,
  });
  await consents.record({
    accountId: account.id,
    policyVersionId: privacyPolicy.id,
    purpose: 'privacy',
    granted: true,
    evidence: input.evidence,
  });

  const marketingPolicy = await policies.latestFor('marketing');
  if (marketingPolicy) {
    await consents.record({
      accountId: account.id,
      policyVersionId: marketingPolicy.id,
      purpose: 'marketing',
      granted: input.acceptMarketing,
      evidence: input.evidence,
    });
  }

  await events.publish({
    eventType: 'account.registered',
    aggregateType: 'account',
    aggregateId: account.id,
    actorAccountId: account.id,
    payload: { email: account.email },
  });

  return ok(account);
}
