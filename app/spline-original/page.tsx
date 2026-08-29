const SCENE_URL =
  "https://my.spline.design/ticktockinteractivelanding-wJWf18UVA2AYcnPzjj5DwcMM/";

export default function SplineOriginalPage() {
  return (
    <main
      className="spline-stage-page spline-embed-page"
      aria-label="Escena 3D interactiva 100% Original de Store MAY"
    >
      <iframe
        className="spline-embed-frame"
        src={SCENE_URL}
        title="Marcas premium, precios inteligentes y productos 100% originales"
        loading="lazy"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </main>
  );
}
