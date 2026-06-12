-- ============================================================
-- CREAR USUARIOS EN SUPABASE AUTH
-- Ejecutar en SQL Editor de Supabase ANTES del seed_demo.sql
-- Esto crea los usuarios en auth.users con las contraseñas reales
-- ============================================================

-- Insertar usuarios directamente en auth.users de Supabase
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@contractorco.gov.co',
    crypt('Admin2025*', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Admin Principal"}',
    false, 'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'p.suarez@contractorco.gov.co',
    crypt('Super2025*', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Patricia Suárez"}',
    false, 'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'r.munoz@contractorco.gov.co',
    crypt('Super2025*', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Roberto Muñoz"}',
    false, 'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'l.castillo@contractorco.gov.co',
    crypt('Super2025*', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Laura Castillo"}',
    false, 'authenticated', 'authenticated'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'auditor@contraloria.gov.co',
    crypt('Audit2025*', gen_salt('bf')),
    NOW(), NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"nombre":"Auditor Externo"}',
    false, 'authenticated', 'authenticated'
  )
ON CONFLICT (id) DO UPDATE SET
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
  updated_at = NOW();

-- Insertar identidades (necesario para login con email)
INSERT INTO auth.identities (
  id, user_id, provider_id, provider,
  identity_data, created_at, updated_at, last_sign_in_at
)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@contractorco.gov.co',    'email', '{"sub":"00000000-0000-0000-0000-000000000001","email":"admin@contractorco.gov.co"}',    NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'p.suarez@contractorco.gov.co', 'email', '{"sub":"00000000-0000-0000-0000-000000000002","email":"p.suarez@contractorco.gov.co"}', NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'r.munoz@contractorco.gov.co',  'email', '{"sub":"00000000-0000-0000-0000-000000000003","email":"r.munoz@contractorco.gov.co"}',  NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'l.castillo@contractorco.gov.co','email','{"sub":"00000000-0000-0000-0000-000000000004","email":"l.castillo@contractorco.gov.co"}',NOW(), NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'auditor@contraloria.gov.co',   'email', '{"sub":"00000000-0000-0000-0000-000000000005","email":"auditor@contraloria.gov.co"}',   NOW(), NOW(), NOW())
ON CONFLICT (provider, provider_id) DO NOTHING;
