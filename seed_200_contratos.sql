-- ============================================================
-- SEED: 200 contratos + datos de prueba — ContractorCO
-- Pegar en Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. CONTRATISTAS (25 personas naturales + 15 jurídicas = 40 total)
INSERT INTO contratistas (nombres, apellidos, cedula, nit, tipo_persona, email, telefono, estado, ciudad, departamento) VALUES
-- Personas naturales
('Carlos Andrés','Martínez Torres','10234567','','natural','cmartinez@gmail.com','3001234567','activo','Bogotá','Cundinamarca'),
('María Fernanda','López Restrepo','20345678','','natural','mflopez@outlook.com','3012345678','activo','Medellín','Antioquia'),
('Juan Pablo','Ramírez Gómez','30456789','','natural','jpramirez@gmail.com','3023456789','activo','Cali','Valle del Cauca'),
('Ana Lucía','Castro Herrera','40567890','','natural','alcastro@yahoo.com','3034567890','activo','Barranquilla','Atlántico'),
('Pedro José','Vargas Moreno','50678901','','natural','pjvargas@gmail.com','3045678901','activo','Bucaramanga','Santander'),
('Luz Marina','Pérez Ávila','60789012','','natural','lmperez@gmail.com','3056789012','activo','Manizales','Caldas'),
('Andrés Felipe','González Ruiz','70890123','','natural','afgonzalez@outlook.com','3067890123','activo','Pereira','Risaralda'),
('Diana Carolina','Muñoz Cifuentes','80901234','','natural','dcmunoz@gmail.com','3078901235','activo','Ibagué','Tolima'),
('Jorge Enrique','Díaz Salcedo','91012345','','natural','jediaz@gmail.com','3089012346','activo','Villavicencio','Meta'),
('Sandra Milena','Romero Patiño','10112233','','natural','smromero@gmail.com','3090123457','activo','Pasto','Nariño'),
('Camilo','Suárez Nieto','11223344','','natural','csuarez@gmail.com','3101234568','activo','Neiva','Huila'),
('Valentina','Arango Betancur','22334455','','natural','varango@outlook.com','3112345679','activo','Santa Marta','Magdalena'),
('Ricardo','Torres Mejía','33445566','','natural','rtorres@gmail.com','3123456780','activo','Cartagena','Bolívar'),
('Natalia','Jiménez Ospina','44556677','','natural','njimenez@gmail.com','3134567891','activo','Montería','Córdoba'),
('Sebastián','Cardona Quintero','55667788','','natural','scardona@yahoo.com','3145678902','activo','Sincelejo','Sucre'),
('Paola Andrea','Giraldo Cano','66778899','','natural','pgiraldo@gmail.com','3156789013','activo','Popayán','Cauca'),
('Mauricio','Escobar Londoño','77889900','','natural','mescobar@outlook.com','3167890124','activo','Armenia','Quindío'),
('Daniela','Ríos Henao','88990011','','natural','drios@gmail.com','3178901235','activo','Tunja','Boyacá'),
('Felipe','Agudelo Zapata','99001122','','natural','fagudelo@gmail.com','3189012346','activo','Florencia','Caquetá'),
('Juliana','Ospina Vélez','10203040','','natural','jospina@gmail.com','3190123457','activo','Quibdó','Chocó'),
('Rodrigo','Salamanca Fonseca','20304050','','natural','rsalamanca@outlook.com','3201234568','activo','Valledupar','Cesar'),
('Marcela','Urrego Álvarez','30405060','','natural','murrego@gmail.com','3212345679','activo','Riohacha','Guajira'),
('Fabio','Castaño Aristizabal','40506070','','natural','fcastano@gmail.com','3223456780','activo','Mocoa','Putumayo'),
('Gloria','Benitez Sandoval','50607080','','natural','gbenitez@yahoo.com','3234567891','activo','Leticia','Amazonas'),
('Hernando','Mora Guerrero','60708090','','natural','hmora@gmail.com','3245678902','activo','Yopal','Casanare'),
-- Personas jurídicas
('Construcciones','Andinas S.A.S.','','900123456-7','juridica','info@candinas.com','6017890123','activo','Bogotá','Cundinamarca'),
('Consultores','Técnicos del Norte Ltda.','','900234567-8','juridica','contacto@ctecnicos.com','6028901234','activo','Barranquilla','Atlántico'),
('Sistemas','Integrados de Colombia S.A.','','900345678-9','juridica','ventas@sisintcol.com','6039012345','activo','Bogotá','Cundinamarca'),
('Suministros','del Pacífico S.A.S.','','900456789-0','juridica','info@sumpac.com','6040123456','activo','Cali','Valle del Cauca'),
('Ingeniería','y Medio Ambiente Ltda.','','900567890-1','juridica','ima@gmail.com','6051234567','activo','Medellín','Antioquia'),
('Servicios','Ambientales Colombianos S.A.S.','','900678901-2','juridica','sac@sac.com.co','6062345678','activo','Bucaramanga','Santander'),
('Tecnología','e Innovación TIC S.A.S.','','900789012-3','juridica','info@ticinnova.com','6073456789','activo','Bogotá','Cundinamarca'),
('Obras','Civiles del Llano S.A.S.','','900890123-4','juridica','obras@civllano.com','6084567890','activo','Villavicencio','Meta'),
('Transporte','y Logística Nacional Ltda.','','900901234-5','juridica','tln@tln.com.co','6095678901','activo','Bogotá','Cundinamarca'),
('Arquitectura','y Diseño 360 S.A.S.','','901012345-6','juridica','diseno360@gmail.com','6016789012','activo','Medellín','Antioquia'),
('Consultoría','Jurídica Asociados S.A.S.','','901123456-7','juridica','cja@cja.com.co','6017890124','activo','Bogotá','Cundinamarca'),
('Salud','y Bienestar Laboral S.A.S.','','901234567-8','juridica','salud@sbl.com.co','6028901235','activo','Cali','Valle del Cauca'),
('Educación','y Formación Continua Ltda.','','901345678-9','juridica','efc@efc.edu.co','6039012346','activo','Bogotá','Cundinamarca'),
('Mantenimiento','Industrial de Colombia S.A.','','901456789-0','juridica','mic@mic.com.co','6040123457','activo','Barranquilla','Atlántico'),
('Auditoría','y Control Fiscal S.A.S.','','901567890-1','juridica','acf@acf.com.co','6051234568','activo','Bogotá','Cundinamarca')
ON CONFLICT DO NOTHING;

