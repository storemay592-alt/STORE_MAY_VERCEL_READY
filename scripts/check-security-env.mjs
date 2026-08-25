import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const failures = [];
const warnings = [];

function httpsUrl(name, value) {
  try {
    const url = new URL(value ?? "");
    if (url.protocol !== "https:") failures.push(`${name} debe usar https://`);
    if (url.hostname === "localhost") failures.push(`${name} no puede apuntar a localhost en producción.`);
    return url;
  } catch {
    failures.push(`${name} no contiene una URL válida.`);
    return null;
  }
}

const siteUrl = httpsUrl("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL);
httpsUrl("IMAGEKIT_URL_ENDPOINT", process.env.IMAGEKIT_URL_ENDPOINT);

try {
  const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
  const sslMode = databaseUrl.searchParams.get("sslmode");
  if (!['require', 'verify-full'].includes(sslMode ?? "")) {
    failures.push("DATABASE_URL debe incluir sslmode=require o sslmode=verify-full.");
  }
} catch {
  failures.push("DATABASE_URL no contiene una conexión válida.");
}

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 48) {
  failures.push("SESSION_SECRET debe ser aleatorio y tener al menos 48 caracteres en producción.");
}

if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_PUBLIC_KEY) {
  failures.push("Faltan las claves privadas de ImageKit.");
}

if (process.env.ADMIN_PASSWORD) {
  warnings.push("Elimina ADMIN_PASSWORD del hosting después de crear el usuario; el hash ya está en Neon.");
}

if (siteUrl && siteUrl.pathname !== "/") {
  warnings.push("NEXT_PUBLIC_SITE_URL debería apuntar al origen del dominio, sin una ruta adicional.");
}

for (const warning of warnings) console.warn(`ADVERTENCIA: ${warning}`);
if (failures.length) {
  for (const failure of failures) console.error(`ERROR: ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Configuración de producción segura: OK");
}
