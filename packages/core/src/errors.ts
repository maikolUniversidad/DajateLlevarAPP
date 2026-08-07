/** Errores de dominio esperados. Se transportan como códigos SCREAMING_SNAKE_CASE. */

export type DomainErrorCode =
  | 'SERVICE_NOT_FOUND'
  | 'SERVICE_NOT_PUBLISHED'
  | 'RESOURCE_UNAVAILABLE'
  | 'DOUBLE_BOOKING'
  | 'WAIVER_REQUIRED'
  | 'INSURANCE_REQUIRED'
  | 'RNT_REQUIRED'
  | 'INVALID_PARTICIPANTS'
  | 'CAPACITY_EXCEEDED'
  | 'ADVANCE_WINDOW'
  | 'INVALID_TRANSITION'
  | 'NOT_AUTHORIZED'
  | 'LEDGER_UNBALANCED'
  | 'PRICING_INVALID'
  | 'EMAIL_TAKEN'
  | 'POLICY_NOT_CONFIGURED'
  | 'AUTH_FAILED'
  | 'ACCOUNT_NOT_FOUND'
  | 'CONSENT_REQUIRED';

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: unknown;

  constructor(code: DomainErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
  }
}

export function domainError(
  code: DomainErrorCode,
  message: string,
  details?: unknown,
): DomainError {
  return new DomainError(code, message, details);
}
