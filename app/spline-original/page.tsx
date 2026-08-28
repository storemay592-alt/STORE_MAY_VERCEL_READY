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
        url: "https://prod.spline.design/n4ECos8L3-dXpDKi/scene.splinecode",
        loading: "eager",
        renderer: "webgl",
        "aria-label": "Marcas premium, precios inteligentes y productos 100% originales"
      })}
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            customElements.whenDefined("spline-viewer").then(() => {
              const hideSplineAttribution = () => {
                const viewer = document.querySelector("spline-viewer");
                const logo = viewer?.shadowRoot?.querySelector("#logo");

                if (!(logo instanceof HTMLAnchorElement)) return false;

                logo.removeAttribute("href");
                logo.setAttribute("aria-hidden", "true");
                logo.setAttribute("tabindex", "-1");
                logo.style.pointerEvents = "none";
                logo.style.display = "none";
                return true;
              };

              if (hideSplineAttribution()) return;

              const intervalId = window.setInterval(() => {
                if (hideSplineAttribution()) window.clearInterval(intervalId);
              }, 100);

              window.setTimeout(() => window.clearInterval(intervalId), 10000);
            });
          `
        }}
      />
    </main>
  );
}
