import { notFound } from "next/navigation";
import { updateDashboardProductAction } from "@/app/dashboard/actions";
import { DashboardProductForm } from "@/components/dashboard/DashboardProductForm";
import { verifyAdmin } from "@/lib/auth/dal";
import { getCatalogProductById } from "@/lib/catalog-products";

export default async function EditDashboardProductPage({ params }: { params: Promise<{ id: string }> }) {
  await verifyAdmin();
  const { id } = await params;
  const product = await getCatalogProductById(id);
  if (!product) notFound();
  const action = updateDashboardProductAction.bind(null, product.id);

  return (
    <main className="dashboard-page is-editor">
      <header className="dashboard-editor-heading"><span>{product.code}</span><h1>Editar producto</h1></header>
      <DashboardProductForm action={action} product={product} />
    </main>
  );
}
