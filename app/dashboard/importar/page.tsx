import type { Metadata } from "next";
import Link from "next/link";
import { CatalogImportClient } from "@/components/dashboard/CatalogImportClient";
import { verifyAdmin } from "@/lib/auth/dal";
import { listDashboardProducts } from "@/lib/catalog-products";

export const metadata: Metadata = { title: "Importar catálogo" };

export default async function CatalogImportPage() {
  await verifyAdmin();
  const products = await listDashboardProducts();
  const lastModified = products.reduce<Date | null>(
    (latest, product) => !latest || product.updatedAt > latest ? product.updatedAt : latest,
    null
  );
  const lastModifiedLabel = lastModified
    ? new Intl.DateTimeFormat("es-EC", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "America/Guayaquil"
      }).format(lastModified)
    : "Todavía no hay productos";

  return (
    <main className="dashboard-page dashboard-import-page">
      <header className="dashboard-editor-heading catalog-import-page-heading">
        <div>
          <span>Sincronización de inventario</span>
          <h1>Excel + imágenes</h1>
          <p>Empareja la matriz con las fotos, resuelve dudas y guarda sólo cuando todo esté revisado.</p>
        </div>
        <Link className="dashboard-link-button" href="/dashboard">← Volver a productos</Link>
      </header>
      <CatalogImportClient
        inventorySnapshot={{
          itemCount: products.length,
          lastModifiedIso: lastModified?.toISOString() ?? null,
          lastModifiedLabel
        }}
      />
    </main>
  );
}
