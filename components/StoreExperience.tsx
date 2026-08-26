"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PremiumHeader } from "@/components/PremiumHeader";
import { faqs } from "@/data/faqs";
import { categories } from "@/lib/catalog";

const brandLogos = [
  {
    name: "Adidas",
    slug: "adidas",
    src: "/brand/carousel/adidas-performance.svg",
    width: 82,
    height: 50
  },
  {
    name: "Nike",
    slug: "nike",
    src: "/brand/carousel/nike.svg",
    width: 1000,
    height: 356
  },
  {
    name: "Puma",
    slug: "puma",
    src: "/brand/carousel/brand-12.png",
    width: 1080,
    height: 558
  },
  {
    name: "Calvin Klein",
    slug: "calvin-klein",
    src: "/brand/carousel/brand-13.png",
    width: 1080,
    height: 182
  },
  {
    name: "Tommy Hilfiger",
    slug: "tommy-hilfiger",
    src: "/brand/carousel/brand-03.png",
    width: 1080,
    height: 89
  },
  {
    name: "DKNY",
    slug: "dkny",
    src: "/brand/carousel/dkny.svg",
    width: 2500,
    height: 640
  },
  {
    name: "Reebok",
    slug: "reebok",
    src: "/brand/carousel/reebok.svg",
    width: 240,
    height: 72
  },
  {
    name: "Karl Lagerfeld",
    slug: "karl-lagerfeld",
    src: "/brand/carousel/karl-lagerfeld.webp",
    width: 550,
    height: 210
  },
  {
    name: "Steve Madden",
    slug: "steve-madden",
    src: "/brand/carousel/steve-madden.webp",
    width: 617,
    height: 483
  },
  {
    name: "Timberland",
    slug: "timberland",
    src: "/brand/carousel/timberland.webp",
    width: 717,
    height: 720
  },
  {
    name: "Skechers",
    slug: "skechers",
    src: "/brand/carousel/skechers.webp",
    width: 968,
    height: 269
  },
  {
    name: "Vans",
    slug: "vans",
    src: "/brand/carousel/brand-08.png",
    width: 1080,
    height: 429
  }
] as const;

const testimonialFrames = [
  {
    number: "01",
    title: "Autenticidad y acabado",
    copy: "Opiniones sobre calidad, empaque y correspondencia entre la pieza recibida y la publicada."
  },
  {
    number: "02",
    title: "Entrega y seguimiento",
    copy: "Experiencias sobre tiempos, comunicación y estado del pedido al momento de recibirlo."
  },
  {
    number: "03",
    title: "Asesoría para elegir",
    copy: "Comentarios sobre tallas, disponibilidad y acompañamiento antes de confirmar la compra."
  }
] as const;

const whatsappMessage = encodeURIComponent(
  "Hola Store MAY. Quiero consultar precios, disponibilidad y opciones de pago por transferencia."
);
const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
const whatsappHref = whatsappNumber
  ? `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`
  : `https://api.whatsapp.com/send?text=${whatsappMessage}`;

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.04 2a10 10 0 0 0-8.66 14.99L2 22l5.15-1.35A10 10 0 1 0 12.04 2Zm0 18.2a8.2 8.2 0 0 1-4.23-1.16l-.3-.18-3.05.8.81-2.97-.2-.31a8.19 8.19 0 1 1 6.97 3.82Zm4.49-6.13c-.25-.12-1.46-.72-1.69-.8-.23-.08-.4-.12-.57.12-.16.25-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.1-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.57-1.37-.78-1.88-.2-.49-.41-.43-.57-.44h-.48c-.16 0-.43.06-.66.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.12.16 1.73 2.64 4.19 3.71.59.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.46-.6 1.67-1.17.21-.58.21-1.07.15-1.17-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  );
}

