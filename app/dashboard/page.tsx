import Link from "next/link";
import { deleteDashboardProductAction, setDashboardProductStatusAction } from "@/app/dashboard/actions";
import { DashboardDeleteButton } from "@/components/dashboard/DashboardDeleteButton";
import { verifyAdmin } from "@/lib/auth/dal";
import { listDashboardProducts } from "@/lib/catalog-products";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" });

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ buscar?: string }>;
}) {
  await verifyAdmin();
  const allProducts = await listDashboardProducts();
  const linkedPhotoCount = allProducts.reduce((total, product) => total + product.imageUrls.length, 0);
  const query = (await searchParams).buscar?.trim() ?? "";
  const normalizedQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const products = normalizedQuery
    ? allProducts.filter((product) => [product.name, product.code, product.brand, product.model, product.article]
        .some((value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").includes(normalizedQuery)))
    : allProducts;

  return (
    <main className="dashboard-page">
      <section className="dashboard-page-heading">
        <div>
          <span>Catálogo actual</span>
          <h1>Productos</h1>
          <p>{query
            ? `${products.length} resultados de ${allProducts.length} productos · ${linkedPhotoCount} fotos vinculadas`
            : `${products.length} productos publicados · ${linkedPhotoCount} fotos vinculadas`}</p>
        </div>
        <div className="dashboard-heading-actions">
          <Link className="dashboard-button is-secondary" href="/dashboard/importar">Importar Excel + fotos</Link>
          <Link className="dashboard-button is-primary" href="/dashboard/productos/nuevo">+ Agregar producto</Link>
        </div>
      </section>

      <form className="dashboard-catalog-search" role="search">
        <label htmlFor="dashboard-product-search">Buscar producto, código, marca o modelo</label>
        <div>
          <input id="dashboard-product-search" name="buscar" type="search" defaultValue={query} placeholder="Ej. TERREX CAPTAIN TOEY" />
          <button type="submit">Buscar</button>
          {query ? <Link href="/dashboard">Limpiar</Link> : null}
        </div>
      </form>

      {products.length ? (
        <section className="dashboard-products" aria-label="Lista de productos">
          <div className="dashboard-products-head" aria-hidden="true">
            <span>Producto</span><span>Código</span><span>Precio</span><span>Estado</span><span>Acciones</span>
          </div>
          {products.map((product) => {
            const remove = deleteDashboardProductAction.bind(null, product.id);
            const setStatus = setDashboardProductStatusAction.bind(null, product.id);
            return (
              <article className="dashboard-product-row" key={product.id}>
                <div className="dashboard-product-identity">
                  <img src={product.imageUrls[0]} alt={`${product.name} Store MAY`} />
                  <div><strong>{product.name}</strong><span>{product.brand} · {product.category}</span></div>
                </div>
                <code>{product.code}</code>
                <strong className="dashboard-price">{money.format(product.price)}</strong>
                <form className="dashboard-stock-toggle" action={setStatus} aria-label={`Estado de inventario de ${product.name}`}>
                  <button className={product.status === "disponible" ? "is-active is-stock" : ""} name="status" value="disponible" type="submit">Stock</button>
                  <button className={product.status === "agotado" ? "is-active is-sold" : ""} name="status" value="agotado" type="submit">Sold</button>
                </form>
                <div className="dashboard-row-actions">
                  <Link className="dashboard-link-button" href={`/dashboard/productos/${product.id}/editar`}>Editar</Link>
                  <DashboardDeleteButton action={remove} productName={product.name} />
                </div>
              </article>
            );
          })}
        </section>
      ) : query ? (
        <section className="dashboard-empty">
          <span>Sin coincidencias</span>
          <h2>No encontramos “{query}”.</h2>
          <p>Prueba con el modelo, la marca o el código del producto.</p>
          <Link className="dashboard-button is-secondary" href="/dashboard">Mostrar todo el catálogo</Link>
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
