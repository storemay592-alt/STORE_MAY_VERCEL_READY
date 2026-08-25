"use client";

import { useState } from "react";

type GalleryImage = {
  src: string;
  alt: string;
  label: string;
};

export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) return null;

  const showNext = () => {
    if (images.length > 1) setActiveIndex((current) => (current + 1) % images.length);
  };

  return (
    <div className="product-detail-gallery">
      <button
        className="product-gallery-main"
        type="button"
        onClick={showNext}
        disabled={images.length < 2}
        aria-label={
          images.length > 1
            ? `Mostrar la siguiente vista de ${activeImage.alt}`
            : activeImage.alt
        }
      >
        <img src={activeImage.src} alt={activeImage.alt} />
        {images.length > 1 ? <span>Haz clic para cambiar de vista</span> : null}
      </button>

      {images.length > 1 ? (
        <div className="product-gallery-thumbnails" aria-label="Vistas del producto">
          {images.map((image, index) => (
            <button
              className={index === activeIndex ? "is-active" : ""}
              type="button"
              key={`${image.src}-${index}`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            >
              <img src={image.src} alt="" />
              <span>{image.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
