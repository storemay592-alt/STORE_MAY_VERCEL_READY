# Store MAY — Tienda premium

Tienda multimarca construida con Next.js, TypeScript, Neon PostgreSQL e ImageKit.

## Inicio automático en Windows

Ejecuta `start-store-may.cmd`. El script instala las dependencias si faltan, verifica TypeScript, compila la aplicación, inicia el servidor en el puerto 4174 y abre el navegador automáticamente.

`index.html` es un acceso de compatibilidad generado por `npm run release:index`; al abrirlo redirige a la URL definida en `NEXT_PUBLIC_SITE_URL` o al servidor local. La aplicación real no es un sitio estático: el punto de entrada es `app/page.tsx` y requiere un hosting compatible con Next.js porque el catálogo, el dashboard, Neon y las rutas API se ejecutan en servidor. **GitHub Pages no es suficiente**; usa GitHub como repositorio y Vercel como hosting.

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
- Importación Excel + fotos: `http://localhost:3000/dashboard/importar`

La importación masiva usa la plantilla descargable `public/plantillas/plantilla-store-may.xlsx`
y también acepta la matriz histórica de siete columnas aunque los encabezados estén en las
primeras diez filas. Si faltan TALLA o ESTADO se usan `Consultar` y `STOCK`, respectivamente.
El Excel se analiza en el servidor, compara `ARTICULO` y `MODELO` con el nombre de cada foto
y obliga a revisar cualquier coincidencia menor o igual al 85 %. Las imágenes se envían
directamente a ImageKit únicamente al confirmar. `STOCK` publica el producto y `SOLD` lo
guarda como agotado. Al repetir una matriz, el modo predeterminado omite productos existentes
y solo crea los nuevos; nunca borra ni reemplaza datos sin elegirlo expresamente. El listado
principal permite buscar por producto, código, marca o modelo y cambiar STOCK/SOLD en línea.
Después de desplegar esta versión, ejecuta `npm run db:migrate` una vez
contra la base de datos Neon de producción para añadir `article`, `model` y `brand_price`.

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

Para preparar una entrega completa y generar de nuevo `index.html`:

```bash
npm run release:prepare
```

Antes de publicar, valida los secretos, HTTPS y TLS de Neon:

```bash
npm run security:check
```

La guía completa de endurecimiento del dominio, SSL, DNSSEC, WAF, backups y cuentas externas está en [`SECURITY.md`](./SECURITY.md).
La configuración de DNS, correo anti-phishing, CAA, SPF, DKIM, DMARC y Search Console está en [`DNS-SECURITY.md`](./DNS-SECURITY.md).

## Subir a GitHub

1. Crea un repositorio **privado** vacío.
2. Sube todo el contenido de esta carpeta excepto los archivos ignorados por `.gitignore`.
3. En GitHub activa **Dependabot alerts**, **Secret scanning / Push protection**, **Private vulnerability reporting** y las reglas de protección de la rama principal.
4. Importa el repositorio en Vercel y agrega las variables de `.env.example` usando valores reales en el gestor cifrado de Vercel.
5. Ejecuta las migraciones y crea el usuario administrador desde una computadora segura. No subas `.env.local` ni certificados.

El repositorio incluye verificaciones automáticas de compilación, auditoría de dependencias, TypeScript, Dependabot y CodeQL.

Para publicar específicamente en Vercel, sigue [`VERCEL-DEPLOY.md`](./VERCEL-DEPLOY.md).
Las cargas de imágenes del dashboard van directamente a ImageKit con autorización temporal,
evitando el límite de carga de las funciones de Vercel sin exponer la clave privada.
