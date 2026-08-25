"use client";

import { useEffect } from "react";

async function track(productId: string, clickType: "view" | "whatsapp") {
  try {
    await fetch("/api/product-clicks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, clickType }),
      keepalive: true
    });
  } catch {
    // La consulta del cliente no debe bloquearse si la métrica no responde.
  }
}

export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    const key = `store-may-product-view:${productId}`;
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
    void track(productId, "view");
  }, [productId]);
  return null;
}

export function WhatsAppConsultButton({
  productId,
  href,
  disabled
}: {
  productId: string;
  href: string;
  disabled?: boolean;
}) {
  if (disabled) return <span className="catalog-whatsapp-button is-disabled">Producto agotado</span>;

  return (
    <a
      className="catalog-whatsapp-button"
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={() => { void track(productId, "whatsapp"); }}
    >
      <svg aria-hidden="true" viewBox="0 0 32 32">
        <path d="M16.03 4.3A11.5 11.5 0 0 0 6.3 21.94L4.8 27.4l5.59-1.46a11.5 11.5 0 1 0 5.64-21.64Zm0 20.96c-1.75 0-3.46-.48-4.95-1.38l-.36-.21-3.32.87.89-3.24-.23-.37a9.45 9.45 0 1 1 7.97 4.33Zm5.18-7.07c-.28-.14-1.67-.82-1.93-.92-.26-.09-.45-.14-.64.14-.19.28-.73.92-.9 1.11-.16.19-.33.21-.61.07-.28-.14-1.19-.44-2.26-1.4a8.44 8.44 0 0 1-1.57-1.95c-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.54c-.19 0-.49.07-.75.35-.26.28-.99.97-.99 2.36s1.02 2.74 1.16 2.93c.14.19 2 3.06 4.85 4.29.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.12.55-.08 1.67-.68 1.9-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33Z" />
      </svg>
      <span>Consultar precio, talla y disponibilidad</span>
      <b aria-hidden="true">→</b>
    </a>
  );
}
