-- ============================================================
-- DATOS DE DEMO — ContractorCO
-- Ejecutar en Supabase SQL Editor DESPUÉS del schema.sql
-- ============================================================

-- Usuarios del sistema
INSERT INTO usuarios (id, nombre, email, password_hash, rol) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin Principal',    'admin@contractorco.gov.co',      crypt('Admin2025*',    gen_salt('bf',10)), 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Patricia Suárez',    'p.suarez@contractorco.gov.co',   crypt('Super2025*',    gen_salt('bf',10)), 'supervisor'),
  ('00000000-0000-0000-0000-000000000003', 'Roberto Muñoz',      'r.munoz@contractorco.gov.co',    crypt('Super2025*',    gen_salt('bf',10)), 'supervisor'),
  ('00000000-0000-0000-0000-000000000004', 'Laura Castillo',     'l.castillo@contractorco.gov.co', crypt('Super2025*',    gen_salt('bf',10)), 'supervisor'),
  ('00000000-0000-0000-0000-000000000005', 'Auditor Externo',    'auditor@contraloria.gov.co',     crypt('Audit2025*',    gen_salt('bf',10)), 'auditor')
ON CONFLICT (email) DO NOTHING;

-- Supervisores
INSERT INTO supervisores (id, usuario_id, cargo, dependencia) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Jefe de Departamento',  'Sistemas e Informática'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'Coordinador',           'Infraestructura y Obras'),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'Profesional Esp.',      'Talento Humano')
ON CONFLICT (id) DO NOTHING;

-- Contratistas
INSERT INTO contratistas (id, nombres, apellidos, cedula, tipo_persona, telefono, email, municipio, departamento, estado, creado_por) VALUES
  ('20000000-0000-0000-0000-000000000001', 'Carlos',        'Mejía Torres',    '10425887',  'natural',  '3101234567', 'cmejia@gmail.com',        'Cali',            'Valle del Cauca', 'activo', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Constructora',  'Andes S.A.S',     NULL,        'juridica', '6024456789', 'info@construandes.com',   'Buenaventura',    'Valle del Cauca', 'activo', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000003', 'María Lucía',   'Reyes Ospina',    '31882015',  'natural',  '3156789012', 'm.reyes@outlook.com',     'Palmira',         'Valle del Cauca', 'activo', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000004', 'Ingeniería',    'XYZ Ltda',        NULL,        'juridica', '6015551234', 'gerencia@ingexyz.co',     'Bogotá',          'Cundinamarca',    'activo', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000005', 'Andrés Felipe', 'Mora Salazar',    '80214770',  'natural',  '3209876543', 'afmora@hotmail.com',      'Cali',            'Valle del Cauca', 'activo', '00000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000006', 'Distribuidora', 'Norte S.A.S',     NULL,        'juridica', '6075559876', 'ventas@distnorte.com',    'Cali',            'Valle del Cauca', 'activo', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Contratos
INSERT INTO contratos (id, contratista_id, supervisor_id, numero_contrato, objeto, tipo_contrato, valor_inicial, valor_actual, fecha_inicio, fecha_fin, estado, numero_secop, creado_por) VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PSS-2025-041', 'Soporte técnico sistemas de información y mantenimiento preventivo equipos de cómputo', 'prestacion_servicios', 8400000, 8400000, '2025-02-03', CURRENT_DATE + 62, 'en_ejecucion', 'CO1.PCCNTR.1054827', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'OBR-2025-018', 'Adecuación y mejoramiento de oficinas piso 3 sede principal',                         'obra',                142000000, 142000000, '2025-01-15', CURRENT_DATE + 49, 'en_ejecucion', 'CO1.PCCNTR.1054828', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'PSS-2025-033', 'Asesoría jurídica en contratación pública y gestión administrativa',                  'prestacion_servicios', 24000000, 24000000, '2025-01-01', CURRENT_DATE - 6,  'en_ejecucion', 'CO1.PCCNTR.1054829', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'CON-2025-007', 'Consultoría para elaboración plan maestro de acueducto municipal 2025-2035',           'consultoria',         380000000, 380000000, '2025-03-01', CURRENT_DATE + 156, 'en_ejecucion', 'CO1.PCCNTR.1054830', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'SUM-2025-022', 'Suministro de papelería, útiles de oficina e insumos de impresión vigencia 2025',     'suministro',          18700000, 18700000, '2025-01-01', CURRENT_DATE + 3,   'en_ejecucion', 'CO1.PCCNTR.1054831', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'PSS-2025-055', 'Digitación y gestión de archivo documental físico y digital',                        'prestacion_servicios', 7200000,  7200000,  '2025-04-01', CURRENT_DATE + 202, 'en_ejecucion', NULL, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (numero_contrato) DO NOTHING;

-- Alertas de ejemplo
INSERT INTO alertas (contrato_id, tipo_alerta, mensaje) VALUES
  ('30000000-0000-0000-0000-000000000003', 'vencimiento_contrato_5',   'El contrato PSS-2025-033 vence en menos de 6 días. Requiere liquidación urgente.'),
  ('30000000-0000-0000-0000-000000000005', 'vencimiento_documento_5',   'Póliza de cumplimiento SUM-2025-022 vence en 3 días.'),
  ('30000000-0000-0000-0000-000000000002', 'vencimiento_contrato_15',  'El contrato OBR-2025-018 vence en 15 días (próximo 30/07/2025).'),
  ('30000000-0000-0000-0000-000000000001', 'vencimiento_documento_30', 'Póliza de cumplimiento PSS-2025-041 vence en 30 días.'),
  ('30000000-0000-0000-0000-000000000004', 'vencimiento_documento_30', 'RUT de Ingeniería XYZ Ltda vence en 28 días.')
ON CONFLICT DO NOTHING;

-- Auditoría inicial
INSERT INTO auditoria (usuario_id, tabla_afectada, registro_id, accion, datos_nuevos, ip_origen) VALUES
  ('00000000-0000-0000-0000-000000000001', 'contratos', '30000000-0000-0000-0000-000000000001', 'crear', '{"numero":"PSS-2025-041"}', '192.168.1.10'),
  ('00000000-0000-0000-0000-000000000002', 'documentos', NULL, 'crear', '{"nombre":"Acta de inicio PSS-041"}', '192.168.1.42'),
  ('00000000-0000-0000-0000-000000000001', 'contratos', '30000000-0000-0000-0000-000000000004', 'crear', '{"numero":"CON-2025-007"}', '192.168.1.10');
