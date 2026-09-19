# Campus+ (v1)

Aplicación web progresiva (PWA) para gestionar actividades (tareas) entre tres roles. Está pensada principalmente para teléfonos y tabletas.

- **Estudiante:** consulta sus próximas actividades, las filtra por estado y actualiza su avance (Pendiente / En proceso / Terminada).
- **Profesor:** registra, edita y elimina actividades para un estudiante o para todo el grupo, y ve el avance de cada estudiante.
- **Tutor:** consulta a sus tutorados y el estado de sus actividades.

Tecnologías: React 19 + TypeScript + Vite · PostgreSQL en Supabase (autenticación y Row Level Security) · Vercel.

## Puesta en marcha

Requiere Node.js 20 o superior.

```bash
npm install
cp .env.example .env.local   # llena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173 (también accesible desde tu red local)
```

Si no hay configuración de Supabase, la app arranca en **modo demostración**: eliges un perfil sin contraseña y los datos se guardan en el navegador.

### Base de datos (Supabase)

1. Crea un proyecto en supabase.com.
2. En *SQL Editor*, ejecuta **una sola vez** el archivo `supabase/migrations/0001_esquema.sql`. Crea las tablas, las políticas RLS, las funciones y la auditoría.
3. En `.env.local` agrega `SUPABASE_SERVICE_ROLE_KEY` y `SEED_PASSWORD`. Estas variables solo sirven para cargar datos y **nunca** se suben al repositorio ni a Vercel.
4. Carga las cuentas de prueba y las actividades de ejemplo con `npm run db:seed`.
5. Comprueba la seguridad con cada rol contra la base real con `npm run db:verificar`.

Cuentas de prueba (todas con la contraseña `SEED_PASSWORD`): `profesor@`, `tutor@`, `ana@`, `luis@`, `marisol@` y `diego@campusplus.test`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` / `npm run build` / `npm run preview` | Desarrollo, compilación de producción y vista previa |
| `npm test` | Pruebas unitarias, de base de datos (PostgreSQL en memoria) y de interfaz |
| `npm run test:integracion` | Pruebas del adaptador contra Supabase real |
| `npm run test:e2e` | Playwright en teléfono y tableta: flujos, PWA, seguridad y accesibilidad |
| `npm run test:cobertura` | Cobertura de código |
| `npm run db:seed` · `db:verificar` · `db:medir` | Datos de ejemplo, verificación de RLS y medición de latencia |
| `npm run verificar` | Compilación + pruebas + E2E |

## Despliegue en Vercel

1. Importa el repositorio en Vercel. Detecta Vite solo, y `vercel.json` ya define las rutas de la SPA y los encabezados de seguridad (CSP y HSTS).
2. Agrega las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. Presiona *Deploy*. Cada push a `main` vuelve a desplegar.

## Estructura

```
src/
  app/          rutas, sesión y acceso a datos desde la UI
  components/   estructura (Shell con guardia por rol) y componentes
  domain/       tipos y reglas de negocio (sin dependencias)
  data/         puerto Repositorio y adaptadores Supabase / memoria
  screens/      pantallas de cada rol
supabase/       migración SQL
tests/          unitarias, base de datos, interfaz e integración
e2e/            pruebas de extremo a extremo y accesibilidad
docs/           documentación de la entrega, diagramas y capturas
```

## Documentación

Los documentos de la entrega (requerimientos, diseño, código, gestión de datos y pruebas) se generan con:

```bash
node docs/generador/generar.mjs
```

Los archivos quedan en `docs/entregables/`. Antes de generarlos hay que ejecutar las pruebas con sus reportes (ver `docs/generador/`).
