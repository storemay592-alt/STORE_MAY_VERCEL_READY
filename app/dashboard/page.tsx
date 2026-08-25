import Link from "next/link";
import { deleteDashboardProductAction } from "@/app/dashboard/actions";
import { DashboardDeleteButton } from "@/components/dashboard/DashboardDeleteButton";
import { verifyAdmin } from "@/lib/auth/dal";
import { listDashboardProducts, type ProductStatus } from "@/lib/catalog-products";

export const dynamic = "force-dynamic";

const statusLabel: Record<ProductStatus, string> = {
  disponible: "Disponible",
  agotado: "Agotado",
  bajo_confirmacion: "Confirmar"
};

const money = new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" });

export default async function DashboardPage() {
  await verifyAdmin();
  const products = await listDashboardProducts();

  return (
    <main className="dashboard-page">
      <section className="dashboard-page-heading">
        <div>
          <span>Catálogo actual</span>
          <h1>Productos</h1>
          <p>{products.length === 1 ? "1 producto publicado" : `${products.length} productos publicados`}</p>
        </div>
        <div className="dashboard-heading-actions">
          <Link className="dashboard-button is-secondary" href="/dashboard/importar">Importar Excel</Link>
          <Link className="dashboard-button is-primary" href="/dashboard/productos/nuevo">+ Agregar producto</Link>
        </div>
      </section>

      {products.length ? (
        <section className="dashboard-products" aria-label="Lista de productos">
          <div className="dashboard-products-head" aria-hidden="true">
            <span>Producto</span><span>Código</span><span>Precio</span><span>Estado</span><span>Acciones</span>
          </div>
          {products.map((product) => {
            const remove = deleteDashboardProductAction.bind(null, product.id);
            return (
              <article className="dashboard-product-row" key={product.id}>
                <div className="dashboard-product-identity">
                  <img src={product.imageUrls[0]} alt={`${product.name} Store MAY`} />
                  <div><strong>{product.name}</strong><span>{product.brand} · {product.category}</span></div>
                </div>
                <code>{product.code}</code>
                <strong className="dashboard-price">{money.format(product.price)}</strong>
                <span className={`dashboard-status is-${product.status}`}>{statusLabel[product.status]}</span>
                <div className="dashboard-row-actions">
                  <Link className="dashboard-link-button" href={`/dashboard/productos/${product.id}/editar`}>Editar</Link>
                  <DashboardDeleteButton action={remove} productName={product.name} />
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="dashboard-empty">
          <span>Tu catálogo está listo para comenzar</span>
          <h2>Publica el primer producto sin tocar código.</h2>
          <p>Sube las fotos, completa los datos y presiona Guardar.</p>
          <Link className="dashboard-button is-primary" href="/dashboard/productos/nuevo">Agregar primer producto</Link>
        </section>
      )}
    </main>
  );
}
