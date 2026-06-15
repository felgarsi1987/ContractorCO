-- ============================================================
-- MIGRACIÓN FASE 1 — Normatividad Colombiana
-- Ley 80/93 · Ley 1150/07 · Decreto 1082/15 · Ley 1474/11
-- ============================================================

-- ============================================================
-- 1. EXPANDIR ENUMS EXISTENTES
-- ============================================================

-- Nuevas categorías de documentos exigidos por ley
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'poliza_buen_manejo_anticipo';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'poliza_pago_salarios';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'poliza_estabilidad_obra';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'poliza_calidad';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'poliza_responsabilidad_civil';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'acta_liquidacion';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'acta_terminacion';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'informe_supervision_mensual';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'informe_supervision_final';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'concepto_juridico';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'cdp';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'rp';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'orden_pago';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'factura';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'paz_y_salvo_seguridad_social';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'certificado_afiliacion_salud';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'certificado_afiliacion_pension';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'certificado_afiliacion_arl';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'camara_comercio';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'antecedentes_disciplinarios';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'antecedentes_fiscales';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'antecedentes_judiciales';
ALTER TYPE categoria_documento ADD VALUE IF NOT EXISTS 'experiencia_acreditada';

-- Nuevas alertas normativas
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'informe_supervision_pendiente';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'garantia_por_vencer_30';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'garantia_por_vencer_15';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'garantia_por_vencer_5';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'garantia_vencida';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'plazo_liquidacion_proximo';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'plazo_liquidacion_vencido';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'inhabilidad_consulta_vencida';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'anticipo_sin_amortizar';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'seguridad_social_pendiente';
ALTER TYPE tipo_alerta ADD VALUE IF NOT EXISTS 'acta_inicio_pendiente';

-- ============================================================
-- 2. NUEVOS ENUMS
-- ============================================================

CREATE TYPE tipo_garantia AS ENUM (
  'cumplimiento',
  'buen_manejo_anticipo',
  'pago_salarios',
  'estabilidad_obra',
  'calidad_suministro',
  'responsabilidad_civil',
  'responsabilidad_servidores'
);

CREATE TYPE estado_garantia AS ENUM (
  'vigente', 'vencida', 'renovada', 'cancelada'
);

CREATE TYPE tipo_acta AS ENUM (
  'inicio',
  'suspension',
  'reinicio',
  'terminacion',
  'liquidacion'
);

CREATE TYPE estado_acta AS ENUM (
  'borrador', 'pendiente_firma', 'firmada', 'unilateral'
);

CREATE TYPE modalidad_seleccion AS ENUM (
  'licitacion_publica',
  'seleccion_abreviada',
  'concurso_meritos',
  'contratacion_directa',
  'minima_cuantia',
  'asociacion_publico_privada'
);

-- ============================================================
-- 3. TABLA: garantias
-- Fundamento: Decreto 1082/15 Arts. 2.2.1.2.3.1 al 2.2.1.2.3.4
-- ============================================================

