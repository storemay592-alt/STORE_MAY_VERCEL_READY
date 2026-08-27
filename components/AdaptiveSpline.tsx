"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
  deviceMemory?: number;
};

type AdaptiveSplineProps = {
  className?: string;
  frameClassName?: string;
  src: string;
  title: string;
  posterSrc: string;
  posterAlt: string;
  allow?: string;
  referrerPolicy?: React.IframeHTMLAttributes<HTMLIFrameElement>["referrerPolicy"];
  sandbox?: string;
};

function deviceCanAutoLoad() {
  const device = navigator as NavigatorWithConnection;
  const connection = device.connection;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const narrowScreen = window.matchMedia("(max-width: 767px)").matches;
  const slowConnection =
    connection?.saveData ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g";
  const limitedHardware =
    (typeof device.deviceMemory === "number" && device.deviceMemory <= 4) ||
    (typeof device.hardwareConcurrency === "number" && device.hardwareConcurrency <= 4);

  return !reducedMotion && !coarsePointer && !narrowScreen && !slowConnection && !limitedHardware;
}

export function AdaptiveSpline({
  className = "",
  frameClassName = "",
  src,
  title,
  posterSrc,
  posterAlt,
  allow,
  referrerPolicy,
  sandbox
}: AdaptiveSplineProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [manualPlayback, setManualPlayback] = useState(false);
  const [autoLoad, setAutoLoad] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAutoLoad(deviceCanAutoLoad());
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setNearViewport(entry.isIntersecting);
        if (!entry.isIntersecting) setLoaded(false);
      },
      { rootMargin: "280px 0px", threshold: 0.01 }
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const showInteractiveScene = nearViewport && (autoLoad || manualPlayback);

  return (
    <div
      ref={rootRef}
      className={`adaptive-scene ${showInteractiveScene ? "is-interactive" : "is-poster"} ${
        loaded ? "is-loaded" : ""
      } ${className}`.trim()}
    >
      <Image
        className="adaptive-scene-poster"
        src={posterSrc}
        alt={posterAlt}
        fill
        sizes="100vw"
        quality={78}
      />

      {showInteractiveScene ? (
        <iframe
          className={frameClassName}
          src={src}
          title={title}
          loading="lazy"
          allow={allow}
          allowFullScreen={allow?.includes("fullscreen")}
          sandbox={sandbox}
          referrerPolicy={referrerPolicy}
          onLoad={() => setLoaded(true)}
        />
      ) : null}

      {!showInteractiveScene ? (
        <button
          className="adaptive-scene-trigger"
          type="button"
          onClick={() => setManualPlayback(true)}
          aria-label={`Activar ${title}`}
        >
          <span aria-hidden="true">◌</span>
          Activar experiencia 3D
        </button>
      ) : (
        <button
          className="adaptive-scene-pause"
          type="button"
          onClick={() => {
            setManualPlayback(false);
            setAutoLoad(false);
            setLoaded(false);
          }}
          aria-label={`Pausar ${title}`}
        >
          Pausar 3D
        </button>
      )}

      {showInteractiveScene && !loaded ? (
        <span className="adaptive-scene-loading" role="status">
          Preparando 3D
        </span>
      ) : null}
    </div>
  );
}
