import { headers } from "next/headers";
import { createElement } from "react";

export default async function SplineStagePage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <main className="spline-stage-page" aria-label="Escena 3D interactiva de Store MAY">
      <script
        type="module"
        src="https://cdn.spline.design/@splinetool/viewer@2.0.8/build/spline-viewer.js"
        nonce={nonce}
      />
      {createElement("spline-viewer", {
        url: "/spline/store-may-scene.splinecode",
        loading: "lazy",
        renderer: "webgl",
        "aria-label": "Objeto 3D interactivo de Store MAY"
      })}
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `
            customElements.whenDefined("spline-viewer").then(() => {
              const viewer = document.querySelector("spline-viewer");
              if (!viewer) return;

              const hideSplineAttribution = () => {
                const logo = viewer.shadowRoot?.querySelector("#logo");
                if (!(logo instanceof HTMLAnchorElement)) return false;

                logo.removeAttribute("href");
                logo.setAttribute("aria-hidden", "true");
                logo.setAttribute("tabindex", "-1");
                logo.style.pointerEvents = "none";
                logo.style.display = "none";
                return true;
              };

              if (hideSplineAttribution()) return;

              const stop = () => {
                window.clearInterval(intervalId);
                observer.disconnect();
              };

              const intervalId = window.setInterval(() => {
                if (hideSplineAttribution()) stop();
              }, 150);

              const observer = new MutationObserver(() => {
                if (hideSplineAttribution()) stop();
              });

              if (viewer.shadowRoot) {
                observer.observe(viewer.shadowRoot, { childList: true, subtree: true });
              }

              window.setTimeout(stop, 30000);
            });
          `
        }}
      />
    </main>
  );
}
