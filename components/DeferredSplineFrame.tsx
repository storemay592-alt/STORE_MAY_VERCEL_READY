"use client";

import { useEffect, useRef, useState } from "react";

type DeferredSplineFrameProps = {
  className?: string;
  src: string;
  title: string;
};

type NavigatorWithConnection = Navigator & {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
};

export function DeferredSplineFrame({
  className,
  src,
  title
}: DeferredSplineFrameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const releaseTimerRef = useRef<number | null>(null);
  const idleCallbackRef = useRef<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [requiresConsent, setRequiresConsent] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const device = navigator as NavigatorWithConnection;
    const saveData = Boolean(device.connection?.saveData);
    const verySlowConnection = ["slow-2g", "2g"].includes(
      device.connection?.effectiveType ?? ""
    );

    if (saveData || verySlowConnection) {
      setRequiresConsent(true);
      return;
    }

    const mountWhenIdle = () => {
      if (idleCallbackRef.current !== null || isMounted) return;

      const schedule = window.requestIdleCallback ?? ((callback: IdleRequestCallback) => {
        return window.setTimeout(() => callback({ didTimeout: false, timeRemaining: () => 16 }), 160);
      });

      idleCallbackRef.current = schedule(() => {
        idleCallbackRef.current = null;
        setIsMounted(true);
      }, { timeout: 900 });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (releaseTimerRef.current !== null) {
          window.clearTimeout(releaseTimerRef.current);
          releaseTimerRef.current = null;
        }

        if (entry.isIntersecting) {
          mountWhenIdle();
          return;
        }

        releaseTimerRef.current = window.setTimeout(() => {
          if (idleCallbackRef.current !== null) {
            if (window.cancelIdleCallback) window.cancelIdleCallback(idleCallbackRef.current);
            else window.clearTimeout(idleCallbackRef.current);
            idleCallbackRef.current = null;
          }
          setIsMounted(false);
          setIsReady(false);
        }, 320);
      },
      { rootMargin: "0px", threshold: 0.06 }
    );

    observer.observe(host);

    return () => {
      observer.disconnect();
      if (releaseTimerRef.current !== null) window.clearTimeout(releaseTimerRef.current);
      if (idleCallbackRef.current !== null) {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idleCallbackRef.current);
        else window.clearTimeout(idleCallbackRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={`deferred-spline-frame ${isReady ? "is-ready" : ""}`}
      data-spline-status={isReady ? "ready" : "pending"}
    >
      {isMounted ? (
        <iframe
          className={className}
          src={src}
          title={title}
          loading="lazy"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setIsReady(true)}
        />
      ) : null}

      {requiresConsent && !isMounted ? (
        <button
          className="deferred-spline-activate"
          type="button"
          onClick={() => {
            setRequiresConsent(false);
            setIsMounted(true);
          }}
        >
          Activar experiencia 3D
        </button>
      ) : null}

      {isMounted && !isReady ? (
        <span className="deferred-spline-loader" aria-hidden="true" />
      ) : null}
    </div>
  );
}