-- 2. CONTRATOS (200 registros) usando generate_series
-- Necesitamos los IDs de los contratistas. Usamos subqueries.
DO $$
DECLARE
  v_user_id UUID;
  v_contratistas UUID[];
  v_objetos TEXT[];
  v_tipos TEXT[];
  v_estados TEXT[];
  v_semaforos TEXT[];
  i INTEGER;
  v_cid UUID;
  v_tipo TEXT;
  v_estado TEXT;
  v_inicio DATE;
  v_fin DATE;
  v_valor NUMERIC;
  v_numero TEXT;
  v_obj TEXT;
  v_anio INTEGER;
BEGIN
  -- Obtener el primer usuario admin disponible
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- Recopilar IDs de contratistas insertados
  SELECT ARRAY(SELECT id FROM contratistas ORDER BY creado_en LIMIT 40) INTO v_contratistas;

  -- Arrays de datos de prueba
  v_objetos := ARRAY[
    'Prestación de servicios profesionales de asesoría jurídica contractual',
    'Suministro e instalación de equipos de cómputo y periféricos',
    'Construcción de vías terciarias en zona rural',
    'Consultoría para diseño de plan de desarrollo institucional',
    'Mantenimiento preventivo y correctivo de la flota vehicular',
    'Prestación de servicios de aseo y cafetería institucional',
    'Adquisición de mobiliario y equipamiento de oficina',
    'Diseño e implementación de sistema de información gerencial',
    'Construcción de obras de infraestructura educativa',
    'Suministro de papelería y útiles de oficina',
    'Prestación de servicios de vigilancia y seguridad privada',
    'Consultoría en gestión ambiental y sostenibilidad',
    'Mantenimiento de zonas verdes e infraestructura física',
    'Prestación de servicios de comunicaciones y difusión',
    'Adquisición de software especializado y licencias',
    'Construcción y adecuación de instalaciones sanitarias',
    'Prestación de servicios de capacitación y formación',
    'Suministro de combustibles y lubricantes',
    'Estudios y diseños de planes maestros de acueducto',
    'Prestación de servicios médicos y asistenciales',
    'Interventoría técnica de proyectos de infraestructura',
    'Suministro de elementos de protección personal',
    'Consultoría en transformación digital y gobierno en línea',
    'Mantenimiento de redes eléctricas y telecomunicaciones',
    'Prestación de servicios de auditoría externa',
    'Adquisición de vehículos para el parque automotor',
    'Construcción de parques y espacios públicos recreativos',
    'Prestación de servicios de traducción e interpretación',
    'Diseño y producción de material pedagógico',
    'Suministro de alimentos para programas sociales'
  ];

  v_tipos := ARRAY[
    'prestacion_servicios','prestacion_servicios','prestacion_servicios',
    'obra','obra','consultoria','consultoria',
    'suministro','suministro','interadministrativo','otro'
  ];

  v_estados := ARRAY[
    'en_ejecucion','en_ejecucion','en_ejecucion','en_ejecucion',
    'borrador','suspendido','terminado','liquidado'
  ];

  FOR i IN 1..200 LOOP
    -- Seleccionar datos aleatorios
    v_cid     := v_contratistas[1 + (i % array_length(v_contratistas, 1))];
    v_tipo    := v_tipos[1 + (i % array_length(v_tipos, 1))];
    v_estado  := v_estados[1 + (i % array_length(v_estados, 1))];
    v_obj     := v_objetos[1 + (i % array_length(v_objetos, 1))];

    -- Fechas variadas
    v_anio := 2024 + (i % 3); -- 2024, 2025, 2026
    v_inicio := (v_anio::text || '-' || LPAD((1 + i % 12)::text, 2, '0') || '-01')::date;
    v_fin    := v_inicio + (90 + (i * 17 % 270))::integer; -- 3 a 12 meses
    v_valor  := (50000000 + (i * 7919999 % 950000000))::numeric; -- 50M a 1000M COP

    -- Número de contrato
    v_numero := 'CT-' || LPAD(i::text, 4, '0') || '-' || v_anio::text;

    -- Semáforo basado en fecha_fin
    -- (calculado automáticamente por la vista v_contratos_completos)

    INSERT INTO contratos (
      numero_contrato, objeto, tipo_contrato, valor_inicial, valor_actual,
      fecha_inicio, fecha_fin, estado, contratista_id, creado_por,
      numero_secop
    ) VALUES (
      v_numero, v_obj, v_tipo, v_valor, v_valor,
      v_inicio, v_fin, v_estado, v_cid, v_user_id,
      'SECOP-II-' || v_anio || '-' || LPAD(i::text, 6, '0')
    )
    ON CONFLICT (numero_contrato) DO NOTHING;
  END LOOP;

  RAISE NOTICE 'Contratos insertados: %', (SELECT COUNT(*) FROM contratos);
