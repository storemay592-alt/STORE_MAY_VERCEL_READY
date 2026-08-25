"use client";

import { useState } from "react";

export function CatalogGallery({ images, productName }: { images: string[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="catalog-detail-gallery" aria-label={`Galería de ${productName}`}>
      <div className="catalog-detail-main-image">
        <img src={images[activeIndex]} alt={`${productName}, imagen ${activeIndex + 1}, Store MAY`} />
        <span>{String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
      </div>
      {images.length > 1 ? (
        <div className="catalog-detail-thumbnails" role="list">
          {images.map((image, index) => (
            <button
              className={index === activeIndex ? "is-active" : ""}
              type="button"
              key={`${image}-${index}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver imagen ${index + 1} de ${productName}`}
              aria-pressed={index === activeIndex}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
