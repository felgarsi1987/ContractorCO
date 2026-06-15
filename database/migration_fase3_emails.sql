-- ============================================================
-- MIGRACIÓN FASE 3: Sistema de Notificaciones por Email
-- Preferencias por contrato/tipo, historial de envíos
-- ============================================================

-- ── TABLA: preferencias_email ────────────────────────────────
-- Permite activar/desactivar emails por usuario, contrato y tipo
CREATE TABLE IF NOT EXISTS preferencias_email (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  contrato_id   UUID REFERENCES contratos(id) ON DELETE CASCADE,
  tipo_email    VARCHAR(60) NOT NULL,
  habilitado    BOOLEAN NOT NULL DEFAULT true,
  creado_en     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, contrato_id, tipo_email)
);

CREATE INDEX IF NOT EXISTS idx_pref_email_usuario  ON preferencias_email(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pref_email_contrato ON preferencias_email(contrato_id);

-- ── TABLA: historial_emails ──────────────────────────────────
-- Log de todos los correos enviados (éxito o error)
CREATE TABLE IF NOT EXISTS historial_emails (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  para           VARCHAR(300) NOT NULL,
  asunto         VARCHAR(500) NOT NULL,
  tipo_email     VARCHAR(60) NOT NULL,
  contrato_id    UUID REFERENCES contratos(id) ON DELETE SET NULL,
  referencia_id  UUID,
  estado         VARCHAR(20) NOT NULL DEFAULT 'enviado',
  error_mensaje  TEXT,
  enviado_por    UUID REFERENCES usuarios(id),
  enviado_en     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hist_email_contrato ON historial_emails(contrato_id);
CREATE INDEX IF NOT EXISTS idx_hist_email_tipo     ON historial_emails(tipo_email);
CREATE INDEX IF NOT EXISTS idx_hist_email_para     ON historial_emails(para);

-- RLS
ALTER TABLE preferencias_email ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_emails   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pref_email_own ON preferencias_email;
CREATE POLICY pref_email_own ON preferencias_email
  FOR ALL USING (true);

DROP POLICY IF EXISTS hist_email_all ON historial_emails;
CREATE POLICY hist_email_all ON historial_emails
  FOR ALL USING (true);
