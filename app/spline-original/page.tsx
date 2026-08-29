import { headers } from "next/headers";
import { createElement } from "react";

export default async function SplineOriginalPage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <main className="spline-stage-page" aria-label="Escena 3D interactiva 100% Original de Store MAY">
      <script
        type="module"
        src="https://cdn.spline.design/@splinetool/viewer@2.0.8/build/spline-viewer.js"
        nonce={nonce}
      />
      {createElement("spline-viewer", {
        url: "https://prod.spline.design/aYOlLrSmQ68PZioT/scene.splinecode",
        loading: "lazy",
        renderer: "webgl",
        "aria-label": "Marcas premium, precios inteligentes y productos 100% originales"
      })}
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            customElements.whenDefined("spline-viewer").then(() => {
              const viewer = document.querySelector("spline-viewer");
              const root = viewer && viewer.shadowRoot;
              if (!root) return;

              const style = document.createElement("style");
              style.textContent =
                '#logo,a[href*="spline.design"]{display:none!important;pointer-events:none!important;opacity:0!important;}';
              root.appendChild(style);

              const disableLogo = () => {
                const logo = root.querySelector("#logo");
                if (logo instanceof HTMLElement) {
                  logo.setAttribute("aria-hidden", "true");
                  logo.setAttribute("tabindex", "-1");
                  if (logo instanceof HTMLAnchorElement) logo.removeAttribute("href");
                }
              };

              disableLogo();
              const observer = new MutationObserver(disableLogo);
              observer.observe(root, { childList: true, subtree: true });
              window.setTimeout(() => observer.disconnect(), 15000);
            });
          `
        }}
      />
    </main>
  );
}
