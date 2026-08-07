-- Migración 0000 — extensiones

CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid, cifrado
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- búsqueda por similitud de texto
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- búsqueda sin tildes
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector, búsqueda semántica
CREATE EXTENSION IF NOT EXISTS "btree_gist";    -- restricciones de exclusión de rangos
CREATE EXTENSION IF NOT EXISTS "citext";        -- texto insensible a mayúsculas
