import "server-only";
import { getDatabase } from "@/lib/db";
import type { ProductCategory, ProductInput, StoreProduct } from "@/lib/product-model";

export type { ProductCategory, ProductInput, StoreProduct } from "@/lib/product-model";

type ProductRow = {
  id: string;
  nombre: string;
  categoria: ProductCategory;
  imagen_url: string;
  precio_original: string | number | null;
  precio_venta: string | number;
  tallas: string[];
  stock: number;
  fecha_creacion: string | Date;
};

function mapProduct(row: ProductRow): StoreProduct {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    imagenUrl: row.imagen_url,
    precioOriginal: row.precio_original === null ? null : Number(row.precio_original),
    precioVenta: Number(row.precio_venta),
    tallas: row.tallas ?? [],
    stock: Number(row.stock),
    fechaCreacion: new Date(row.fecha_creacion)
  };
}

export async function listProducts(): Promise<StoreProduct[]> {
  const sql = getDatabase();
  const rows = await sql`
    SELECT id, nombre, categoria, imagen_url, precio_original, precio_venta,
           tallas, stock, fecha_creacion
    FROM productos
    ORDER BY fecha_creacion DESC
  `;

  return (rows as ProductRow[]).map(mapProduct);
}

export async function getProduct(id: string): Promise<StoreProduct | null> {
  const sql = getDatabase();
  const rows = await sql`
    SELECT id, nombre, categoria, imagen_url, precio_original, precio_venta,
           tallas, stock, fecha_creacion
    FROM productos
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows.length ? mapProduct(rows[0] as ProductRow) : null;
}

export async function createProduct(input: ProductInput): Promise<StoreProduct> {
  const sql = getDatabase();
  const rows = await sql`
    INSERT INTO productos (
      nombre, categoria, imagen_url, precio_original, precio_venta, tallas, stock
    )
    VALUES (
      ${input.nombre}, ${input.categoria}, ${input.imagenUrl}, ${input.precioOriginal},
      ${input.precioVenta}, ${input.tallas}, ${input.stock}
    )
    RETURNING id, nombre, categoria, imagen_url, precio_original, precio_venta,
              tallas, stock, fecha_creacion
  `;

  return mapProduct(rows[0] as ProductRow);
}

export async function updateProduct(id: string, input: ProductInput): Promise<StoreProduct | null> {
  const sql = getDatabase();
  const rows = await sql`
    UPDATE productos
    SET nombre = ${input.nombre},
        categoria = ${input.categoria},
        imagen_url = ${input.imagenUrl},
        precio_original = ${input.precioOriginal},
        precio_venta = ${input.precioVenta},
        tallas = ${input.tallas},
        stock = ${input.stock}
    WHERE id = ${id}
    RETURNING id, nombre, categoria, imagen_url, precio_original, precio_venta,
              tallas, stock, fecha_creacion
  `;

  return rows.length ? mapProduct(rows[0] as ProductRow) : null;
}

export async function deleteProduct(id: string) {
  const sql = getDatabase();
  const rows = await sql`DELETE FROM productos WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
