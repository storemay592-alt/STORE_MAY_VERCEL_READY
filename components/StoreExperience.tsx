"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DeferredSplineFrame } from "@/components/DeferredSplineFrame";
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

const storeWhatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(
  "Hola Store MAY, quiero recibir atención personalizada."
)}`;

export default function StoreExperience() {
  const [openFaq, setOpenFaq] = useState(0);
  const [heroSoundEnabled, setHeroSoundEnabled] = useState(false);
  const [heroVideoReady, setHeroVideoReady] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroSoundEnabledRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    const registerVisit = async () => {
      try {
        const storageKey = "store-may-visitor-id";
        let visitorId = window.localStorage.getItem(storageKey);
        if (!visitorId || !/^[a-zA-Z0-9-]{16,80}$/.test(visitorId)) {
          const entropy = typeof window.crypto?.getRandomValues === "function"
            ? Array.from(window.crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(36)).join("")
            : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
          visitorId = `may-${entropy}`.slice(0, 80);
          window.localStorage.setItem(storageKey, visitorId);
        }
        const response = await fetch("/api/visitas", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId }),
          signal: controller.signal
        });
        if (!response.ok) return;
        const result = await response.json() as { count?: unknown };
        if (typeof result.count === "number" && Number.isFinite(result.count)) {
          setVisitorCount(Math.max(0, Math.trunc(result.count)));
        }
      } catch {
        // El contador nunca debe interferir con la experiencia de compra.
      }
    };
    void registerVisit();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const hero = heroRef.current;
    if (!video || !hero) return;

    const device = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const connection = device.connection;
    const mobilePortrait = window.matchMedia("(max-width: 900px) and (orientation: portrait)");
    const conserveData =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      Boolean(connection?.saveData) ||
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g";
    let heroVisible = true;

    if (conserveData) video.pause();

    const startVideo = () => {
      if (!heroVisible || document.hidden || (conserveData && !heroSoundEnabledRef.current)) return;
      video.muted = !heroSoundEnabledRef.current;
      video.play().catch(() => undefined);
    };

    const resumeWhenVisible = () => {
      if (!document.hidden) startVideo();
      else video.pause();
    };

    const reloadResponsiveSource = () => {
      setHeroVideoReady(false);
      video.pause();
      video.load();
      window.requestAnimationFrame(startVideo);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        heroVisible = entry.isIntersecting;
        if (heroVisible) startVideo();
        else video.pause();
      },
      { threshold: 0.08 }
    );

    startVideo();
    observer.observe(hero);
    video.addEventListener("canplay", startVideo);
    mobilePortrait.addEventListener("change", reloadResponsiveSource);
    document.addEventListener("visibilitychange", resumeWhenVisible);

    return () => {
      observer.disconnect();
      video.pause();
      video.removeEventListener("canplay", startVideo);
      mobilePortrait.removeEventListener("change", reloadResponsiveSource);
      document.removeEventListener("visibilitychange", resumeWhenVisible);
    };
  }, []);

  const toggleHeroSound = () => {
    const video = videoRef.current;
    if (!video) return;

    const nextSoundState = !heroSoundEnabledRef.current;
    heroSoundEnabledRef.current = nextSoundState;
    video.muted = !nextSoundState;
    video.volume = 0.86;
    setHeroSoundEnabled(nextSoundState);

    if (nextSoundState) video.play().catch(() => undefined);
  };

  return (
    <>
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>

      <PremiumHeader />

      <main id="contenido">
        <section
          ref={heroRef}
          className="hero"
          id="inicio"
          aria-label="Presentación de Store MAY"
        >
          <h1 className="sr-only">
            Store MAY: ropa, calzado y accesorios de marcas 100% originales
          </h1>
          <picture
            className={`hero-poster ${heroVideoReady ? "is-hidden" : ""}`}
            aria-hidden="true"
          >
            <source
              media="(max-width: 900px) and (orientation: portrait)"
              srcSet="/video/store-may-0826-mobile-poster.webp"
            />
            <img
              src="/video/store-may-0826-desktop-poster.webp"
              alt=""
              fetchPriority="high"
            />
          </picture>
          <video
            ref={videoRef}
            className="hero-video"
            autoPlay
            muted={!heroSoundEnabled}
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            aria-label="Presentación audiovisual de Store MAY"
            onLoadedData={() => setHeroVideoReady(true)}
            onPlaying={() => setHeroVideoReady(true)}
          >
            <source
              media="(max-width: 900px) and (orientation: portrait)"
              src="/video/store-may-0826-mobile.mp4"
              type="video/mp4"
            />
            <source
              src="/video/store-may-0826-desktop.webm"
              type="video/webm"
            />
            <source src="/video/store-may-0826-web.mp4" type="video/mp4" />
            Tu navegador no admite la reproducción de video.
          </video>
          <span className="hero-video-wash" aria-hidden="true" />

          <button
            className={`hero-sound-control ${heroSoundEnabled ? "is-active" : ""}`}
            type="button"
            aria-pressed={heroSoundEnabled}
            aria-label={heroSoundEnabled ? "Silenciar video" : "Activar sonido del video"}
            onClick={toggleHeroSound}
          >
            <span className="hero-sound-icon" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <small>Experiencia audiovisual</small>
              <strong>{heroSoundEnabled ? "Sonido activado" : "Activar sonido"}</strong>
            </span>
          </button>
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
              <DeferredSplineFrame
                src="/spline-original"
                title="Experiencia interactiva 100% original de Store MAY"
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
            {categories.map((category, index) => (
              <a
                href={`/tienda?categoria=${category.id}`}
                key={category.id}
                aria-label={category.label}
              >
                <span className="category-menu-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="category-menu-label" aria-hidden="true">
                  {category.label.toLocaleUpperCase("es")}
                </span>
                <span className="category-menu-orb" aria-hidden="true">
                  <span className="category-menu-arrow">+</span>
                </span>
              </a>
            ))}
          </nav>
        </section>

        <section
          className="advisor-showcase advisor-spline-showcase"
          id="contacto"
          aria-label="Experiencia interactiva Store MAY"
        >
          <div className="advisor-spline-stage">
            <DeferredSplineFrame
              className="advisor-spline-viewer"
              src="/spline-stage"
              title="Objeto 3D interactivo de Store MAY"
            />
          </div>
          <a
            className="advisor-whatsapp-button"
            href={storeWhatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Contactar a Store MAY por WhatsApp"
          >
            <span className="advisor-whatsapp-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32">
                <path d="M16.03 4.3A11.5 11.5 0 0 0 6.3 21.94L4.8 27.4l5.59-1.46a11.5 11.5 0 1 0 5.64-21.64Zm0 20.96c-1.75 0-3.46-.48-4.95-1.38l-.36-.21-3.32.87.89-3.24-.23-.37a9.45 9.45 0 1 1 7.97 4.33Zm5.18-7.07c-.28-.14-1.67-.82-1.93-.92-.26-.09-.45-.14-.64.14-.19.28-.73.92-.9 1.11-.16.19-.33.21-.61.07-.28-.14-1.19-.44-2.26-1.4a8.44 8.44 0 0 1-1.57-1.95c-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.64-1.55-.88-2.12-.23-.56-.47-.48-.64-.49h-.54c-.19 0-.49.07-.75.35-.26.28-.99.97-.99 2.36s1.02 2.74 1.16 2.93c.14.19 2 3.06 4.85 4.29.68.29 1.21.47 1.62.6.68.22 1.3.19 1.79.12.55-.08 1.67-.68 1.9-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33Z" />
              </svg>
            </span>
          </a>
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
              <h2 id="testimonials-title">TESTIMONIOS</h2>
            </header>
            <div className="testimonial-grid">
              {testimonialFrames.map((item) => (
                <article key={item.number}>
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
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
            <Image
              className="footer-brand-cubes"
              src="/brand/store-may-cubos.png"
              alt="Store MAY"
              width={634}
              height={283}
            />
            <p>Moda y accesorios de marcas internacionales. 100% originales.</p>
          </div>
          <nav aria-label="Categorías del pie de página">
            <p>Categorías</p>
            {categories.map((category) => (
              <a href={`/tienda?categoria=${category.id}`} key={category.id}>
                {category.label}
              </a>
            ))}
          </nav>
          <div className="footer-contact">
            <p>Contacto</p>
            <a href="#marcas">Nuestras marcas</a>
            <a href="/politicas-compra">Políticas de compra y entregas</a>
            <a href="/privacidad-cookies">Privacidad y cookies</a>
          </div>
        </div>
        <div className="section-shell footer-legal">
          <span>© {new Date().getFullYear()} Store MAY</span>
          <span>Catálogo multimarca premium</span>
          <span
            className="footer-visitor-counter"
            aria-label={
              visitorCount === null
                ? "Conteo de visitas no disponible"
                : `${new Intl.NumberFormat("es-EC").format(visitorCount)} visitas registradas`
            }
            aria-live="polite"
          >
            <strong>{visitorCount === null ? "—" : new Intl.NumberFormat("es-EC").format(visitorCount)}</strong>
          </span>
        </div>
      </footer>
    </>
  );
}