END $$;

-- 3. GARANTÍAS (para los primeros 50 contratos)
DO $$
DECLARE
  v_user_id UUID;
  v_contrato_ids UUID[];
  v_cid UUID;
  i INTEGER;
  v_inicio DATE := CURRENT_DATE - 60;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT ARRAY(SELECT id FROM contratos WHERE estado IN ('en_ejecucion','terminado') ORDER BY creado_en LIMIT 50) INTO v_contrato_ids;

  FOREACH v_cid IN ARRAY v_contrato_ids LOOP
    i := i + 1;
    INSERT INTO garantias (contrato_id, tipo_poliza, aseguradora, numero_poliza, valor_asegurado, fecha_inicio, fecha_vencimiento, creado_por)
    VALUES (
      v_cid,
      CASE WHEN i % 3 = 0 THEN 'buen_manejo' WHEN i % 3 = 1 THEN 'cumplimiento' ELSE 'responsabilidad_civil' END,
      (ARRAY['Sura','Bolivar','Liberty','Mapfre','Allianz'])[1 + (i % 5)],
      'POL-' || LPAD(i::text, 6, '0') || '-2025',
      (10000000 + i * 2000000)::numeric,
      v_inicio + (i * 3),
      v_inicio + (i * 3) + 365,
      v_user_id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 4. VERIFICACIONES SEGURIDAD SOCIAL (para primeros 30 contratos, 3 meses cada uno)
DO $$
DECLARE
  v_user_id UUID;
  v_contrato_ids UUID[];
  v_cid UUID;
  i INTEGER := 0;
  m INTEGER;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT ARRAY(SELECT id FROM contratos WHERE estado = 'en_ejecucion' ORDER BY creado_en LIMIT 30) INTO v_contrato_ids;

  FOREACH v_cid IN ARRAY v_contrato_ids LOOP
    i := i + 1;
    FOR m IN 1..3 LOOP
      INSERT INTO verificaciones_ss (contrato_id, periodo_mes, periodo_anio, valor_ibc, clase_riesgo_arl, salud_valor, pension_valor, arl_valor, salud_verificado, pension_verificado, arl_verificado, verificado_por)
      VALUES (
        v_cid,
        (3 + m), -- abril, mayo, junio
        2026,
        (3500000 + i * 150000)::numeric,
        (ARRAY['I','II','III','IV','V'])[1 + (i % 5)],
        ROUND((3500000 + i * 150000) * 0.125),
        ROUND((3500000 + i * 150000) * 0.16),
        ROUND((3500000 + i * 150000) * 0.00522),
        (m < 3), -- los 2 primeros verificados, el último pendiente
        (m < 3),
        (m < 3),
        v_user_id
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 5. REGISTROS PRESUPUESTALES CDP + RP para primeros 40 contratos
DO $$
DECLARE
  v_user_id UUID;
  v_contrato_ids UUID[];
  v_cid UUID;
  v_contrato_valor NUMERIC;
  i INTEGER := 0;
  v_cdp_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT ARRAY(SELECT id FROM contratos ORDER BY creado_en LIMIT 40) INTO v_contrato_ids;

  FOREACH v_cid IN ARRAY v_contrato_ids LOOP
    i := i + 1;
    SELECT valor_actual INTO v_contrato_valor FROM contratos WHERE id = v_cid;

    -- CDP
    INSERT INTO registros_presupuestales (tipo, numero, contrato_id, fecha_expedicion, vigencia, rubro_presupuestal, fuente_financiacion, valor, creado_por)
    VALUES (
      'cdp',
      'CDP-2026-' || LPAD(i::text, 4, '0'),
      v_cid,
      CURRENT_DATE - (60 - i)::integer,
      2026,
      '2-2-01-0' || (i % 4 + 1) || '-001',
      (ARRAY['Recursos propios','SGP','SGR','Crédito'])[1 + (i % 4)],
      v_contrato_valor,
      v_user_id
    )
    RETURNING id INTO v_cdp_id;

    -- RP (solo para contratos en ejecución)
    IF EXISTS (SELECT 1 FROM contratos WHERE id = v_cid AND estado = 'en_ejecucion') THEN
      INSERT INTO registros_presupuestales (tipo, numero, contrato_id, cdp_id, fecha_expedicion, vigencia, rubro_presupuestal, fuente_financiacion, valor, creado_por)
      VALUES (
        'rp',
        'RP-2026-' || LPAD(i::text, 4, '0'),
        v_cid,
        v_cdp_id,
        CURRENT_DATE - (50 - i)::integer,
        2026,
        '2-2-01-0' || (i % 4 + 1) || '-001',
        (ARRAY['Recursos propios','SGP','SGR','Crédito'])[1 + (i % 4)],
        v_contrato_valor,
        v_user_id
      );
    END IF;
  END LOOP;
END $$;

-- 6. PAGOS (para primeros 25 contratos en ejecución)
DO $$
DECLARE
  v_user_id UUID;
  v_contrato_ids UUID[];
  v_cid UUID;
  v_contrato_valor NUMERIC;
  i INTEGER := 0;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT ARRAY(SELECT id FROM contratos WHERE estado = 'en_ejecucion' ORDER BY creado_en LIMIT 25) INTO v_contrato_ids;

  FOREACH v_cid IN ARRAY v_contrato_ids LOOP
    i := i + 1;
    SELECT valor_actual INTO v_contrato_valor FROM contratos WHERE id = v_cid;

    INSERT INTO pagos (contrato_id, numero_pago, concepto, valor, fecha_solicitud, estado, creado_por)
    VALUES (
      v_cid,
      i,
      'Pago No. ' || i || ' - Honorarios mes ' || (i % 6 + 1),
      ROUND(v_contrato_valor * 0.25),
      CURRENT_DATE - (30 - i % 20)::integer,
      (ARRAY['pendiente','aprobado','pagado','rechazado'])[1 + (i % 4)],
      v_user_id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 7. INFORMES DE SUPERVISIÓN (para primeros 20 contratos)
DO $$
DECLARE
  v_user_id UUID;
  v_contrato_ids UUID[];
  v_cid UUID;
  i INTEGER := 0;
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT ARRAY(SELECT id FROM contratos WHERE estado = 'en_ejecucion' ORDER BY creado_en LIMIT 20) INTO v_contrato_ids;

  FOREACH v_cid IN ARRAY v_contrato_ids LOOP
    i := i + 1;
    INSERT INTO informes_supervision (contrato_id, numero_informe, periodo_inicio, periodo_fin, actividades, cumplimiento_objeto, observaciones, estado)
    VALUES (
      v_cid,
      1,
      (CURRENT_DATE - 60)::text,
      (CURRENT_DATE - 30)::text,
      'Se desarrollaron las actividades pactadas en el primer período de ejecución contractual. El contratista cumplió con los entregables establecidos en el plan de trabajo. Se verificó la calidad de los productos entregados según los parámetros técnicos del contrato.',
      70 + (i * 3 % 30),
      'El avance es satisfactorio. Se requiere mayor celeridad en la entrega de informes parciales.',
      CASE WHEN i % 3 = 0 THEN 'aprobado' WHEN i % 3 = 1 THEN 'enviado' ELSE 'borrador' END
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 8. PAA — Plan Anual de Adquisiciones 2026
DO $$
DECLARE
  v_user_id UUID;
  i INTEGER;
  v_tipos TEXT[] := ARRAY['prestacion_servicios','obra','suministro','consultoria'];
  v_estados TEXT[] := ARRAY['planeado','en_proceso','adjudicado','desierto','cancelado'];
  v_objetos TEXT[] := ARRAY[
    'Adquisición de equipos de tecnología',
    'Construcción de obras menores',
    'Servicios de consultoría estratégica',
    'Suministro de bienes de consumo',
    'Servicios de mantenimiento preventivo',
    'Contratación de personal especializado'
  ];
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  FOR i IN 1..30 LOOP
    INSERT INTO plan_adquisiciones (vigencia, descripcion, tipo_contrato, modalidad_seleccion, valor_estimado, fecha_inicio_proceso, fecha_adjudicacion_estimada, estado, creado_por)
    VALUES (
      2026,
      v_objetos[1 + (i % array_length(v_objetos, 1))] || ' — Partida ' || i,
      v_tipos[1 + (i % 4)],
      (ARRAY['licitacion_publica','seleccion_abreviada','minima_cuantia','contratacion_directa'])[1 + (i % 4)],
      (20000000 + i * 15000000)::numeric,
      (DATE '2026-01-01' + (i * 12))::date,
      (DATE '2026-01-01' + (i * 12) + 30)::date,
      v_estados[1 + (i % 5)],
      v_user_id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- 9. CONSULTAS INHABILIDADES (para primeros 20 contratistas)
DO $$
DECLARE
  v_user_id UUID;
  v_contratista_ids UUID[];
  v_cid UUID;
  i INTEGER := 0;
  v_fuentes TEXT[] := ARRAY['procuraduria_siri','contraloria','rama_judicial','policia','dian'];
  v_resultados TEXT[] := ARRAY['limpio','limpio','limpio','limpio','suspendido','inhabilitado'];
BEGIN
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  SELECT ARRAY(SELECT id FROM contratistas ORDER BY creado_en LIMIT 20) INTO v_contratista_ids;

  FOREACH v_cid IN ARRAY v_contratista_ids LOOP
    i := i + 1;
    INSERT INTO consultas_inhabilidades (contratista_id, fuente, fecha_consulta, resultado, vigente_hasta, consultado_por)
    VALUES (
      v_cid,
      v_fuentes[1 + (i % 5)],
      CURRENT_DATE - (i * 7)::integer,
      v_resultados[1 + (i % 6)],
      CURRENT_DATE + (180 - i * 5)::integer,
      v_user_id
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Verificación final
SELECT
  'contratistas' as tabla, COUNT(*) FROM contratistas
UNION ALL SELECT 'contratos', COUNT(*) FROM contratos
UNION ALL SELECT 'garantias', COUNT(*) FROM garantias
UNION ALL SELECT 'verificaciones_ss', COUNT(*) FROM verificaciones_ss
UNION ALL SELECT 'registros_presupuestales', COUNT(*) FROM registros_presupuestales
UNION ALL SELECT 'pagos', COUNT(*) FROM pagos
UNION ALL SELECT 'informes_supervision', COUNT(*) FROM informes_supervision
UNION ALL SELECT 'plan_adquisiciones', COUNT(*) FROM plan_adquisiciones
UNION ALL SELECT 'consultas_inhabilidades', COUNT(*) FROM consultas_inhabilidades;
