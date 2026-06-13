# ContralControl — App Móvil

Aplicación React Native (Expo) para el Sistema de Control de Contratistas.

## Stack
- React Native + Expo SDK 51
- React Navigation (Bottom Tabs + Stack)
- Supabase JS (misma BD que el portal web)
- Expo Notifications (push)
- Expo SecureStore (sesión persistente)

## Pantallas
- 🔐 Login con credenciales de demo
- 📊 Dashboard — KPIs + contratos recientes + alertas
- 📋 Contratos — lista con scroll infinito + filtros + detalle
- 🔔 Alertas — feed con prioridad y resolución
- 📁 Documentos — con filtros por estado de vencimiento
- 👤 Perfil — info de usuario + logout

## Instalación
```bash
cd mobile
npm install
npx expo start
```

## Build producción
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview  # APK
eas build --platform ios     --profile preview  # IPA
```

## Variables de entorno
La app usa las mismas credenciales de Supabase ya configuradas en src/services/supabase.js