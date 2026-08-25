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
          <span>Importación masiva</span>
          <h1>Importar Excel</h1>
          <p>Agrega varios productos a la vez. Primero revisas; después decides qué guardar.</p>
        </div>
        <Link className="dashboard-link-button" href="/dashboard">← Volver a productos</Link>
      </header>
      <CatalogImportClient />
    </main>
  );
}

