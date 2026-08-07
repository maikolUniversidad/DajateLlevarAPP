import type { CreatorProfile } from '../entities.js';
import { type DomainError, domainError } from '../errors.js';
import type { AccountRepository, CreatorRepository, EventPublisher } from '../ports.js';
import { type Result, err, ok } from '../result.js';

export interface ActivateCreatorProfileInput {
  accountId: string;
  handle: string;
  bio?: string | null;
  categories: string[];
  cities: string[];
  /** Estilo(s) de contenido (cómo describe lo que hace). */
  contentStyles?: string[];
  /** Formatos que produce. */
  formats?: string[];
  /** Audiencia declarada (segmentación descriptiva para el matching). */
  declaredAudience?: Record<string, unknown> | null;
}

export interface ActivateCreatorProfileDeps {
  accounts: AccountRepository;
  creators: CreatorRepository;
  events: EventPublisher;
}

/**
 * ActivateCreatorProfile — activa el perfil de Creador sobre una cuenta existente (§10.1).
 *
 * Invariantes:
 *  - La cuenta debe existir.
 *  - Una cuenta no puede tener dos perfiles de creador.
 *  - El `handle` es único en toda la plataforma.
 *  - El perfil queda PENDIENTE: las métricas (audiencia, fidelidad) son calculadas
 *    a partir de audiencia verificada y atribución, nunca declaradas en el alta.
 */
export async function activateCreatorProfile(
  deps: ActivateCreatorProfileDeps,
  input: ActivateCreatorProfileInput,
): Promise<Result<CreatorProfile, DomainError>> {
  const { accounts, creators, events } = deps;

  const account = await accounts.findById(input.accountId);
  if (!account) {
    return err(domainError('ACCOUNT_NOT_FOUND', 'La cuenta no existe'));
  }

  const existing = await creators.findByAccountId(input.accountId);
  if (existing) {
    return err(domainError('CREATOR_PROFILE_EXISTS', 'La cuenta ya tiene perfil de creador'));
  }

  const handleTaken = await creators.findByHandle(input.handle);
  if (handleTaken) {
    return err(domainError('HANDLE_TAKEN', 'Ese usuario de creador ya está tomado'));
  }

  const profile = await creators.create({
    accountId: input.accountId,
    handle: input.handle,
    bio: input.bio ?? null,
    categories: input.categories,
    cities: input.cities,
    contentStyles: input.contentStyles ?? [],
    formats: input.formats ?? [],
    declaredAudience: input.declaredAudience ?? {},
  });

  await events.publish({
    eventType: 'creator_profile.activated',
    aggregateType: 'creator_profile',
    aggregateId: profile.id,
    actorAccountId: account.id,
    payload: { handle: profile.handle },
  });

  return ok(profile);
}
