-- ============================================================
-- SISTEMA DE CONTROL DE CONTRATISTAS
-- Base de datos PostgreSQL — Esquema completo v1.0
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE rol_usuario AS ENUM ('admin', 'supervisor', 'auditor', 'contratista');
CREATE TYPE tipo_persona AS ENUM ('natural', 'juridica');
CREATE TYPE estado_contratista AS ENUM ('activo', 'suspendido', 'inhabilitado');
CREATE TYPE tipo_contrato AS ENUM (
  'prestacion_servicios', 'obra', 'suministro',
  'consultoria', 'interadministrativo', 'otro'
);
CREATE TYPE estado_contrato AS ENUM (
  'borrador', 'en_ejecucion', 'suspendido',
  'terminado', 'liquidado', 'cancelado'
);
CREATE TYPE categoria_documento AS ENUM (
  'poliza_cumplimiento', 'poliza_responsabilidad',
  'acta_inicio', 'acta_suspension', 'acta_reinicio',
  'informe_supervision', 'paz_y_salvo', 'cedula',
  'rut', 'certificacion_bancaria', 'otro'
);
CREATE TYPE estado_vencimiento AS ENUM ('vigente', 'proximo', 'vencido');
CREATE TYPE tipo_alerta AS ENUM (
  'vencimiento_contrato_30', 'vencimiento_contrato_15',
  'vencimiento_contrato_5', 'vencimiento_documento_30',
  'vencimiento_documento_15', 'vencimiento_documento_5',
  'documento_vencido', 'contrato_vencido'
);
CREATE TYPE tipo_modificacion AS ENUM ('adicion_valor', 'prorroga', 'suspension', 'otro');
CREATE TYPE accion_auditoria AS ENUM ('crear', 'actualizar', 'eliminar', 'consultar', 'login', 'logout');

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          VARCHAR(150) NOT NULL,
  email           VARCHAR(200) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  rol             rol_usuario NOT NULL DEFAULT 'supervisor',
  activo          BOOLEAN NOT NULL DEFAULT true,
  telefono        VARCHAR(20),
  avatar_url      VARCHAR(500),
  ultimo_acceso   TIMESTAMP WITH TIME ZONE,
  creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- ============================================================
