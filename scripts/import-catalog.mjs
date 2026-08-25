import fs from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Falta DATABASE_URL en .env.local");

const sourcePath = path.join(process.cwd(), "data", "catalogo.json");
const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const sql = neon(connectionString);

const titleCase = (value) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("es")
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("es"));

const categoryLabels = {
  mujeres: "Mujer",
  hombres: "Hombre",
  ninos: "Niños",
  accesorios: "Accesorios"
};

let imported = 0;
let skipped = 0;

for (const item of source) {
  const category = categoryLabels[item.categoria] ?? titleCase(item.categoria);
  const imageUrls = [item.imagen, ...(Array.isArray(item.galeria) ? item.galeria : [])].filter(Boolean);
  const sizesAvailable = Array.isArray(item.tallas) && item.tallas.length
    ? item.tallas.join(", ")
    : "Consultar";
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

  const rows = await sql`
    INSERT INTO products (
      name, description, brand, category, type, color, gender, price,
      sizes_available, status, image_urls, whatsapp_number
    )
    SELECT
      ${item.nombre}, ${item.descripcion ?? ""}, ${item.marca ?? ""}, ${category},
      ${titleCase(item.subcategoria)}, ${item.color ?? ""}, ${item.genero ?? "Unisex"},
      ${Number(item.precio ?? 0)}, ${sizesAvailable},
      ${item.disponible === false ? "agotado" : "disponible"}, ${imageUrls}, ${whatsappNumber}
    WHERE NOT EXISTS (
      SELECT 1 FROM products
      WHERE lower(name) = lower(${item.nombre})
        AND lower(category) = lower(${category})
    )
    RETURNING id
  `;

  if (rows.length) imported += 1;
  else skipped += 1;
}

console.log(`Catálogo preparado: ${imported} importados, ${skipped} existentes.`);
