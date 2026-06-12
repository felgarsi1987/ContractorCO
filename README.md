# ContractorCO — Sistema de Control de Contratistas

Portal web institucional + API REST para la gestión y control de contratistas de entidades públicas colombianas.

## Stack

| Capa       | Tecnología |
|------------|-----------|
| Frontend   | React 18 + React Router 6 |
| Backend    | Node.js + Express |
| Base de datos | PostgreSQL 14+ |
| Auth       | JWT + bcrypt |
| Docs       | AWS S3 (configurable) |
| Push       | Firebase Cloud Messaging |
| Emails     | SendGrid |

## Módulos

- ✅ Registro de contratistas
- ✅ Gestión de contratos (ciclo de vida completo)
- ✅ Control de vencimientos (semáforo)
- ✅ Cargue de documentos
- ✅ Alertas automáticas (cron diario 6am)
- ✅ Reportes y dashboards
- ✅ Gestión de supervisores
- ✅ Roles y permisos (admin / supervisor / auditor / contratista)
- ✅ Auditoría de cambios (log inmutable)
- 🔄 Firma electrónica
- 🔄 Integración SECOP II

## Instalación rápida

### 1. Base de datos
```bash
createdb contratistas_db
psql -U postgres -d contratistas_db -f database/schema.sql
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
# API en http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm start
# Portal en http://localhost:3000
```

## Credenciales de prueba
- Email: `admin@entidad.gov.co`
- Password: `Admin2025*`

## Estructura
```
ContractorCO/
├── database/          # Schema PostgreSQL
├── backend/           # API REST Node.js/Express
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       └── config/
├── frontend/          # Portal React
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── styles/
└── docs/              # Documentación
```

## Diseño
Basado en el design system Stitch (Google) con paleta institucional navy `#041638`, tipografía Inter y Material Symbols.

---
Desarrollado por el equipo ContractorCO · Colombia 🇨🇴
