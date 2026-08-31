// Test inserting a product to see the exact error
const { neon } = require("@neondatabase/serverless");
const fs = require("fs");

const envContent = fs.readFileSync(".env.local", "utf8");
const dbUrl = envContent.match(/DATABASE_URL=([^\r\n]+)/)?.[1]?.trim();
const sql = neon(dbUrl);

async function main() {
  // Try exactly what catalog-matrix.ts does
  try {
    const result = await sql`
      INSERT INTO products (
        name, description, brand, category, type, article, model, color, gender,
        brand_price, price, sizes_available, status, image_urls, whatsapp_number
      ) VALUES (
        ${'TEST PRODUCTO'}, ${'Modelo TEST'}, ${'ADIDAS'}, ${'calzado'},
        ${'ARTICULO TEST'}, ${'ARTICULO TEST'}, ${'MODELO TEST'}, ${'NEGRO'}, ${'Mujer'},
        ${25.00}, ${30.00}, ${'Consultar'}, ${'disponible'}, ${['https://ik.imagekit.io/test/test.jpg']},
        ${''}
      )
      RETURNING id, code
    `;
    console.log("INSERT OK:", result[0]);
    
    // Rollback - delete the test
    await sql`DELETE FROM products WHERE name = 'TEST PRODUCTO'`;
    console.log("Test product deleted - DB is working correctly");
  } catch (e) {
    console.error("INSERT FAILED:", e.message);
    if (e.message.includes("check")) {
      console.error("-> CONSTRAINT VIOLATION - check constraint failed");
    }
    if (e.message.includes("not-null") || e.message.includes("null value")) {
      console.error("-> NULL CONSTRAINT");
    }
  }
  
  // Also check what categories are allowed
  try {
    const cats = await sql`SELECT DISTINCT category FROM products LIMIT 10`;
    console.log("\nCategorías existentes en DB:", cats.map(r => r.category));
  } catch(e) {
    console.log("Could not read categories:", e.message);
  }
}

main().catch(e => console.error("FATAL:", e.message));