CREATE TABLE IF NOT EXISTS garantias (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id         UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  tipo_garantia       tipo_garantia NOT NULL,
  aseguradora         VARCHAR(200) NOT NULL,
  numero_poliza       VARCHAR(100) NOT NULL,
  valor_asegurado     NUMERIC(18,2) NOT NULL,
  porcentaje          NUMERIC(5,2),
  fecha_inicio        DATE NOT NULL,
  fecha_vencimiento   DATE NOT NULL,
  estado              estado_garantia NOT NULL DEFAULT 'vigente',
  amparos             TEXT[],
  aprobada_por        UUID REFERENCES usuarios(id),
  observaciones       TEXT,
  documento_id        UUID REFERENCES documentos(id),
  creado_por          UUID REFERENCES usuarios(id),
  creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_garantias_contrato    ON garantias(contrato_id);
CREATE INDEX IF NOT EXISTS idx_garantias_vencimiento ON garantias(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_garantias_estado      ON garantias(estado);

COMMENT ON TABLE garantias IS 'Pólizas y garantías por contrato — Decreto 1082/15';

CREATE TRIGGER tr_garantias_updated
  BEFORE UPDATE ON garantias
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

-- ============================================================
-- 4. TABLA: actas
-- Fundamento: Arts. 41, 60 Ley 80/93 — Art. 19 Ley 80/93
-- ============================================================

CREATE TABLE IF NOT EXISTS actas (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id                 UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  tipo_acta                   tipo_acta NOT NULL,
  numero_acta                 VARCHAR(50),
  fecha_acta                  DATE NOT NULL,
  descripcion                 TEXT NOT NULL,

  -- Suspensión (Art. 19 Ley 80)
  causa_suspension            TEXT,
  dias_suspension             INTEGER DEFAULT 0,
  fecha_reinicio_estimada     DATE,

  -- Liquidación (Art. 60 Ley 80 — plazo 4 meses desde terminación)
  valor_ejecutado             NUMERIC(18,2),
  saldo_favor_entidad         NUMERIC(18,2) DEFAULT 0,
  saldo_favor_contratista     NUMERIC(18,2) DEFAULT 0,
  es_unilateral               BOOLEAN NOT NULL DEFAULT false,
  plazo_bilateral_vence       DATE,

  -- Control de firmas
  estado                      estado_acta NOT NULL DEFAULT 'borrador',
  firmada_supervisor           BOOLEAN NOT NULL DEFAULT false,
  firmada_contratista          BOOLEAN NOT NULL DEFAULT false,
  firmada_juridica             BOOLEAN NOT NULL DEFAULT false,
  fecha_firma_supervisor       DATE,
  fecha_firma_contratista      DATE,
  fecha_firma_juridica         DATE,

  documento_id                UUID REFERENCES documentos(id),
  creado_por                  UUID REFERENCES usuarios(id),
  creado_en                   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actas_contrato  ON actas(contrato_id);
CREATE INDEX IF NOT EXISTS idx_actas_tipo      ON actas(tipo_acta);
CREATE INDEX IF NOT EXISTS idx_actas_estado    ON actas(estado);

COMMENT ON TABLE actas IS 'Actas contractuales — Arts. 19, 41, 60 Ley 80/93';

CREATE TRIGGER tr_actas_updated
  BEFORE UPDATE ON actas
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

-- ============================================================
-- 5. TABLA: informes_supervision
-- Fundamento: Art. 83 Ley 1474/2011
-- ============================================================

CREATE TABLE IF NOT EXISTS informes_supervision (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id           UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  supervisor_id         UUID NOT NULL REFERENCES supervisores(id),
  periodo_inicio        DATE NOT NULL,
  periodo_fin           DATE NOT NULL,
  numero_informe        INTEGER NOT NULL,
  actividades           TEXT NOT NULL,
  cumplimiento_objeto   INTEGER NOT NULL CHECK (cumplimiento_objeto BETWEEN 0 AND 100),
  valor_pagado_periodo  NUMERIC(18,2) DEFAULT 0,
  observaciones         TEXT,
  recomendaciones       TEXT,
  requiere_accion       BOOLEAN NOT NULL DEFAULT false,
  estado                VARCHAR(20) NOT NULL DEFAULT 'borrador',
  aprobado_por          UUID REFERENCES usuarios(id),
  fecha_aprobacion      DATE,
  documento_id          UUID REFERENCES documentos(id),
  creado_en             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(contrato_id, numero_informe)
);

CREATE INDEX IF NOT EXISTS idx_informes_contrato   ON informes_supervision(contrato_id);
CREATE INDEX IF NOT EXISTS idx_informes_supervisor ON informes_supervision(supervisor_id);

COMMENT ON TABLE informes_supervision IS 'Informes mensuales de supervisión — Art. 83 Ley 1474';

CREATE TRIGGER tr_informes_updated
  BEFORE UPDATE ON informes_supervision
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

-- ============================================================
-- 6. TABLA: consultas_inhabilidades
-- Fundamento: Art. 8 Ley 80/93 — SIRI Procuraduría
-- ============================================================

CREATE TABLE IF NOT EXISTS consultas_inhabilidades (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contratista_id   UUID NOT NULL REFERENCES contratistas(id) ON DELETE CASCADE,
  fuente           VARCHAR(50) NOT NULL,
  -- 'procuraduria_siri', 'contraloria', 'rama_judicial', 'policia'
  fecha_consulta   DATE NOT NULL,
  resultado        VARCHAR(20) NOT NULL DEFAULT 'limpio',
  -- 'limpio', 'inhabilitado', 'suspendido', 'pendiente'
  detalle          TEXT,
  vigente_hasta    DATE,
  consultado_por   UUID REFERENCES usuarios(id),
  documento_id     UUID REFERENCES documentos(id),
  creado_en        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inhabilidades_contratista ON consultas_inhabilidades(contratista_id);
CREATE INDEX IF NOT EXISTS idx_inhabilidades_fecha       ON consultas_inhabilidades(fecha_consulta);

COMMENT ON TABLE consultas_inhabilidades IS 'Consultas periódicas de inhabilidades — Art. 8 Ley 80';

-- ============================================================
-- 7. COLUMNAS ADICIONALES EN contratos
-- ============================================================

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS modalidad_seleccion  modalidad_seleccion,
  ADD COLUMN IF NOT EXISTS rubro_presupuestal   VARCHAR(200),
  ADD COLUMN IF NOT EXISTS fuente_financiacion  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS anticipo_pactado     NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS anticipo_amortizado  NUMERIC(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS id_paa               VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fecha_liquidacion    DATE;

COMMENT ON COLUMN contratos.modalidad_seleccion IS 'Modalidad de selección — Decreto 1082/15';
COMMENT ON COLUMN contratos.anticipo_pactado    IS 'Anticipo pactado — Art. 40 Ley 80';
COMMENT ON COLUMN contratos.fecha_liquidacion   IS 'Fecha de liquidación efectiva — Art. 60 Ley 80';

-- ============================================================
-- 8. VISTA: dashboard ampliado con indicadores normativos
-- ============================================================

CREATE OR REPLACE VIEW v_dashboard AS
SELECT
  -- Contratos
  (SELECT COUNT(*) FROM contratos WHERE estado = 'en_ejecucion')
    AS contratos_activos,
  (SELECT COUNT(*) FROM contratos WHERE fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + 30 AND estado = 'en_ejecucion')
    AS contratos_proximos_vencer,
  (SELECT COUNT(*) FROM contratos WHERE fecha_fin < CURRENT_DATE AND estado = 'en_ejecucion')
    AS contratos_vencidos,
  -- Contratistas
  (SELECT COUNT(*) FROM contratistas WHERE estado = 'activo')
    AS contratistas_activos,
  -- Documentos
  (SELECT COUNT(*) FROM documentos WHERE estado_vence = 'proximo' AND es_vigente = true)
    AS documentos_proximos,
  (SELECT COUNT(*) FROM documentos WHERE estado_vence = 'vencido' AND es_vigente = true)
    AS documentos_vencidos,
  -- Financiero
  (SELECT COALESCE(SUM(valor_actual), 0) FROM contratos WHERE estado = 'en_ejecucion')
    AS valor_total_contratos,
  -- Alertas
  (SELECT COUNT(*) FROM alertas WHERE leida = false)
    AS alertas_pendientes,
  -- NUEVOS — Normatividad
  (SELECT COUNT(*) FROM garantias WHERE estado = 'vencida')
    AS garantias_vencidas,
  (SELECT COUNT(*) FROM garantias WHERE fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + 30 AND estado = 'vigente')
    AS garantias_por_vencer,
  (SELECT COUNT(*) FROM actas a JOIN contratos c ON c.id = a.contrato_id
     WHERE a.tipo_acta = 'liquidacion' AND c.estado = 'terminado'
       AND c.fecha_fin < CURRENT_DATE - INTERVAL '4 months' AND a.estado != 'firmada')
    AS liquidaciones_vencidas,
  (SELECT COUNT(*) FROM informes_supervision WHERE estado = 'borrador')
    AS informes_pendientes;

-- ============================================================
-- 9. VISTA: garantías con información completa
-- ============================================================

CREATE OR REPLACE VIEW v_garantias AS
SELECT
  g.*,
  c.numero_contrato,
  c.objeto AS contrato_objeto,
  c.fecha_fin AS contrato_fecha_fin,
  ct.nombres || ' ' || COALESCE(ct.apellidos, '') AS contratista_nombre,
  u.nombre AS aprobada_por_nombre,
  (g.fecha_vencimiento - CURRENT_DATE) AS dias_para_vencer,
  CASE
    WHEN g.fecha_vencimiento < CURRENT_DATE THEN 'vencida'
    WHEN g.fecha_vencimiento <= CURRENT_DATE + 30 THEN 'por_vencer'
    ELSE 'vigente'
  END AS estado_semaforo
FROM garantias g
JOIN contratos c ON c.id = g.contrato_id
JOIN contratistas ct ON ct.id = c.contratista_id
LEFT JOIN usuarios u ON u.id = g.aprobada_por;

-- ============================================================
-- 10. FUNCIÓN: generar alertas de garantías automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION generar_alertas_garantias()
RETURNS void AS $$
BEGIN
  -- Garantías que vencen en 30 días
  INSERT INTO alertas (contrato_id, tipo_alerta, mensaje)
  SELECT g.contrato_id,
    'garantia_por_vencer_30',
    'Póliza de ' || g.tipo_garantia::text || ' N° ' || g.numero_poliza || ' vence en 30 días (' || g.fecha_vencimiento::text || ')'
  FROM garantias g
  WHERE g.fecha_vencimiento = CURRENT_DATE + 30
    AND g.estado = 'vigente'
    AND NOT EXISTS (
      SELECT 1 FROM alertas a
      WHERE a.contrato_id = g.contrato_id
        AND a.tipo_alerta = 'garantia_por_vencer_30'
        AND a.creado_en::date = CURRENT_DATE
    );

  -- Garantías que vencen en 15 días
  INSERT INTO alertas (contrato_id, tipo_alerta, mensaje)
  SELECT g.contrato_id,
    'garantia_por_vencer_15',
    'URGENTE: Póliza de ' || g.tipo_garantia::text || ' N° ' || g.numero_poliza || ' vence en 15 días'
  FROM garantias g
  WHERE g.fecha_vencimiento = CURRENT_DATE + 15
    AND g.estado = 'vigente'
    AND NOT EXISTS (
      SELECT 1 FROM alertas a
      WHERE a.contrato_id = g.contrato_id
        AND a.tipo_alerta = 'garantia_por_vencer_15'
        AND a.creado_en::date = CURRENT_DATE
    );

  -- Garantías vencidas — marcar estado
  UPDATE garantias
  SET estado = 'vencida'
  WHERE fecha_vencimiento < CURRENT_DATE
    AND estado = 'vigente';

  -- Alerta de liquidación vencida (Art. 60 — 4 meses)
  INSERT INTO alertas (contrato_id, tipo_alerta, mensaje)
  SELECT c.id,
    'plazo_liquidacion_vencido',
    'El contrato ' || c.numero_contrato || ' debió liquidarse antes del ' || (c.fecha_fin + INTERVAL '4 months')::date::text || ' (Art. 60 Ley 80)'
  FROM contratos c
  WHERE c.estado = 'terminado'
    AND c.fecha_fin + INTERVAL '4 months' < CURRENT_DATE
    AND c.fecha_liquidacion IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM alertas a
      WHERE a.contrato_id = c.id
        AND a.tipo_alerta = 'plazo_liquidacion_vencido'
        AND a.creado_en::date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 11. DATOS DE PRUEBA — garantías demo
-- ============================================================

-- Se ejecutan solo si existen contratos de demo
DO $$
DECLARE
  v_contrato_id UUID;
  v_usuario_id  UUID;
BEGIN
  SELECT id INTO v_contrato_id FROM contratos LIMIT 1;
  SELECT id INTO v_usuario_id  FROM usuarios WHERE rol = 'admin' LIMIT 1;

  IF v_contrato_id IS NOT NULL AND v_usuario_id IS NOT NULL THEN
    INSERT INTO garantias (contrato_id, tipo_garantia, aseguradora, numero_poliza,
      valor_asegurado, porcentaje, fecha_inicio, fecha_vencimiento, estado, creado_por)
    VALUES
      (v_contrato_id, 'cumplimiento',       'Seguros Bolívar S.A.',   'SB-2025-00123', 15000000, 10, CURRENT_DATE - 60, CURRENT_DATE + 120, 'vigente',    v_usuario_id),
      (v_contrato_id, 'pago_salarios',      'Liberty Seguros S.A.',   'LB-2025-00456', 8000000,  5,  CURRENT_DATE - 60, CURRENT_DATE + 25,  'vigente',    v_usuario_id),
      (v_contrato_id, 'responsabilidad_civil', 'Suramericana S.A.',   'SU-2025-00789', 20000000, 15, CURRENT_DATE - 90, CURRENT_DATE - 5,   'vencida',    v_usuario_id)
    ON CONFLICT DO NOTHING;

    INSERT INTO actas (contrato_id, tipo_acta, numero_acta, fecha_acta, descripcion,
      estado, firmada_supervisor, firmada_contratista, creado_por)
    VALUES
      (v_contrato_id, 'inicio', 'ACTA-INI-001-2025', CURRENT_DATE - 58,
       'Se da inicio a la ejecución del contrato conforme a las obligaciones pactadas.',
       'firmada', true, true, v_usuario_id)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
