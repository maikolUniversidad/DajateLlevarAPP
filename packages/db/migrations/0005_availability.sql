-- Migración 0005 — agenda y disponibilidad

-- Recursos consumibles: personas, salas, equipos, vehículos
CREATE TABLE resource (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  name            varchar(120) NOT NULL,
  kind            varchar(30) NOT NULL,   -- staff, room, equipment, vehicle
  capacity        integer NOT NULL DEFAULT 1,
  account_id      uuid REFERENCES account(id),  -- si el recurso es una persona con cuenta
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Qué recursos consume un servicio
CREATE TABLE service_resource (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id   uuid NOT NULL REFERENCES service(id) ON DELETE CASCADE,
  resource_id  uuid NOT NULL REFERENCES resource(id),
  quantity     integer NOT NULL DEFAULT 1,
  UNIQUE (service_id, resource_id)
);

-- Reglas de horario base por día de semana
CREATE TABLE availability_rule (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  service_id      uuid REFERENCES service(id),      -- NULL = aplica a toda la organización
  resource_id     uuid REFERENCES resource(id),
  weekday         smallint NOT NULL,                 -- 0=domingo .. 6=sábado
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  slot_minutes    integer,
  valid_from      date,
  valid_until     date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_rule_weekday CHECK (weekday BETWEEN 0 AND 6),
  CONSTRAINT chk_rule_time CHECK (end_time > start_time)
);

-- Excepciones: bloqueos, festivos, cierres puntuales
CREATE TABLE availability_exception (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  service_id      uuid REFERENCES service(id),
  resource_id     uuid REFERENCES resource(id),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  is_blocking     boolean NOT NULL DEFAULT true,     -- false = disponibilidad extraordinaria
  reason          varchar(200),
  external_event_id varchar(200),                    -- si vino de Google Calendar u otro
  connector_id    uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_exception_range CHECK (ends_at > starts_at)
);
CREATE INDEX idx_exception_range ON availability_exception(organization_id, starts_at, ends_at);

-- Sesiones con cupo: para la modalidad 'capacity'
CREATE TABLE capacity_session (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      uuid NOT NULL REFERENCES service(id),
  organization_id uuid NOT NULL REFERENCES organization(id),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  total_capacity  integer NOT NULL,
  booked_count    integer NOT NULL DEFAULT 0,
  price_override  bigint,
  is_cancelled    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_session_capacity CHECK (booked_count <= total_capacity),
  CONSTRAINT chk_session_range CHECK (ends_at > starts_at)
);
CREATE INDEX idx_session_service_time ON capacity_session(service_id, starts_at);

-- Lista de espera
CREATE TABLE waitlist_entry (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id          uuid NOT NULL REFERENCES service(id),
  capacity_session_id uuid REFERENCES capacity_session(id),
  account_id          uuid NOT NULL REFERENCES account(id),
  participants        integer NOT NULL DEFAULT 1,
  notified_at         timestamptz,
  converted_booking_id uuid,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Token para el feed iCalendar de solo lectura
CREATE TABLE calendar_feed_token (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  resource_id     uuid REFERENCES resource(id),
  token           varchar(64) NOT NULL UNIQUE,
  last_accessed_at timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
