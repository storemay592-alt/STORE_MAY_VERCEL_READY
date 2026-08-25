import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";

function securitySecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("La clave de seguridad del servidor no está configurada.");
  }
  return secret;
}

export function securityHash(value: string) {
  return createHmac("sha256", securitySecret()).update(value).digest("hex");
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() ?? "";
}

export function getRequestIdentityFromHeaders(requestHeaders: Headers) {
  const ip =
    firstHeaderValue(requestHeaders.get("x-forwarded-for")) ||
    firstHeaderValue(requestHeaders.get("x-real-ip")) ||
    "unknown";
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 320) ?? "unknown";
  return {
    ip,
    ipHash: securityHash(`ip:${ip}`),
    fingerprint: securityHash(`client:${ip}:${userAgent}`)
  };
}

export async function getRequestIdentity() {
  return getRequestIdentityFromHeaders(await headers());
}

function originMatches(origin: string, host: string, forwardedProto = "") {
  try {
    const url = new URL(origin);
    if (url.host !== firstHeaderValue(host)) return false;
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") return false;
    if (forwardedProto && url.protocol.replace(":", "") !== firstHeaderValue(forwardedProto)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function assertTrustedActionOrigin() {
  const requestHeaders = await headers();
  const fetchSite = requestHeaders.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
    throw new Error("Origen de solicitud no autorizado.");
  }

  const origin = requestHeaders.get("origin");
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "";
  if (!origin || !host || !originMatches(origin, host, proto)) {
    throw new Error("Origen de solicitud no autorizado.");
  }
}

export function isTrustedRequestOrigin(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") return false;
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const proto = request.headers.get("x-forwarded-proto") ?? "";
  return Boolean(origin && host && originMatches(origin, host, proto));
}

export function isSmallJsonRequest(request: Request, maximumBytes = 4096) {
  const contentType = request.headers.get("content-type")?.toLocaleLowerCase() ?? "";
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  return (
    contentType.startsWith("application/json") &&
    Number.isFinite(contentLength) &&
    contentLength > 0 &&
    contentLength <= maximumBytes
  );
}
