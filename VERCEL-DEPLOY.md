# Store MAY — publicación en Vercel

Esta carpeta contiene el frontend, el dashboard, los endpoints, las migraciones de Neon,
la integración con ImageKit y la plantilla de importación masiva.

## 1. Importar el proyecto

Sube esta carpeta a un repositorio privado de GitHub e impórtalo desde Vercel, o ejecuta
`vercel` desde esta misma carpeta. Vercel detectará Next.js automáticamente.

## 2. Variables de entorno

En **Vercel → Project Settings → Environment Variables**, agrega para Production,
Preview y Development:

- `DATABASE_URL`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_URL_ENDPOINT`
- `SESSION_SECRET` (mínimo 48 caracteres aleatorios)
- `NEXT_PUBLIC_SITE_URL` (el dominio final con `https://`)
- `NEXT_PUBLIC_WHATSAPP_NUMBER` (código de país y número, sólo dígitos)

No subas `.env.local`. `ADMIN_PASSWORD` tampoco debe permanecer en Vercel.

## 3. Preparar Neon una sola vez

Desde una computadora segura, crea `.env.local` a partir de `.env.example` y ejecuta:

```bash
npm ci
npm run db:migrate
npm run admin:create -- --username "correo-del-dueno" --password "contraseña-segura"
npm run security:check
```

La contraseña queda almacenada como hash bcrypt en Neon; no se publica en el código.

## 4. Publicar

Pulsa **Deploy** en Vercel. Después configura el dominio y reemplaza
`NEXT_PUBLIC_SITE_URL` por la URL definitiva; vuelve a desplegar para actualizar canonical,
sitemap y datos estructurados.

## Rutas principales

- Web pública: `/`
- Catálogo: `/catalogo`
- Acceso del dueño: `/dashboard/login`
- Productos: `/dashboard`
- Nuevo producto: `/dashboard/productos/nuevo`
- Importación Excel: `/dashboard/importar`
- Estadísticas: `/dashboard/estadisticas`

Las fotos se cargan directamente desde el navegador autenticado a ImageKit mediante
credenciales de un solo uso. La clave privada permanece siempre en el servidor.
