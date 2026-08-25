import Link from "next/link";
import { verifyAdmin } from "@/lib/auth/dal";
import { getCurrentMonthWhatsappTotal, getTopProducts, type ProductStat } from "@/lib/catalog-products";

export const dynamic = "force-dynamic";

const ranges = [
  { id: "7", label: "Últimos 7 días", days: 7 },
  { id: "30", label: "Últimos 30 días", days: 30 },
  { id: "todo", label: "Todo", days: null }
] as const;

function StatsTable({ title, eyebrow, products }: { title: string; eyebrow: string; products: ProductStat[] }) {
  const maximum = Math.max(1, ...products.map((product) => product.count));
  return (
    <section className="dashboard-stat-table">
      <header><span>{eyebrow}</span><h2>{title}</h2></header>
      <ol>
        {products.map((product, index) => (
          <li key={product.id}>
            <span className="dashboard-stat-rank">{String(index + 1).padStart(2, "0")}</span>
            {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <span className="dashboard-stat-placeholder">MAY</span>}
            <div className="dashboard-stat-name"><strong>{product.name}</strong><code>{product.code}</code></div>
            <div className="dashboard-stat-bar" aria-hidden="true"><i style={{ width: `${(product.count / maximum) * 100}%` }} /></div>
            <b>{product.count}</b>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function DashboardStatsPage({ searchParams }: { searchParams: Promise<{ rango?: string }> }) {
  await verifyAdmin();
  const requested = (await searchParams).rango ?? "30";
  const range = ranges.find((item) => item.id === requested) ?? ranges[1];
  const since = range.days ? new Date(Date.now() - range.days * 24 * 60 * 60 * 1000) : null;
  const [whatsapp, views, monthTotal] = await Promise.all([
    getTopProducts("whatsapp", since),
    getTopProducts("view", since),
    getCurrentMonthWhatsappTotal()
  ]);

  return (
    <main className="dashboard-page">
      <section className="dashboard-page-heading is-stats">
        <div><span>Interés del catálogo</span><h1>Estadísticas</h1><p>Consultas reales para decidir qué productos destacar.</p></div>
        <div className="dashboard-month-total"><span>Consultas este mes</span><strong>{monthTotal}</strong></div>
      </section>
      <nav className="dashboard-range-nav" aria-label="Rango de fechas">
        {ranges.map((item) => <Link className={item.id === range.id ? "is-active" : ""} href={`/dashboard/estadisticas?rango=${item.id}`} key={item.id}>{item.label}</Link>)}
      </nav>
      <div className="dashboard-stat-grid">
        <StatsTable eyebrow="Intención de compra" title="Más consultados por WhatsApp" products={whatsapp} />
        <StatsTable eyebrow="Descubrimiento" title="Más vistos" products={views} />
      </div>
    </main>
  );
}
