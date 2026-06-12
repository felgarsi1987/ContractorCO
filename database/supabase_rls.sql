-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Supabase
-- Ejecutar DESPUÉS de schema.sql y seed_demo.sql
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratistas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE adiciones_contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria        ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmas_electronicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_push ENABLE ROW LEVEL SECURITY;

-- Función: obtener rol del usuario actual
CREATE OR REPLACE FUNCTION get_user_rol()
RETURNS TEXT AS $$
  SELECT rol FROM usuarios WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- ── POLÍTICAS ADMIN (acceso total) ───────────────────────────
CREATE POLICY "admin_all_usuarios"     ON usuarios         FOR ALL USING (get_user_rol() = 'admin');
CREATE POLICY "admin_all_contratistas" ON contratistas     FOR ALL USING (get_user_rol() = 'admin');
CREATE POLICY "admin_all_contratos"    ON contratos        FOR ALL USING (get_user_rol() = 'admin');
CREATE POLICY "admin_all_documentos"   ON documentos       FOR ALL USING (get_user_rol() = 'admin');
CREATE POLICY "admin_all_alertas"      ON alertas          FOR ALL USING (get_user_rol() = 'admin');
CREATE POLICY "admin_all_supervisores" ON supervisores     FOR ALL USING (get_user_rol() = 'admin');
CREATE POLICY "admin_all_adiciones"    ON adiciones_contratos FOR ALL USING (get_user_rol() = 'admin');
CREATE POLICY "admin_all_auditoria"    ON auditoria        FOR ALL USING (get_user_rol() IN ('admin','auditor'));

-- ── POLÍTICAS SUPERVISOR (solo sus contratos) ────────────────
CREATE POLICY "supervisor_read_contratos" ON contratos FOR SELECT USING (
  get_user_rol() IN ('admin','auditor') OR
  supervisor_id IN (
    SELECT id FROM supervisores WHERE usuario_id = (
      SELECT id FROM usuarios WHERE email = auth.jwt() ->> 'email'
    )
  )
);

CREATE POLICY "supervisor_read_docs" ON documentos FOR SELECT USING (
  get_user_rol() IN ('admin','auditor') OR
  contrato_id IN (
    SELECT c.id FROM contratos c
    JOIN supervisores s ON s.id = c.supervisor_id
    JOIN usuarios u ON u.id = s.usuario_id
    WHERE u.email = auth.jwt() ->> 'email'
  )
);

CREATE POLICY "supervisor_insert_docs" ON documentos FOR INSERT WITH CHECK (
  get_user_rol() IN ('admin','supervisor')
);

-- ── POLÍTICAS CONTRATISTAS (solo sus datos) ──────────────────
CREATE POLICY "contratista_read_own" ON contratos FOR SELECT USING (
  get_user_rol() IN ('admin','supervisor','auditor') OR
  contratista_id IN (
    SELECT id FROM contratistas WHERE email = auth.jwt() ->> 'email'
  )
);

-- ── ALERTAS: todos pueden leer sus alertas ───────────────────
CREATE POLICY "read_alertas" ON alertas FOR SELECT USING (true);
CREATE POLICY "update_alertas" ON alertas FOR UPDATE USING (get_user_rol() IN ('admin','supervisor'));

-- ── CONTRATISTAS: lectura para roles autorizados ─────────────
CREATE POLICY "read_contratistas" ON contratistas FOR SELECT USING (
  get_user_rol() IN ('admin','supervisor','auditor')
);
CREATE POLICY "insert_contratistas" ON contratistas FOR INSERT WITH CHECK (
  get_user_rol() = 'admin'
);
CREATE POLICY "update_contratistas" ON contratistas FOR UPDATE USING (
  get_user_rol() IN ('admin','supervisor')
);

-- ── SUPERVISORES: lectura general ────────────────────────────
CREATE POLICY "read_supervisores" ON supervisores FOR SELECT USING (
  get_user_rol() IN ('admin','supervisor','auditor')
);
