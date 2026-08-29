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
                if (!(logo instanceof HTMLElement)) return;
                if (logo.style.getPropertyValue("display") === "none") return;

                observer.disconnect();
                if (logo instanceof HTMLAnchorElement) logo.removeAttribute("href");
                logo.setAttribute("aria-hidden", "true");
                logo.setAttribute("tabindex", "-1");
                logo.style.setProperty("pointer-events", "none", "important");
                logo.style.setProperty("display", "none", "important");
                logo.style.setProperty("opacity", "0", "important");
                if (viewer.shadowRoot) {
                  observer.observe(viewer.shadowRoot, { childList: true, subtree: true });
                }
              };

              const stop = () => {
                window.clearInterval(intervalId);
                observer.disconnect();
              };

              // The viewer re-adds / restyles the badge after it hydrates, so
              // keep enforcing the hidden state instead of stopping on first hit.
              const intervalId = window.setInterval(hideSplineAttribution, 400);

              const observer = new MutationObserver(hideSplineAttribution);

              hideSplineAttribution();

              window.setTimeout(stop, 60000);
            });
          `
        }}
      />
    </main>
  );
}
