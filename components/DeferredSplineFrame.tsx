"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const [isInteractive, setIsInteractive] = useState(false);
  const [requiresConsent, setRequiresConsent] = useState(false);

  const releaseInteraction = useCallback(() => {
    setIsInteractive(false);
    hostRef.current?.querySelector("iframe")?.blur();
  }, []);

  useEffect(() => {
    if (!isInteractive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") releaseInteraction();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInteractive, releaseInteraction]);

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
          setIsInteractive(false);
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
      className={`deferred-spline-frame ${isReady ? "is-ready" : ""} ${isInteractive ? "is-interactive" : ""}`}
      data-spline-status={isReady ? "ready" : "pending"}
      data-spline-interaction={isInteractive ? "active" : "released"}
      onPointerLeave={releaseInteraction}
    >
      {isMounted ? (
        <iframe
          className={className}
          src={src}
          title={title}
          loading="lazy"
          tabIndex={isInteractive ? 0 : -1}
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

      {isMounted && isReady && !isInteractive ? (
        <button
          className="deferred-spline-entry-surface"
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setIsInteractive(true)}
        />
      ) : null}

      {isMounted && isReady ? (
        <button
          className="deferred-spline-interaction"
          type="button"
          aria-pressed={isInteractive}
          onClick={() => {
            if (isInteractive) releaseInteraction();
            else setIsInteractive(true);
          }}
        >
          <span aria-hidden="true" />
          {isInteractive ? "Liberar scroll" : "Explorar 3D"}
        </button>
      ) : null}
    </div>
  );
}
