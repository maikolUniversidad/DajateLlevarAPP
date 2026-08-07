-- Migración 0003 — cumplimiento y consentimiento

-- Versiones de política, necesarias para probar qué aceptó cada quien
CREATE TABLE policy_version (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose       consent_purpose NOT NULL,
  version       varchar(20) NOT NULL,
  content_url   text NOT NULL,
  content_hash  varchar(64) NOT NULL,
  effective_from timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (purpose, version)
);

-- Consentimiento: requisito de la Ley 1581 de 2012. Un booleano NO es prueba suficiente.
CREATE TABLE consent (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        uuid NOT NULL REFERENCES account(id),
  policy_version_id uuid NOT NULL REFERENCES policy_version(id),
  purpose           consent_purpose NOT NULL,
  granted           boolean NOT NULL,
  granted_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at        timestamptz,
  ip_address        inet,
  user_agent        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_consent_account_purpose ON consent(account_id, purpose, granted_at DESC);

-- Solicitudes de derechos del titular (acceso, rectificación, supresión)
CREATE TABLE data_subject_request (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES account(id),
  kind          varchar(30) NOT NULL,     -- export, delete, rectify
  status        varchar(30) NOT NULL DEFAULT 'received',
  requested_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz,
  result_url    text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
