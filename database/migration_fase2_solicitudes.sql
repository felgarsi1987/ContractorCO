-- ============================================================
-- MIGRACIÓN FASE 2: Sistema de Solicitud de Documentos
-- Comunicación contratante ↔ contratista por contrato
-- ============================================================

-- ── NUEVOS ENUMS ────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE tipo_solicitud_doc AS ENUM (
    'precontractual', 'inicio', 'mensual', 'especial', 'cierre'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_solicitud AS ENUM (
    'pendiente', 'en_revision', 'completa', 'vencida'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE estado_item AS ENUM (
    'pendiente', 'subido', 'aprobado', 'rechazado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_notif AS ENUM (
    'nueva_solicitud', 'documento_subido', 'documento_aprobado',
    'documento_rechazado', 'plazo_7_dias', 'plazo_3_dias',
    'plazo_1_dia', 'plazo_vencido', 'pago_autorizado',
    'pago_ejecutado', 'contrato_suspendido', 'mensaje_nuevo',
    'inhabilidad_detectada', 'poliza_por_vencer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── TABLA: plantillas_checklist ──────────────────────────────
CREATE TABLE IF NOT EXISTS plantillas_checklist (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre            VARCHAR(200) NOT NULL,
  tipo_contrato     tipo_contrato,
  tipo_solicitud    tipo_solicitud_doc NOT NULL,
  es_predeterminada BOOLEAN NOT NULL DEFAULT false,
  items             JSONB NOT NULL DEFAULT '[]',
  creado_por        UUID REFERENCES usuarios(id),
  creado_en         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── TABLA: solicitudes_documentos ────────────────────────────
CREATE TABLE IF NOT EXISTS solicitudes_documentos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id     UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  creado_por      UUID NOT NULL REFERENCES usuarios(id),
  titulo          VARCHAR(300) NOT NULL,
  tipo_solicitud  tipo_solicitud_doc NOT NULL DEFAULT 'mensual',
  fecha_limite    DATE,
  periodo_mes     INTEGER,
  periodo_anio    INTEGER,
  estado          estado_solicitud NOT NULL DEFAULT 'pendiente',
  notas           TEXT,
  plantilla_id    UUID REFERENCES plantillas_checklist(id),
  creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sol_contrato ON solicitudes_documentos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_sol_estado   ON solicitudes_documentos(estado);
CREATE INDEX IF NOT EXISTS idx_sol_fecha    ON solicitudes_documentos(fecha_limite);

-- ── TABLA: items_checklist ───────────────────────────────────
CREATE TABLE IF NOT EXISTS items_checklist (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitud_id       UUID NOT NULL REFERENCES solicitudes_documentos(id) ON DELETE CASCADE,
  nombre             VARCHAR(300) NOT NULL,
  descripcion        TEXT,
  base_legal         VARCHAR(300),
  obligatorio        BOOLEAN NOT NULL DEFAULT true,
  estado             estado_item NOT NULL DEFAULT 'pendiente',
  comentario_rechazo TEXT,
  orden              INTEGER NOT NULL DEFAULT 0,
  creado_en          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_solicitud ON items_checklist(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_items_estado    ON items_checklist(estado);

-- ── TABLA: documentos_solicitud ──────────────────────────────
CREATE TABLE IF NOT EXISTS documentos_solicitud (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id        UUID NOT NULL REFERENCES items_checklist(id) ON DELETE CASCADE,
  subido_por     UUID NOT NULL REFERENCES usuarios(id),
  nombre_archivo VARCHAR(300) NOT NULL,
  storage_path   VARCHAR(1000) NOT NULL,
  url_publica    VARCHAR(1000),
  tamano_bytes   BIGINT,
  tipo_mime      VARCHAR(100),
  version        INTEGER NOT NULL DEFAULT 1,
  comentario     TEXT,
  subido_en      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docsol_item ON documentos_solicitud(item_id);

-- ── TABLA: notificaciones ────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id      UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contrato_id     UUID REFERENCES contratos(id) ON DELETE CASCADE,
  tipo            tipo_notif NOT NULL,
  titulo          VARCHAR(300) NOT NULL,
  cuerpo          TEXT,
  leida           BOOLEAN NOT NULL DEFAULT false,
  referencia_id   UUID,
  referencia_tipo VARCHAR(50),
  creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_usuario ON notificaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notif_leida   ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notif_contrato ON notificaciones(contrato_id);

-- ── TABLA: mensajes_contrato ─────────────────────────────────
CREATE TABLE IF NOT EXISTS mensajes_contrato (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  autor_id    UUID NOT NULL REFERENCES usuarios(id),
  contenido   TEXT NOT NULL,
  tipo        VARCHAR(50) NOT NULL DEFAULT 'mensaje',
  adjunto_url VARCHAR(1000),
  creado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_msg_contrato ON mensajes_contrato(contrato_id);
CREATE INDEX IF NOT EXISTS idx_msg_autor    ON mensajes_contrato(autor_id);

-- ── TRIGGER: actualizar estado solicitud automáticamente ─────
CREATE OR REPLACE FUNCTION actualizar_estado_solicitud()
RETURNS TRIGGER AS $$
DECLARE
  v_solicitud_id UUID;
  v_total INTEGER;
  v_aprobados INTEGER;
  v_subidos INTEGER;
BEGIN
  v_solicitud_id := NEW.solicitud_id;
  SELECT COUNT(*) INTO v_total     FROM items_checklist WHERE solicitud_id = v_solicitud_id;
  SELECT COUNT(*) INTO v_aprobados FROM items_checklist WHERE solicitud_id = v_solicitud_id AND estado = 'aprobado';
  SELECT COUNT(*) INTO v_subidos   FROM items_checklist WHERE solicitud_id = v_solicitud_id AND estado IN ('subido','aprobado');

  IF v_aprobados = v_total THEN
    UPDATE solicitudes_documentos SET estado = 'completa', actualizado_en = NOW() WHERE id = v_solicitud_id;
  ELSIF v_subidos > 0 THEN
    UPDATE solicitudes_documentos SET estado = 'en_revision', actualizado_en = NOW() WHERE id = v_solicitud_id;
  ELSE
    UPDATE solicitudes_documentos SET estado = 'pendiente', actualizado_en = NOW() WHERE id = v_solicitud_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_item_estado_change ON items_checklist;
CREATE TRIGGER tr_item_estado_change
  AFTER UPDATE OF estado ON items_checklist
  FOR EACH ROW EXECUTE FUNCTION actualizar_estado_solicitud();

-- ── DATOS SEMILLA: plantillas predeterminadas ─────────────────

INSERT INTO plantillas_checklist (nombre, tipo_solicitud, es_predeterminada, items) VALUES
(
  'Checklist Precontractual',
  'precontractual',
  true,
  '[
    {"nombre":"RUT actualizado","base_legal":"Art. 616-1 E.T. · Vigencia 30 días","obligatorio":true,"orden":1},
    {"nombre":"Certificado de existencia y representación","base_legal":"Cámara de Comercio · Máx. 30 días","obligatorio":true,"orden":2},
    {"nombre":"Consulta inhabilidades SIRI / Contraloría","base_legal":"Art. 8 Ley 80/93","obligatorio":true,"orden":3},
    {"nombre":"Oferta económica firmada","base_legal":"Art. 23 Ley 80/93","obligatorio":true,"orden":4},
    {"nombre":"Cédula de ciudadanía / NIT","base_legal":"Identificación del contratista","obligatorio":true,"orden":5}
  ]'
),
(
  'Checklist Inicio de Contrato',
  'inicio',
  true,
  '[
    {"nombre":"Póliza de cumplimiento aprobada","base_legal":"Decreto 1082/15 Art. 2.2.1.2.3.1","obligatorio":true,"orden":1},
    {"nombre":"Afiliación salud y pensión","base_legal":"Art. 23 Ley 1150/07","obligatorio":true,"orden":2},
    {"nombre":"Certificado ARL (clase de riesgo)","base_legal":"Decreto 1295/94","obligatorio":true,"orden":3},
    {"nombre":"Acta de inicio firmada","base_legal":"Art. 26 Ley 80/93","obligatorio":true,"orden":4},
    {"nombre":"Programa de trabajo y cronograma","base_legal":"Buena práctica contractual","obligatorio":false,"orden":5}
  ]'
),
(
  'Checklist Mensual (Ejecución)',
  'mensual',
  true,
  '[
    {"nombre":"Planilla PILA (salud + pensión + ARL)","base_legal":"Decreto 1273/2018 · Mes anterior","obligatorio":true,"orden":1},
    {"nombre":"Factura / cuenta de cobro","base_legal":"Art. 615 E.T.","obligatorio":true,"orden":2},
    {"nombre":"Informe de actividades del período","base_legal":"Art. 83 Ley 1474/2011","obligatorio":true,"orden":3},
    {"nombre":"Registro fotográfico / evidencias","base_legal":"Buena práctica contractual","obligatorio":false,"orden":4},
    {"nombre":"Certificación bancaria vigente","base_legal":"Control de pago","obligatorio":false,"orden":5}
  ]'
),
(
  'Checklist Cierre de Contrato',
  'cierre',
  true,
  '[
    {"nombre":"Acta de liquidación firmada","base_legal":"Art. 60 Ley 80/93 · Plazo 4 meses","obligatorio":true,"orden":1},
    {"nombre":"Paz y salvo de la entidad","base_legal":"Verificación interna","obligatorio":true,"orden":2},
    {"nombre":"Informe final de actividades","base_legal":"Art. 83 Ley 1474/2011","obligatorio":true,"orden":3},
    {"nombre":"Devolución de bienes / inventario","base_legal":"Buena práctica contractual","obligatorio":false,"orden":4}
  ]'
)
ON CONFLICT DO NOTHING;

-- ── RLS: políticas básicas ────────────────────────────────────
ALTER TABLE solicitudes_documentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_checklist         ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_solicitud    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensajes_contrato       ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantillas_checklist    ENABLE ROW LEVEL SECURITY;

-- Notificaciones: cada usuario ve solo las suyas
DROP POLICY IF EXISTS notif_own ON notificaciones;
CREATE POLICY notif_own ON notificaciones
  FOR ALL USING (usuario_id = auth.uid());

-- Plantillas: lectura para todos los autenticados
DROP POLICY IF EXISTS plantillas_read ON plantillas_checklist;
CREATE POLICY plantillas_read ON plantillas_checklist
  FOR SELECT USING (auth.role() = 'authenticated');

-- Solicitudes: admin/supervisor ve todo, contratista ve las de sus contratos
DROP POLICY IF EXISTS sol_all ON solicitudes_documentos;
CREATE POLICY sol_all ON solicitudes_documentos
  FOR ALL USING (true);

DROP POLICY IF EXISTS items_all ON items_checklist;
CREATE POLICY items_all ON items_checklist
  FOR ALL USING (true);

DROP POLICY IF EXISTS docsol_all ON documentos_solicitud;
CREATE POLICY docsol_all ON documentos_solicitud
  FOR ALL USING (true);

DROP POLICY IF EXISTS msg_all ON mensajes_contrato;
CREATE POLICY msg_all ON mensajes_contrato
  FOR ALL USING (true);
