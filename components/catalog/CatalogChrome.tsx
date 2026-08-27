import Link from "next/link";
import { PremiumHeader } from "@/components/PremiumHeader";

export function CatalogHeader() {
  return <PremiumHeader />;
}

export function CatalogFooter() {
  return (
    <footer className="catalog-footer">
      <p>Store MAY · Multimarca premium · Productos 100% originales</p>
      <nav aria-label="Enlaces del catálogo">
        <Link href="/">Inicio</Link>
        <Link href="/politicas-compra">Políticas de compra y entregas</Link>
        <Link href="/privacidad-cookies">Privacidad y cookies</Link>
        <Link href="/#preguntas-frecuentes">Preguntas frecuentes</Link>
        <Link href="/#contacto">Atención personalizada</Link>
      </nav>
    </footer>
  );
}
