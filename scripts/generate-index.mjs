import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const rawTarget = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:4174/";
const target = new URL(rawTarget);
const isSecureRemote = target.protocol === "https:";
const isLocal = target.protocol === "http:" && ["127.0.0.1", "localhost"].includes(target.hostname);

if (!isSecureRemote && !isLocal) {
  throw new Error("NEXT_PUBLIC_SITE_URL debe usar HTTPS; HTTP solo se permite para localhost.");
}

target.pathname = "/";
target.search = "";
target.hash = "";

const href = target.toString().replaceAll("&", "&amp;").replaceAll('"', "&quot;");
const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; navigate-to ${target.origin}">
  <meta http-equiv="refresh" content="0;url=${href}">
  <title>Abriendo Store MAY…</title>
  <style>html{color-scheme:light}body{min-height:100vh;display:grid;place-items:center;margin:0;background:#f7f7f5;color:#111315;font-family:Arial,sans-serif}main{text-align:center}strong{display:block;font-size:2rem;letter-spacing:.16em}a{display:inline-block;margin-top:1rem;color:inherit}</style>
</head>
<body>
  <main><strong>STORE MAY</strong><a href="${href}" rel="noreferrer">Abrir la tienda</a></main>
</body>
</html>
`;

await writeFile(resolve(process.cwd(), "index.html"), html, "utf8");
console.log(`index.html actualizado → ${target.toString()}`);
