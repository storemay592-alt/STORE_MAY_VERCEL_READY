import { NextRequest, NextResponse } from "next/server";

function configuredPublicOrigin() {
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    return origin.protocol === "https:" ? origin : null;
  } catch {
    return null;
  }
}

function contentSecurityPolicy(nonce: string, allowSplineWasm = false) {
  const isDevelopment = process.env.NODE_ENV === "development";
  const imageKitOrigin = (() => {
    try {
      return process.env.IMAGEKIT_URL_ENDPOINT
        ? new URL(process.env.IMAGEKIT_URL_ENDPOINT).origin
        : "https://ik.imagekit.io";
    } catch {
      return "https://ik.imagekit.io";
    }
  })();

  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${allowSplineWasm ? " 'wasm-unsafe-eval'" : ""}${isDevelopment ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: ${imageKitOrigin} https://*.imagekit.io https://prod.spline.design;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://prod.spline.design https://cdn.spline.design https://www.gstatic.com${isDevelopment ? " ws: wss:" : ""};
    frame-src 'self' https://my.spline.design;
    media-src 'self' blob:;
    worker-src 'self' blob:;
    manifest-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors ${allowSplineWasm ? "'self'" : "'none'"};
    ${isDevelopment ? "" : "upgrade-insecure-requests;"}
  `.replace(/\s{2,}/g, " ").trim();
}

export function proxy(request: NextRequest) {
  const isLocalHost = request.nextUrl.hostname === "localhost" || request.nextUrl.hostname === "127.0.0.1";
  const publicOrigin = configuredPublicOrigin();
  const isPreviewDeployment = process.env.VERCEL_ENV === "preview";

  if (process.env.NODE_ENV === "production" && !isLocalHost && !isPreviewDeployment && publicOrigin) {
    const requestHost = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
      .split(",")[0]
      .trim()
      .toLocaleLowerCase();
    const requestProto = (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", ""))
      .split(",")[0]
      .trim()
      .toLocaleLowerCase();
    const canonicalHost = publicOrigin.host.toLocaleLowerCase();

    if (requestHost !== canonicalHost || requestProto !== "https") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return NextResponse.json(
          { error: "Dominio de solicitud no autorizado." },
          { status: 421, headers: { "Cache-Control": "private, no-store" } }
        );
      }

      const target = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, publicOrigin);
      return NextResponse.redirect(target, 308);
    }
  }

  if (process.env.NODE_ENV === "production" && !isLocalHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    if (forwardedProto && forwardedProto !== "https") {
      const target = publicOrigin
        ? new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, publicOrigin)
        : new URL(request.url);
      target.protocol = "https:";
      return NextResponse.redirect(target, 308);
    }
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = contentSecurityPolicy(nonce, request.nextUrl.pathname === "/spline-stage");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  if (request.method === "POST" && request.nextUrl.pathname === "/dashboard/login") {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (!Number.isFinite(contentLength) || contentLength < 0 || contentLength > 16_384) {
      const rejected = NextResponse.json({ error: "Solicitud demasiado grande." }, { status: 413 });
      rejected.headers.set("Content-Security-Policy", csp);
      rejected.headers.set("Cache-Control", "private, no-store, max-age=0");
      rejected.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      return rejected;
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  if (/^\/(?:dashboard|admin|api)(?:\/|$)/.test(request.nextUrl.pathname)) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("CDN-Cache-Control", "no-store");
    response.headers.set("Vercel-CDN-Cache-Control", "no-store");
    response.headers.set("Surrogate-Control", "no-store");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|webp|avif|gif|ico|woff|woff2|mp4)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" }
      ]
    }
  ]
};
