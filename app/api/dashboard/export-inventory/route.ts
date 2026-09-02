import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/auth/session";
import { buildCatalogInventoryWorkbook } from "@/lib/catalog-inventory-export";
import { listDashboardProducts } from "@/lib/catalog-products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fileDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guayaquil",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

export async function GET() {
  const session = await readAdminSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Tu sesión venció. Vuelve a iniciar sesión." },
      { status: 401, headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }

  try {
    const products = await listDashboardProducts();
    const workbook = buildCatalogInventoryWorkbook(products);
    const filename = `inventario-store-may-${fileDate(new Date())}.xlsx`;

    return new Response(workbook, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "No se pudo preparar el inventario. Inténtalo nuevamente." },
      { status: 500, headers: { "Cache-Control": "private, no-store, max-age=0" } }
    );
  }
}

