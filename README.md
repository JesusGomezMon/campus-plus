# Campus + (v1)

Aplicación web progresiva (PWA) para el seguimiento de actividades académicas, pensada para teléfonos y tablets. Tiene tres perfiles:

- **Estudiante**: consulta sus próximas actividades, las filtra por estado y cambia su estado (Pendiente / En proceso / Terminada).
- **Profesor**: registra, edita y elimina actividades, y asigna cada una a un estudiante o al grupo completo.
- **Tutor**: consulta a sus tutorados y las actividades asignadas a cada uno.

Está basada en el diseño `Campus+ V2 Movil` (12 pantallas).

## Alcance de la versión 1

- No tiene backend ni inicio de sesión: los perfiles se eligen en la pantalla de inicio y los usuarios son de demostración (`src/data/seed.ts`).
- Los cambios se guardan en el navegador (`localStorage`) de cada dispositivo. Desde la pantalla de inicio se pueden restablecer los datos de ejemplo.
- Funciona sin conexión una vez cargada, y se puede instalar en la pantalla de inicio (Android/Chrome: botón «Instalar aplicación»; iPhone/iPad: Compartir → Agregar a inicio).

## Desarrollo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev       # servidor de desarrollo (http://localhost:5173)
npm run build     # compilación de producción en dist/
npm run preview   # sirve dist/ con el service worker activo (http://localhost:4173)
npm run icons     # regenera los íconos PNG desde public/favicon.svg
```

`dev` y `preview` usan `--host`, así que puedes abrir la app desde tu teléfono en la misma red Wi‑Fi usando la IP de tu computadora.

## Despliegue en Vercel

1. Sube el proyecto a un repositorio de GitHub.
2. En Vercel, **Add New → Project** e importa el repositorio. Vercel detecta Vite automáticamente (`vercel.json` ya define el build, la carpeta `dist` y las reglas de rutas para la SPA).
3. Despliega. No se necesitan variables de entorno.

También se puede desplegar con la CLI: `npx vercel` (vista previa) o `npx vercel --prod`.

## Estructura

```
src/
  main.tsx            rutas de la app
  store.tsx           estado de actividades y persistencia local
  data/               tipos y datos de demostración
  components/         estructura (Shell) y componentes compartidos
  screens/            pantallas: Home, Estudiante, Profesor, Tutor
  styles.css          estilos (colores y medidas del diseño)
public/               íconos y favicon de la PWA
vercel.json           configuración de Vercel
```