export default function StoreExperience() {
  const [openFaq, setOpenFaq] = useState(0);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const startVideo = () => {
      video.muted = true;
      video.play().catch(() => undefined);
    };

    const resumeWhenVisible = () => {
      if (!document.hidden) startVideo();
    };

    startVideo();
    video.addEventListener("canplay", startVideo);
    document.addEventListener("visibilitychange", resumeWhenVisible);

    return () => {
      video.removeEventListener("canplay", startVideo);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
    };
  }, []);

  useEffect(() => {
    const visitorKey = "store-may-visitor-id";
    let visitorId = window.localStorage.getItem(visitorKey);

    if (!visitorId) {
      visitorId = window.crypto.randomUUID();
      window.localStorage.setItem(visitorKey, visitorId);
    }

    fetch("/api/visitas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId })
    })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { count?: number }) => {
        if (typeof data.count === "number") setVisitorCount(data.count);
      })
      .catch(() => undefined);
  }, []);

  return (
    <>
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>

      <PremiumHeader />

      <main id="contenido">
        <section className="hero" id="inicio" aria-label="Presentación de Store MAY">
          <h1 className="sr-only">
            Store MAY: ropa, calzado y accesorios de marcas 100% originales
          </h1>
          <video
            ref={videoRef}
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/video/store-may-poster.webp"
            aria-label="Presentación audiovisual de Store MAY"
          >
            <source
              src="/video/STORE_MAY_Experiencia_Status_15s_Sin_Sonido.mp4"
              type="video/mp4"
            />
            Tu navegador no admite la reproducción de video.
          </video>
        </section>

        <section
          className="brands"
          id="marcas"
          aria-label="Marcas disponibles y promesa de originalidad"
        >
          <div className="brand-ticker" aria-label="Marcas disponibles en Store MAY">
            <div className="brand-track" aria-live="off">
              {[0, 1, 2].map((setIndex) => (
                <div
                  className="brand-set"
                  key={setIndex}
                  aria-hidden={setIndex > 0}
                >
                  {brandLogos.map((brand) => (
                    <span
                      className="brand-logo"
                      data-brand={brand.slug}
                      key={`${setIndex}-${brand.name}`}
                    >
                      <Image
                        className="brand-logo-image"
                        src={brand.src}
                        alt={setIndex === 0 ? `Logo de ${brand.name}` : ""}
                        width={brand.width}
                        height={brand.height}
                        quality={100}
                        unoptimized
                        draggable={false}
                      />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <section className="authenticity authenticity--spline" aria-labelledby="authenticity-title">
            <h2 className="sr-only" id="authenticity-title">
              Marcas premium, precios inteligentes y productos 100% originales
            </h2>
            <div className="spline-experience">
              <iframe
                src="https://my.spline.design/ticktockinteractivelanding-nb2Si9kAK23qhl7VmMKts2zt/"
                title="Experiencia interactiva 100% original de Store MAY"
                loading="lazy"
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="premium-pricing-mark">
              <Image
                src="/images/store-may-premium-pricing.png"
                alt="Marcas premium, precios inteligentes"
                width={1178}
                height={57}
                unoptimized
              />
            </div>
          </section>
        </section>

        <section className="categories section-shell" id="categorias" aria-labelledby="category-title">
          <h2
            className="category-menu-title"
            id="category-title"
            aria-label="Catálogo"
          >
            <span aria-hidden="true">C A T Á L O G O</span>
          </h2>
          <nav className="category-menu" aria-label="Compra por categoría">
            {categories.map((category) => (
              <a
                href={`/catalogo?categoria=${encodeURIComponent(category.id === "mujeres" ? "Mujer" : category.id === "hombres" ? "Hombre" : category.id === "ninos" ? "Niños" : "Accesorios")}`}
                key={category.id}
                aria-label={category.label}
              >
                <span className="category-menu-label" aria-hidden="true">
                  {[...category.label.toLocaleUpperCase("es")].join(" ")}
                </span>
                <span className="category-menu-orb" aria-hidden="true">
                  <span className="category-menu-arrow">→</span>
                </span>
              </a>
            ))}
          </nav>
        </section>

        <section className="advisor-showcase" id="contacto" aria-labelledby="advisor-title">
          <Image
            className="advisor-showcase-image"
            src="/images/advisor-satin-background.jpg"
            alt=""
            fill
            sizes="100vw"
            quality={95}
            aria-hidden="true"
          />
          <div className="advisor-showcase-box">
            <Image
              className="advisor-showcase-box-image"
              src="/images/store-may-box-layer.png"
              alt="Caja negra Store MAY sobre un fondo de satén oscuro"
              fill
              sizes="(max-width: 800px) 100vw, 94vw"
              quality={100}
              unoptimized
            />
          </div>
          <span className="advisor-showcase-light" aria-hidden="true" />
          <div className="section-shell advisor-showcase-layout">
            <h2 className="sr-only" id="advisor-title">
              Precios, pagos y atención personalizada de Store MAY
            </h2>
            <div className="advisor-phone-stage">
              <div className="advisor-phone-frame">
                <Image
                  className="advisor-phone-image"
                  src="/images/store-may-advisor-phone.jpg"
                  alt="Store MAY: precios y pagos, pregunta antes de elegir y consulta disponibilidad"
                  fill
                  sizes="(max-width: 520px) 84vw, (max-width: 800px) 68vw, 430px"
                  quality={95}
                  priority={false}
                />
                <span className="advisor-phone-sheen" aria-hidden="true" />
              </div>
              <a
                className="advisor-whatsapp-orb"
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir WhatsApp para consultar precios y disponibilidad"
              >
                <span aria-hidden="true">
                  <WhatsAppIcon />
                </span>
                <span className="sr-only">WhatsApp</span>
              </a>
            </div>
            <output
              className="visitor-corner"
              aria-live="polite"
              aria-label={
                visitorCount === null
                  ? "Contador de visitantes cargando"
                  : `${visitorCount.toLocaleString("es")} visitantes registrados`
              }
            >
              {visitorCount === null ? "—" : visitorCount.toLocaleString("es")}
            </output>
          </div>
        </section>

        <section className="testimonials" id="testimonios" aria-labelledby="testimonials-title">
          <div className="testimonial-cube-mesh" aria-hidden="true">
            {Array.from({ length: 12 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
          <div className="section-shell testimonials-inner">
            <header className="testimonials-heading">
              <p>Experiencias Store MAY</p>
              <h2 id="testimonials-title">Testimonios.</h2>
            </header>
            <div className="testimonial-grid">
              {testimonialFrames.map((item) => (
                <article key={item.number}>
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <small>Espacio reservado para una compra verificada</small>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="faq section-shell"
          id="preguntas-frecuentes"
          aria-labelledby="faq-title"
        >
          <div className="faq-intro">
            <p className="section-eyebrow">Información clara</p>
            <h2 id="faq-title">Preguntas frecuentes</h2>
            <p>Todo lo esencial para descubrir Store MAY con confianza.</p>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <article className={`faq-item ${isOpen ? "is-open" : ""}`} key={faq.question}>
                  <h3>
                    <button
                      id={`faq-trigger-${index}`}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${index}`}
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{faq.question}</strong>
                      <i aria-hidden="true">+</i>
                    </button>
                  </h3>
                  <div
                    id={`faq-answer-${index}`}
                    className="faq-answer"
                    role="region"
                    aria-labelledby={`faq-trigger-${index}`}
                    aria-hidden={!isOpen}
                  >
                    <p>{faq.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="section-shell footer-grid">
          <div className="footer-brand">
            <Image src="/brand/store-may-header.webp" alt="Store MAY" width={900} height={386} />
            <p>Moda y accesorios de marcas internacionales. 100% originales.</p>
          </div>
          <nav aria-label="Categorías del pie de página">
            <p>Categorías</p>
            {categories.map((category) => (
              <a href={`/catalogo?categoria=${encodeURIComponent(category.id === "mujeres" ? "Mujer" : category.id === "hombres" ? "Hombre" : category.id === "ninos" ? "Niños" : "Accesorios")}`} key={category.id}>
                {category.label}
              </a>
            ))}
          </nav>
          <div className="footer-contact">
            <p>Contacto</p>
            <a href="#contacto">Atención personalizada</a>
            <a href="#marcas">Nuestras marcas</a>
          </div>
        </div>
        <div className="section-shell footer-legal">
          <span>© {new Date().getFullYear()} Store MAY</span>
          <span>Catálogo multimarca premium</span>
        </div>
      </footer>
    </>
  );
}
