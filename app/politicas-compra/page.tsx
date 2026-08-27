import type { Metadata } from "next";
import Link from "next/link";
import { PremiumHeader } from "@/components/PremiumHeader";
import "./politicas.css";

export const metadata: Metadata = {
  title: "Políticas de compra, entregas y guía de tallas",
  description:
    "Consulta las políticas de compra y entrega de Store MAY, además de la tabla de conversión de tallas Ecuador (EU) a Estados Unidos (US).",
  alternates: { canonical: "/politicas-compra" }
};

const purchasePolicies = [
  {
    number: "01",
    title: "Empaque optimizado",
    copy: (
      <>
        Para agilizar la logística y ofrecerte el mejor precio final, <strong>todos los calzados se importan y entregan sin su caja original.</strong>
      </>
    )
  },
  {
    number: "02",
    title: "Ventas finales",
    copy: (
      <>
        Tu satisfacción es importante, pero por motivos de logística e higiene, <strong>no realizamos cambios ni devoluciones</strong> una vez que la mercadería ha sido entregada.
      </>
    )
  },
  {
    number: "03",
    title: "Verificación de tallas",
    copy: (
      <>
        Es absoluta responsabilidad del cliente elegir la talla correcta. Compara tu medida exacta utilizando nuestra <strong>Tabla de Conversión Ecuador vs. USA</strong> antes de pagar.
      </>
    )
  }
] as const;

const sizeRows = [
  ["35", "5", "—"],
  ["36", "6", "—"],
  ["37", "6.5 – 7", "—"],
  ["38", "7.5 – 8", "—"],
  ["39", "8.5", "6.5"],
  ["40", "9 – 9.5", "7 – 7.5"],
  ["41", "10", "8 – 8.5"],
  ["42", "—", "9 – 9.5"],
  ["43", "—", "10 – 10.5"],
  ["44", "—", "11"]
] as const;

export default function PurchasePoliciesPage() {
  return (
    <div className="policy-page">
      <PremiumHeader />

      <main>
        <nav className="policy-breadcrumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link>
          <span aria-hidden="true">/</span>
          <Link href="/catalogo">Catálogo</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Políticas de compra</span>
        </nav>

        <header className="policy-hero">
          <p>Información antes de comprar</p>
          <h1>Políticas de Compra<br />y Entregas</h1>
          <span>
            Para garantizar la mejor experiencia y total transparencia en tus pedidos, ten en cuenta estas condiciones antes de finalizar tu compra.
          </span>
        </header>

        <section className="policy-rules" aria-labelledby="policy-rules-title">
          <h2 className="sr-only" id="policy-rules-title">Condiciones de compra y entrega</h2>
          {purchasePolicies.map((policy) => (
            <article key={policy.number}>
              <span aria-hidden="true">{policy.number}</span>
              <h3>{policy.title}</h3>
              <p>{policy.copy}</p>
            </article>
          ))}
        </section>

        <section className="size-guide" id="tabla-de-tallas" aria-labelledby="size-guide-title">
          <div className="size-guide-heading">
            <div>
              <p>Guía de equivalencias</p>
              <h2 id="size-guide-title">Tabla de Conversión de Tallas</h2>
            </div>
            <p>
              En Ecuador utilizamos el sistema de medidas Europeo (EU). Usa esta guía para encontrar tu equivalencia en tallas americanas (US).
            </p>
          </div>

          <div className="size-table-wrap">
            <table>
              <caption className="sr-only">Conversión de tallas de calzado Ecuador, mujer USA y hombre USA</caption>
              <thead>
                <tr>
                  <th scope="col">Talla Ecuador <small>EU</small></th>
                  <th scope="col">Mujer <small>USA</small></th>
                  <th scope="col">Hombre <small>USA</small></th>
                </tr>
              </thead>
              <tbody>
                {sizeRows.map(([eu, women, men]) => (
                  <tr key={eu}>
                    <th scope="row">{eu}</th>
                    <td>{women}</td>
                    <td>{men}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="size-note">
            <span aria-hidden="true">i</span>
            <p>
              <strong>Nota para el cliente.</strong> Las hormas pueden variar ligeramente dependiendo de la marca, por ejemplo Nike o Adidas. Si tienes dudas, te sugerimos medir tu pie en centímetros y consultar con nuestro asesor antes de comprar.
            </p>
          </aside>
        </section>

        <section className="policy-actions" aria-label="Opciones después de consultar las políticas">
          <div>
            <p>¿Lista para elegir?</p>
            <h2>Compra con claridad.</h2>
          </div>
          <nav>
            <Link href="/catalogo">Ver catálogo <span aria-hidden="true">→</span></Link>
            <Link href="/#contacto">Consultar por WhatsApp <span aria-hidden="true">→</span></Link>
          </nav>
        </section>
      </main>

      <footer className="policy-footer">
        <span>© {new Date().getFullYear()} Store MAY</span>
        <nav aria-label="Enlaces legales">
          <Link href="/privacidad-cookies">Privacidad y cookies</Link>
          <Link href="/">Volver al inicio</Link>
        </nav>
      </footer>
    </div>
  );
}
