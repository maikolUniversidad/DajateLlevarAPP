-- Migración 0017 — datos extra del registro unificado
--
-- El registro captura más de lo que 0016 (empresa) y 0015 (creador) guardan:
--   Empresa: VARIOS gremios (sectors) + uno personalizado (custom_sector), además
--            del `sector` principal ya existente.
--   Creador: estilo(s) de contenido (content_styles), formatos y audiencia
--            DECLARADA (segmentación descriptiva para el matching con marcas).
--            No confundir con las métricas calculadas del análisis de contenido.

-- Empresa
ALTER TABLE organization ADD COLUMN sectors text[] NOT NULL DEFAULT '{}';
ALTER TABLE organization ADD COLUMN custom_sector varchar(80);

-- Creador
ALTER TABLE creator_profile ADD COLUMN content_styles text[] NOT NULL DEFAULT '{}';
ALTER TABLE creator_profile ADD COLUMN formats text[] NOT NULL DEFAULT '{}';
ALTER TABLE creator_profile ADD COLUMN declared_audience jsonb NOT NULL DEFAULT '{}';
