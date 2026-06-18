-- ============================================================
-- RLS POLICIES — tablas de migraciones (fases 1-4)
-- Aplicar después de ejecutar las migraciones de fases.
-- Sigue el mismo patrón que supabase_rls.sql:
--   admin → ALL, supervisor → SELECT+INSERT+UPDATE, auditor → SELECT
-- ============================================================

-- ============================================================
-- garantias (fase 1 normatividad)
-- ============================================================
CREATE POLICY "admin_all_garantias" ON garantias
  FOR ALL USING (get_user_rol() = 'admin'::text);

CREATE POLICY "read_garantias" ON garantias
  FOR SELECT USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text,'auditor'::text,'contratista'::text]));

CREATE POLICY "supervisor_insert_garantias" ON garantias
  FOR INSERT WITH CHECK (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

CREATE POLICY "supervisor_update_garantias" ON garantias
  FOR UPDATE USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

-- ============================================================
-- pagos (fase 1 normatividad)
-- ============================================================
CREATE POLICY "admin_all_pagos" ON pagos
  FOR ALL USING (get_user_rol() = 'admin'::text);

CREATE POLICY "read_pagos" ON pagos
  FOR SELECT USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text,'auditor'::text]));

CREATE POLICY "supervisor_insert_pagos" ON pagos
  FOR INSERT WITH CHECK (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

CREATE POLICY "supervisor_update_pagos" ON pagos
  FOR UPDATE USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

-- ============================================================
-- informes_supervision (fase 1 normatividad)
-- ============================================================
CREATE POLICY "admin_all_informes" ON informes_supervision
  FOR ALL USING (get_user_rol() = 'admin'::text);

CREATE POLICY "read_informes" ON informes_supervision
  FOR SELECT USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text,'auditor'::text]));

CREATE POLICY "supervisor_insert_informes" ON informes_supervision
  FOR INSERT WITH CHECK (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

CREATE POLICY "supervisor_update_informes" ON informes_supervision
  FOR UPDATE USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

-- ============================================================
-- plan_adquisiciones (fase 1 normatividad)
-- ============================================================
CREATE POLICY "admin_all_plan" ON plan_adquisiciones
  FOR ALL USING (get_user_rol() = 'admin'::text);

CREATE POLICY "read_plan" ON plan_adquisiciones
  FOR SELECT USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text,'auditor'::text]));

CREATE POLICY "supervisor_insert_plan" ON plan_adquisiciones
  FOR INSERT WITH CHECK (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

CREATE POLICY "supervisor_update_plan" ON plan_adquisiciones
  FOR UPDATE USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

-- ============================================================
-- actas (fase 1 normatividad)
-- ============================================================
CREATE POLICY "admin_all_actas" ON actas
  FOR ALL USING (get_user_rol() = 'admin'::text);

CREATE POLICY "read_actas" ON actas
  FOR SELECT USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text,'auditor'::text,'contratista'::text]));

CREATE POLICY "supervisor_insert_actas" ON actas
  FOR INSERT WITH CHECK (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

CREATE POLICY "supervisor_update_actas" ON actas
  FOR UPDATE USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

-- ============================================================
-- consultas_inhabilidades (fase 1 normatividad)
-- ============================================================
CREATE POLICY "admin_all_inhab" ON consultas_inhabilidades
  FOR ALL USING (get_user_rol() = 'admin'::text);

CREATE POLICY "read_inhab" ON consultas_inhabilidades
  FOR SELECT USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text,'auditor'::text]));

CREATE POLICY "supervisor_insert_inhab" ON consultas_inhabilidades
  FOR INSERT WITH CHECK (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));

-- ============================================================
-- firmas_electronicas
-- ============================================================
CREATE POLICY "admin_all_firmas" ON firmas_electronicas
  FOR ALL USING (get_user_rol() = 'admin'::text);

CREATE POLICY "read_firmas" ON firmas_electronicas
  FOR SELECT USING (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text,'auditor'::text,'contratista'::text]));

CREATE POLICY "write_firmas" ON firmas_electronicas
  FOR INSERT WITH CHECK (get_user_rol() IS NOT NULL);

-- ============================================================
-- notificaciones_push
-- Cada usuario solo ve sus propias notificaciones
-- ============================================================
CREATE POLICY "admin_all_notif_push" ON notificaciones_push
  FOR ALL USING (get_user_rol() = 'admin'::text);

CREATE POLICY "read_own_notif_push" ON notificaciones_push
  FOR SELECT USING (
    get_user_rol() = 'admin'::text OR
    usuario_id = (SELECT id FROM usuarios WHERE email = (auth.jwt() ->> 'email'))
  );

CREATE POLICY "write_notif_push" ON notificaciones_push
  FOR INSERT WITH CHECK (get_user_rol() = ANY (ARRAY['admin'::text,'supervisor'::text]));