-- TABLA: supervisores
-- ============================================================
CREATE TABLE supervisores (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cargo        VARCHAR(150) NOT NULL,
  dependencia  VARCHAR(200) NOT NULL,
  telefono     VARCHAR(20),
  activo       BOOLEAN NOT NULL DEFAULT true,
  creado_en    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_supervisores_usuario ON supervisores(usuario_id);

-- ============================================================
-- TABLA: contratistas
-- ============================================================
CREATE TABLE contratistas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombres           VARCHAR(150) NOT NULL,
  apellidos         VARCHAR(150),
  cedula            VARCHAR(20) UNIQUE,
  nit               VARCHAR(20),
  tipo_persona      tipo_persona NOT NULL DEFAULT 'natural',
  razon_social      VARCHAR(200),
  telefono          VARCHAR(20),
  email             VARCHAR(200),
  direccion         VARCHAR(300),
  municipio         VARCHAR(100),
  departamento      VARCHAR(100),
  banco             VARCHAR(100),
  tipo_cuenta       VARCHAR(50),
  numero_cuenta     VARCHAR(50),
  estado            estado_contratista NOT NULL DEFAULT 'activo',
  usuario_id        UUID REFERENCES usuarios(id),
  creado_por        UUID REFERENCES usuarios(id),
  creado_en         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contratistas_cedula ON contratistas(cedula);
CREATE INDEX idx_contratistas_estado ON contratistas(estado);
CREATE INDEX idx_contratistas_nombre ON contratistas(nombres, apellidos);

-- ============================================================
-- TABLA: contratos
-- ============================================================
CREATE TABLE contratos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contratista_id      UUID NOT NULL REFERENCES contratistas(id) ON DELETE RESTRICT,
  supervisor_id       UUID REFERENCES supervisores(id) ON DELETE SET NULL,
  numero_contrato     VARCHAR(60) NOT NULL UNIQUE,
  objeto              TEXT NOT NULL,
  tipo_contrato       tipo_contrato NOT NULL,
  valor_inicial       NUMERIC(18,2) NOT NULL,
  valor_actual        NUMERIC(18,2) NOT NULL,
  fecha_inicio        DATE NOT NULL,
  fecha_fin           DATE NOT NULL,
  fecha_fin_real      DATE,
  estado              estado_contrato NOT NULL DEFAULT 'borrador',
  numero_secop        VARCHAR(100),
  url_secop           VARCHAR(500),
  cdp                 VARCHAR(50),
  rp                  VARCHAR(50),
  observaciones       TEXT,
  creado_por          UUID NOT NULL REFERENCES usuarios(id),
  actualizado_por     UUID REFERENCES usuarios(id),
  creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  actualizado_en      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contratos_contratista ON contratos(contratista_id);
CREATE INDEX idx_contratos_supervisor ON contratos(supervisor_id);
CREATE INDEX idx_contratos_estado ON contratos(estado);
CREATE INDEX idx_contratos_fecha_fin ON contratos(fecha_fin);
CREATE INDEX idx_contratos_numero ON contratos(numero_contrato);

-- ============================================================
-- TABLA: documentos
-- ============================================================
CREATE TABLE documentos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id       UUID REFERENCES contratos(id) ON DELETE CASCADE,
  contratista_id    UUID REFERENCES contratistas(id) ON DELETE CASCADE,
  nombre            VARCHAR(300) NOT NULL,
  categoria         categoria_documento NOT NULL,
  url_archivo       VARCHAR(1000) NOT NULL,
  nombre_archivo    VARCHAR(300) NOT NULL,
  tamano_bytes      BIGINT,
  mime_type         VARCHAR(100),
  fecha_expedicion  DATE,
  fecha_vencimiento DATE,
  estado_vence      estado_vencimiento NOT NULL DEFAULT 'vigente',
  version           INTEGER NOT NULL DEFAULT 1,
  es_vigente        BOOLEAN NOT NULL DEFAULT true,
  hash_archivo      VARCHAR(64),
  subido_por        UUID NOT NULL REFERENCES usuarios(id),
  subido_en         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documentos_contrato ON documentos(contrato_id);
CREATE INDEX idx_documentos_contratista ON documentos(contratista_id);
CREATE INDEX idx_documentos_vencimiento ON documentos(fecha_vencimiento) WHERE fecha_vencimiento IS NOT NULL;
CREATE INDEX idx_documentos_estado_vence ON documentos(estado_vence);
CREATE INDEX idx_documentos_vigente ON documentos(es_vigente);

-- ============================================================
-- TABLA: alertas
-- ============================================================
CREATE TABLE alertas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id     UUID REFERENCES contratos(id) ON DELETE CASCADE,
  documento_id    UUID REFERENCES documentos(id) ON DELETE CASCADE,
  tipo_alerta     tipo_alerta NOT NULL,
  mensaje         TEXT NOT NULL,
  enviado_push    BOOLEAN NOT NULL DEFAULT false,
  enviado_email   BOOLEAN NOT NULL DEFAULT false,
  leida           BOOLEAN NOT NULL DEFAULT false,
  fecha_envio     TIMESTAMP WITH TIME ZONE,
  creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alertas_contrato ON alertas(contrato_id);
CREATE INDEX idx_alertas_documento ON alertas(documento_id);
CREATE INDEX idx_alertas_leida ON alertas(leida);
CREATE INDEX idx_alertas_fecha ON alertas(creado_en);

-- ============================================================
-- TABLA: adiciones_contratos
-- ============================================================
CREATE TABLE adiciones_contratos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrato_id         UUID NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
  tipo_modificacion   tipo_modificacion NOT NULL,
  valor_adicional     NUMERIC(18,2) DEFAULT 0,
  dias_adicionales    INTEGER DEFAULT 0,
  nueva_fecha_fin     DATE,
  justificacion       TEXT NOT NULL,
  resolucion          VARCHAR(100),
  creado_por          UUID NOT NULL REFERENCES usuarios(id),
  creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_adiciones_contrato ON adiciones_contratos(contrato_id);

-- ============================================================
-- TABLA: firmas_electronicas
-- ============================================================
CREATE TABLE firmas_electronicas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  documento_id    UUID NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  firmante_id     UUID NOT NULL REFERENCES usuarios(id),
  token_otp       VARCHAR(10),
  hash_documento  VARCHAR(64) NOT NULL,
  sello_tiempo    TIMESTAMP WITH TIME ZONE,
  firmado_en      TIMESTAMP WITH TIME ZONE,
  ip_firma        VARCHAR(45),
  valido          BOOLEAN NOT NULL DEFAULT false,
  razon_firma     VARCHAR(200),
  creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_firmas_documento ON firmas_electronicas(documento_id);
CREATE INDEX idx_firmas_firmante ON firmas_electronicas(firmante_id);

-- ============================================================
-- TABLA: notificaciones_push
-- ============================================================
CREATE TABLE notificaciones_push (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo        VARCHAR(200) NOT NULL,
  cuerpo        TEXT NOT NULL,
  datos_extra   JSONB,
  leida         BOOLEAN NOT NULL DEFAULT false,
  device_token  VARCHAR(500),
  enviada_en    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_push_usuario ON notificaciones_push(usuario_id);
CREATE INDEX idx_push_leida ON notificaciones_push(leida);

-- ============================================================
-- TABLA: auditoria (log inmutable de cambios)
-- ============================================================
CREATE TABLE auditoria (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id        UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  tabla_afectada    VARCHAR(60) NOT NULL,
  registro_id       VARCHAR(100),
  accion            accion_auditoria NOT NULL,
  datos_anteriores  JSONB,
  datos_nuevos      JSONB,
  ip_origen         VARCHAR(45),
  user_agent        TEXT,
  timestamp         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
CREATE INDEX idx_auditoria_timestamp ON auditoria(timestamp);
CREATE INDEX idx_auditoria_accion ON auditoria(accion);

-- ============================================================
-- FUNCIÓN: actualizar timestamp automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_usuarios_updated
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

CREATE TRIGGER tr_contratistas_updated
  BEFORE UPDATE ON contratistas
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

CREATE TRIGGER tr_contratos_updated
  BEFORE UPDATE ON contratos
  FOR EACH ROW EXECUTE FUNCTION trigger_actualizar_timestamp();

-- ============================================================
-- FUNCIÓN: calcular estado de vencimiento de documentos
-- ============================================================
CREATE OR REPLACE FUNCTION calcular_estado_vencimiento(fecha_vence DATE)
RETURNS estado_vencimiento AS $$
BEGIN
  IF fecha_vence IS NULL THEN
    RETURN 'vigente';
  ELSIF fecha_vence < CURRENT_DATE THEN
    RETURN 'vencido';
  ELSIF fecha_vence <= CURRENT_DATE + INTERVAL '30 days' THEN
    RETURN 'proximo';
  ELSE
    RETURN 'vigente';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FUNCIÓN: job automático de actualización de estados
-- ============================================================
CREATE OR REPLACE FUNCTION actualizar_estados_vencimiento()
RETURNS void AS $$
BEGIN
  UPDATE documentos
  SET estado_vence = calcular_estado_vencimiento(fecha_vencimiento)
  WHERE es_vigente = true;

  UPDATE contratos
  SET estado = 'vencido'  -- mapeado como 'terminado' en enum
  WHERE fecha_fin < CURRENT_DATE
    AND estado = 'en_ejecucion';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VISTA: dashboard principal
-- ============================================================
CREATE OR REPLACE VIEW v_dashboard AS
SELECT
  (SELECT COUNT(*) FROM contratos WHERE estado = 'en_ejecucion') AS contratos_activos,
  (SELECT COUNT(*) FROM contratos WHERE fecha_fin BETWEEN CURRENT_DATE AND CURRENT_DATE + 30 AND estado = 'en_ejecucion') AS contratos_proximos_vencer,
  (SELECT COUNT(*) FROM contratos WHERE fecha_fin < CURRENT_DATE AND estado = 'en_ejecucion') AS contratos_vencidos,
  (SELECT COUNT(*) FROM contratistas WHERE estado = 'activo') AS contratistas_activos,
  (SELECT COUNT(*) FROM documentos WHERE estado_vence = 'proximo' AND es_vigente = true) AS documentos_proximos,
  (SELECT COUNT(*) FROM documentos WHERE estado_vence = 'vencido' AND es_vigente = true) AS documentos_vencidos,
  (SELECT COALESCE(SUM(valor_actual), 0) FROM contratos WHERE estado = 'en_ejecucion') AS valor_total_contratos,
  (SELECT COUNT(*) FROM alertas WHERE leida = false) AS alertas_pendientes;

-- ============================================================
-- VISTA: contratos con información completa
-- ============================================================
CREATE OR REPLACE VIEW v_contratos_completos AS
SELECT
  c.id,
  c.numero_contrato,
  c.objeto,
  c.tipo_contrato,
  c.valor_actual,
  c.fecha_inicio,
  c.fecha_fin,
  c.estado,
  c.numero_secop,
  c.creado_en,
  -- Contratista
  ct.nombres || ' ' || COALESCE(ct.apellidos, '') AS contratista_nombre,
  ct.cedula AS contratista_cedula,
  ct.tipo_persona,
  ct.email AS contratista_email,
  ct.estado AS contratista_estado,
  -- Supervisor
  u.nombre AS supervisor_nombre,
  s.cargo AS supervisor_cargo,
  s.dependencia AS supervisor_dependencia,
  -- Días restantes
  (c.fecha_fin - CURRENT_DATE) AS dias_restantes,
  -- Estado de vencimiento calculado
  CASE
    WHEN c.fecha_fin < CURRENT_DATE THEN 'vencido'
    WHEN c.fecha_fin <= CURRENT_DATE + 30 THEN 'proximo'
    ELSE 'vigente'
  END AS semaforo,
  -- Conteo documentos
  (SELECT COUNT(*) FROM documentos d WHERE d.contrato_id = c.id AND d.es_vigente = true) AS total_documentos,
  (SELECT COUNT(*) FROM documentos d WHERE d.contrato_id = c.id AND d.estado_vence = 'vencido' AND d.es_vigente = true) AS docs_vencidos
FROM contratos c
JOIN contratistas ct ON ct.id = c.contratista_id
LEFT JOIN supervisores s ON s.id = c.supervisor_id
LEFT JOIN usuarios u ON u.id = s.usuario_id;

-- ============================================================
-- DATOS SEMILLA: usuario administrador inicial
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, rol)
VALUES (
  'Administrador Sistema',
  'admin@entidad.gov.co',
  crypt('Admin2025*', gen_salt('bf', 12)),
  'admin'
);

-- ============================================================
-- COMENTARIOS EN TABLAS
-- ============================================================
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles y permisos';
COMMENT ON TABLE contratistas IS 'Registro de personas naturales y jurídicas contratadas';
COMMENT ON TABLE contratos IS 'Contratos activos e histórico de la entidad';
COMMENT ON TABLE documentos IS 'Gestión documental asociada a contratos y contratistas';
COMMENT ON TABLE alertas IS 'Registro de alertas de vencimiento generadas';
COMMENT ON TABLE auditoria IS 'Log inmutable de todas las acciones del sistema';
COMMENT ON TABLE firmas_electronicas IS 'Registro de firmas electrónicas sobre documentos';
