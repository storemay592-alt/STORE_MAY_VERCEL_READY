import { createDashboardProductAction } from "@/app/dashboard/actions";
import { DashboardProductForm } from "@/components/dashboard/DashboardProductForm";
import { verifyAdmin } from "@/lib/auth/dal";

export default async function NewDashboardProductPage() {
  await verifyAdmin();
  return (
    <main className="dashboard-page is-editor">
      <header className="dashboard-editor-heading"><span>Nuevo producto</span><h1>Publicar una pieza</h1></header>
      <DashboardProductForm action={createDashboardProductAction} />
    </main>
  );
}
