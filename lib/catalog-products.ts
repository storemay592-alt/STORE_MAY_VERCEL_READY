import "server-only";
import { getDatabase } from "@/lib/db";
import { productStatuses, type ProductStatus } from "@/lib/product-options";

export { productStatuses };
export type { ProductStatus };
export type ClickType = "whatsapp" | "view";

export type CatalogProduct = {
  id: string;
  code: string;
  name: string;
  description: string;
  brand: string;
  article: string;
  model: string;
  category: string;
  type: string;
  color: string;
  gender: string;
  price: number;
  brandPrice: number | null;
  sizesAvailable: string;
  status: ProductStatus;
  imageUrls: string[];
  whatsappNumber: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CatalogProductInput = Omit<
  CatalogProduct,
  "id" | "code" | "article" | "model" | "brandPrice" | "createdAt" | "updatedAt"
> & {
  article?: string;
  model?: string;
  brandPrice?: number | null;
};

type ProductRow = {
  id: string;
  code: string;
  name: string;
  description: string;
  brand: string;
  article: string;
  model: string;
  category: string;
  type: string;
  color: string;
  gender: string;
  price: string | number;
  brand_price: string | number | null;
  sizes_available: string;
  status: ProductStatus;
  image_urls: string[];
  whatsapp_number: string;
  created_at: string | Date;
  updated_at: string | Date;
};

export type ProductFilters = {
  category?: string;
  type?: string;
  color?: string;
  includeSoldOut?: boolean;
};

export type ProductStat = {
  id: string;
  code: string;
  name: string;
  imageUrl: string;
  count: number;
};

function mapProduct(row: ProductRow): CatalogProduct {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    brand: row.brand,
    article: row.article,
    model: row.model,
    category: row.category,
    type: row.type,
    color: row.color,
    gender: row.gender,
    price: Number(row.price),
    brandPrice: row.brand_price === null ? null : Number(row.brand_price),
    sizesAvailable: row.sizes_available,
    status: row.status,
    imageUrls: row.image_urls ?? [],
    whatsappNumber: row.whatsapp_number,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
}

const productColumns = `
  id, code, name, description, brand, article, model, category, type, color, gender,
  price, brand_price, sizes_available, status, image_urls, whatsapp_number, created_at, updated_at
`;

export async function listCatalogProducts(filters: ProductFilters = {}) {
  const sql = getDatabase();
  const rows = (await sql.query(
    `SELECT ${productColumns} FROM products ORDER BY created_at DESC`
  )) as ProductRow[];

  return rows.map(mapProduct).filter((product) => {
    if (!filters.includeSoldOut && product.status === "agotado") return false;
    if (filters.category && product.category !== filters.category) return false;
    if (filters.type && product.type !== filters.type) return false;
    if (filters.color && product.color !== filters.color) return false;
    return true;
  });
}

export async function listDashboardProducts() {
  return listCatalogProducts({ includeSoldOut: true });
}

export async function getCatalogProductById(id: string) {
  const sql = getDatabase();
  const rows = (await sql.query(`SELECT ${productColumns} FROM products WHERE id = $1 LIMIT 1`, [
    id
  ])) as ProductRow[];
  return rows.length ? mapProduct(rows[0]) : null;
}

export async function getCatalogProductByCode(code: string) {
  const sql = getDatabase();
  const rows = (await sql.query(
    `SELECT ${productColumns} FROM products WHERE upper(code) = upper($1) LIMIT 1`,
    [code]
  )) as ProductRow[];
  return rows.length ? mapProduct(rows[0]) : null;
}

export async function createCatalogProduct(input: CatalogProductInput) {
  const sql = getDatabase();
  const rows = (await sql`
    INSERT INTO products (
      name, description, brand, article, model, category, type, color, gender, price,
      brand_price, sizes_available, status, image_urls, whatsapp_number
    ) VALUES (
      ${input.name}, ${input.description}, ${input.brand}, ${input.article ?? input.type},
      ${input.model ?? input.name}, ${input.category}, ${input.type}, ${input.color},
      ${input.gender}, ${input.price}, ${input.brandPrice ?? null}, ${input.sizesAvailable}, ${input.status},
      ${input.imageUrls}, ${input.whatsappNumber}
    )
    RETURNING id, code, name, description, brand, article, model, category, type, color,
      gender, price, brand_price, sizes_available, status, image_urls, whatsapp_number,
      created_at, updated_at
  `) as ProductRow[];
  return mapProduct(rows[0]);
}

export async function updateCatalogProduct(id: string, input: CatalogProductInput) {
  const sql = getDatabase();
  const rows = (await sql`
    UPDATE products
    SET name = ${input.name},
        description = ${input.description},
        brand = ${input.brand},
        article = ${input.article ?? input.type},
        model = ${input.model ?? input.name},
        category = ${input.category},
        type = ${input.type},
        color = ${input.color},
        gender = ${input.gender},
        price = ${input.price},
        brand_price = ${input.brandPrice ?? null},
        sizes_available = ${input.sizesAvailable},
        status = ${input.status},
        image_urls = ${input.imageUrls},
        whatsapp_number = ${input.whatsappNumber}
    WHERE id = ${id}
    RETURNING id, code, name, description, brand, article, model, category, type, color,
      gender, price, brand_price, sizes_available, status, image_urls, whatsapp_number,
      created_at, updated_at
  `) as ProductRow[];
  return rows.length ? mapProduct(rows[0]) : null;
}

export async function deleteCatalogProduct(id: string) {
  const sql = getDatabase();
  const rows = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function recordProductClick(productId: string, clickType: ClickType) {
  const sql = getDatabase();
  await sql`
    INSERT INTO product_clicks (product_id, click_type)
    VALUES (${productId}, ${clickType})
  `;
}

type StatRow = {
  id: string;
  code: string;
  name: string;
  image_url: string | null;
  click_count: string | number;
};

export async function getTopProducts(clickType: ClickType, since: Date | null) {
  const sql = getDatabase();
  const rows = since
    ? ((await sql`
        SELECT p.id, p.code, p.name, p.image_urls[1] AS image_url, COUNT(pc.id)::INT AS click_count
        FROM products p
        LEFT JOIN product_clicks pc
          ON pc.product_id = p.id
         AND pc.click_type = ${clickType}
         AND pc.clicked_at >= ${since}
        GROUP BY p.id, p.code, p.name, p.image_urls
        ORDER BY click_count DESC, p.name ASC
        LIMIT 10
      `) as StatRow[])
    : ((await sql`
        SELECT p.id, p.code, p.name, p.image_urls[1] AS image_url, COUNT(pc.id)::INT AS click_count
        FROM products p
        LEFT JOIN product_clicks pc
          ON pc.product_id = p.id
         AND pc.click_type = ${clickType}
        GROUP BY p.id, p.code, p.name, p.image_urls
        ORDER BY click_count DESC, p.name ASC
        LIMIT 10
      `) as StatRow[]);

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    imageUrl: row.image_url ?? "",
    count: Number(row.click_count)
  })) satisfies ProductStat[];
}

export async function getCurrentMonthWhatsappTotal() {
  const sql = getDatabase();
  const rows = await sql`
    SELECT COUNT(*)::INT AS total
    FROM product_clicks
    WHERE click_type = 'whatsapp'
      AND clicked_at >= date_trunc('month', NOW())
  `;
  return Number(rows[0]?.total ?? 0);
}
