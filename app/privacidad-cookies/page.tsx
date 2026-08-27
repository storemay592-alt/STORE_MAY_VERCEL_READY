import type { Metadata } from "next";
import Link from "next/link";
import { PremiumHeader } from "@/components/PremiumHeader";
import "../politicas-compra/politicas.css";
import "./privacidad.css";

export const metadata: Metadata = {
  title: "Privacidad y cookies",
  description: "Información sobre privacidad, almacenamiento técnico y seguridad en Store MAY.",
  alternates: { canonical: "/privacidad-cookies" }
};

const privacyItems = [
  {
    number: "01",
    title: "Sin rastreo publicitario",
    copy: "La tienda pública no instala cookies de publicidad, perfiles comerciales ni píxeles de seguimiento. Por eso no mostramos un banner de consentimiento innecesario."
  },
  {
    number: "02",
    title: "Medición técnica mínima",
    copy: "Las fichas de producto usan almacenamiento de sesión para evitar contar dos veces la misma vista dentro de una pestaña. Este dato se elimina al terminar la sesión del navegador y no contiene tu nombre, correo ni teléfono."
  },
  {
    number: "03",
    title: "Sesión administrativa",
    copy: "Solo el panel privado utiliza una cookie técnica indispensable para mantener autenticada a la persona administradora. Está protegida con HttpOnly, Secure en producción, SameSite=Strict y expiración limitada."
  }
] as const;

export default function PrivacyCookiesPage() {
  return (
    <div className="policy-page privacy-page">
      <PremiumHeader />
      <main>
        <nav className="policy-breadcrumbs" aria-label="Migas de pan">
          <Link href="/">Inicio</Link><span aria-hidden="true">/</span><span aria-current="page">Privacidad y cookies</span>
        </nav>

        <header className="policy-hero privacy-hero">
          <p>Transparencia digital</p>
          <h1>Privacidad<br />y Cookies</h1>
          <span>Store MAY utiliza únicamente los recursos técnicos necesarios para operar el catálogo y proteger su administración.</span>
        </header>

        <section className="privacy-status" aria-label="Estado actual de cookies">
          <span>Estado actual</span>
          <strong>0</strong>
          <p>cookies publicitarias o de analítica instaladas por Store MAY en la navegación pública.</p>
        </section>

        <section className="policy-rules privacy-rules" aria-label="Uso de datos y almacenamiento">
          {privacyItems.map((item) => (
            <article key={item.number}>
              <span aria-hidden="true">{item.number}</span>
              <h2>{item.title}</h2>
              <p>{item.copy}</p>
            </article>
          ))}
        </section>

        <section className="privacy-details" aria-labelledby="privacy-details-title">
          <div>
            <p>Servicios y protección</p>
            <h2 id="privacy-details-title">Qué ocurre cuando navegas.</h2>
          </div>
          <dl>
            <div><dt>Contenido externo</dt><dd>La página puede cargar imágenes desde ImageKit y experiencias visuales de Spline. Al abrir WhatsApp, pasas voluntariamente a un servicio externo sujeto a sus propias políticas.</dd></div>
            <div><dt>Datos de consultas</dt><dd>La conversación de compra se realiza directamente en WhatsApp. Store MAY no solicita pagos ni contraseñas dentro de esta página.</dd></div>
            <div><dt>Seguridad</dt><dd>Aplicamos conexión HTTPS, política CSP, validación de origen, límites de solicitudes y sesiones administrativas protegidas.</dd></div>
            <div><dt>Tus opciones</dt><dd>Puedes cerrar la pestaña para eliminar el almacenamiento de sesión o utilizar las opciones de privacidad de tu navegador para bloquear contenido de terceros.</dd></div>
          </dl>
        </section>

        <section className="policy-actions" aria-label="Enlaces relacionados">
          <div><p>Información Store MAY</p><h2>Compra con confianza.</h2></div>
          <nav>
            <Link href="/politicas-compra">Políticas de compra <span aria-hidden="true">→</span></Link>
            <Link href="/#contacto">Contactar a Store MAY <span aria-hidden="true">→</span></Link>
          </nav>
        </section>
      </main>
      <footer className="policy-footer">
        <span>© {new Date().getFullYear()} Store MAY</span>
        <Link href="/">Volver al inicio</Link>
      </footer>
    </div>
  );
}
