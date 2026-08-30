import type { Metadata } from "next";
import Link from "next/link";
import { CatalogImportClient } from "@/components/dashboard/CatalogImportClient";
import { verifyAdmin } from "@/lib/auth/dal";

export const metadata: Metadata = { title: "Importar catálogo" };

export default async function CatalogImportPage() {
  await verifyAdmin();

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
      <CatalogImportClient />
    </main>
  );
}
