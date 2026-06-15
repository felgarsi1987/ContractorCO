-- ──────────────────────────────────────────────────────────────────────────────
-- FASE 4: Solicitudes precontractuales
-- Permite solicitar documentos a un contratista ANTES de que exista un contrato.
-- contrato_id se hace nullable; se agrega contratista_id y fase.
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Hacer contrato_id nullable (precontractual no tiene contrato aún)
ALTER TABLE solicitudes_documentos
  ALTER COLUMN contrato_id DROP NOT NULL;

-- 2. Agregar columna contratista_id (para precontractual: apunta al contratista directamente)
ALTER TABLE solicitudes_documentos
  ADD COLUMN IF NOT EXISTS contratista_id UUID REFERENCES contratistas(id) ON DELETE SET NULL;

-- 3. Columna fase para distinguir el flujo
ALTER TABLE solicitudes_documentos
  ADD COLUMN IF NOT EXISTS fase VARCHAR(20) DEFAULT 'contrato'
  CHECK (fase IN ('contrato','precontractual'));

-- 4. Al menos uno de contrato_id o contratista_id debe tener valor
ALTER TABLE solicitudes_documentos
  ADD CONSTRAINT chk_solicitud_tiene_destino
  CHECK (contrato_id IS NOT NULL OR contratista_id IS NOT NULL);

-- 5. Índice para consultas de precontractual por contratista
CREATE INDEX IF NOT EXISTS idx_sol_contratista_id ON solicitudes_documentos(contratista_id)
  WHERE contratista_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sol_fase ON solicitudes_documentos(fase);

-- ──────────────────────────────────────────────────────────────────────────────
-- RLS: políticas adicionales para precontractual
-- El contratista puede ver sus propias solicitudes precontractuales
-- ──────────────────────────────────────────────────────────────────────────────

-- Permitir al contratista ver solicitudes donde él es el contratista_id directo
-- (las de tipo contrato ya están cubiertas via contratos.contratista_id)
CREATE POLICY IF NOT EXISTS "contratista_lee_precontractual" ON solicitudes_documentos
  FOR SELECT
  USING (
    contratista_id IN (
      SELECT id FROM contratistas WHERE usuario_id = auth.uid()
    )
  );

-- Admin y supervisores pueden ver y crear cualquier solicitud precontractual
-- (ya cubiertos por políticas existentes de rol)

-- ──────────────────────────────────────────────────────────────────────────────
-- Datos de ejemplo: catálogo de documentos (tabla referencial opcional)
-- Se puede usar para auditar qué documentos se piden más frecuentemente
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalogo_documentos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT NOT NULL UNIQUE,
  base_legal   TEXT,
  tipo_fase    TEXT[] DEFAULT '{precontractual}',
  activo       BOOLEAN DEFAULT TRUE,
  orden        INT DEFAULT 0
);

INSERT INTO catalogo_documentos (nombre, base_legal, tipo_fase, orden) VALUES
  ('RUT actualizado',                          'Art. 616-1 E.T.',                 '{precontractual}',           1),
  ('Certificado de existencia y representación','Cámara de Comercio',             '{precontractual}',           2),
  ('Cédula de ciudadanía (persona natural)',   'Identificación personal',          '{precontractual}',           3),
  ('Consulta inhabilidades SIRI',              'Art. 8 Ley 80/93',                '{precontractual}',           4),
  ('Oferta económica firmada',                 'Art. 23 Ley 80/93',               '{precontractual}',           5),
  ('Certificación bancaria',                   'Control de pagos',                '{precontractual}',           6),
  ('Póliza de cumplimiento aprobada',          'Art. 7 Ley 1150/07',              '{inicio}',                   1),
  ('Afiliación EPS (salud)',                   'Art. 23 Ley 1150/07',             '{inicio,mensual}',           2),
  ('Certificado ARL (clase de riesgo)',        'Decreto 1295/94',                 '{inicio,mensual}',           3),
  ('Acta de inicio firmada',                   'Art. 26 Ley 80/93',               '{inicio}',                   4),
  ('Planilla PILA (salud + pensión + ARL)',    'Decreto 1273/2018',               '{mensual}',                  1),
  ('Factura o cuenta de cobro',                'Art. 615 E.T.',                   '{mensual}',                  2),
  ('Informe de actividades del período',       'Art. 83 Ley 1474/2011',           '{mensual,cierre}',           3),
  ('Acta de supervisión mensual',              'Art. 83 Ley 1474/2011',           '{mensual}',                  4),
  ('Acta de liquidación firmada',              'Art. 60 Ley 80/93',               '{cierre}',                   1),
  ('Certificación de cumplimiento',            'Supervisor designado',             '{cierre}',                   2),
  ('Acta de modificación contractual',         'Art. 16 Ley 80/93',               '{especial}',                 1)
ON CONFLICT (nombre) DO NOTHING;

COMMENT ON COLUMN solicitudes_documentos.contratista_id IS
  'Para solicitudes precontractuales: contratista al que se le piden documentos antes de formalizar el contrato';
COMMENT ON COLUMN solicitudes_documentos.fase IS
  'contrato = ligada a un contrato existente; precontractual = proceso de habilitación previo al contrato';
