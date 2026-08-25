# Store MAY — Tienda premium

Tienda multimarca construida con Next.js, TypeScript, Neon PostgreSQL e ImageKit.

## Configuración privada

Copia `.env.example` como `.env.local` y completa, sin subir el archivo al repositorio:

- `DATABASE_URL`: conexión PostgreSQL de Neon.
- `IMAGEKIT_PRIVATE_KEY`: clave privada de ImageKit, solo disponible en el servidor.
- `IMAGEKIT_PUBLIC_KEY`: clave pública de ImageKit.
- `IMAGEKIT_URL_ENDPOINT`: URL endpoint asignada por ImageKit.
- `ADMIN_EMAIL`: correo único del dueño.
- `ADMIN_PASSWORD`: solo se usa para preparar al primer usuario; elimínala del hosting después.
- `SESSION_SECRET`: valor aleatorio de al menos 48 caracteres.

Prepara las tablas del catálogo, usuarios y estadísticas una sola vez:

```bash
npm run db:migrate
```

Importa los productos que ya existen en `data/catalogo.json` sin duplicarlos:

```bash
npm run catalog:import
```

Crea o actualiza el primer usuario dueño. La contraseña se almacena como hash bcrypt:

```bash
npm run admin:create -- --username duena@storemay.com --password "una-clave-segura"
```

La contraseña debe tener al menos 12 caracteres, mayúscula, minúscula, número y símbolo. Después de crear el usuario, retira `ADMIN_PASSWORD` del entorno de producción.

## Desarrollo

```bash
npm install
npm run dev
```

La página queda disponible en `http://localhost:3000`.

- Catálogo público: `http://localhost:3000/catalogo`
- Panel privado: `http://localhost:3000/dashboard/login`
- Estadísticas: `http://localhost:3000/dashboard/estadisticas`

Las rutas anteriores `/admin` y `/admin/login` redirigen al nuevo dashboard.

## Producción

Define la URL pública para que los enlaces canónicos, el sitemap y los datos
estructurados apunten al dominio final:

```bash
NEXT_PUBLIC_SITE_URL=https://www.tudominio.com
```

```bash
npm run build
npm start
```

Antes de publicar, valida los secretos, HTTPS y TLS de Neon:

```bash
npm run security:check
```

La guía completa de endurecimiento del dominio, SSL, DNSSEC, WAF, backups y cuentas externas está en [`SECURITY.md`](./SECURITY.md).

Para publicar específicamente en Vercel, sigue [`VERCEL-DEPLOY.md`](./VERCEL-DEPLOY.md).
Las cargas de imágenes del dashboard van directamente a ImageKit con autorización temporal,
evitando el límite de carga de las funciones de Vercel sin exponer la clave privada.
