import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getDatabase } from "@/lib/db";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import {
  getRequestIdentityFromHeaders,
  isSmallJsonRequest,
  isTrustedRequestOrigin
} from "@/lib/security/request";

export const dynamic = "force-dynamic";

type VisitCountRow = { total: number | string };
type VisitMemory = typeof globalThis & {
  storeMayVisitorIds?: Set<string>;
  storeMayVisitLimits?: Map<string, { count: number; startedAt: number }>;
};

const visitMemory = globalThis as VisitMemory;
visitMemory.storeMayVisitorIds ??= new Set<string>();
visitMemory.storeMayVisitLimits ??= new Map();

async function consumeVisitLimit(scope: string, identifier: string, limit: number, windowSeconds: number) {
  try {
    return await consumeRateLimit({ scope, identifier, limit, windowSeconds });
  } catch {
    const key = `${scope}:${identifier}`;
    const now = Date.now();
    const current = visitMemory.storeMayVisitLimits?.get(key);
    const expired = !current || current.startedAt + windowSeconds * 1000 <= now;
    const next = expired ? { count: 1, startedAt: now } : { ...current, count: current.count + 1 };
    visitMemory.storeMayVisitLimits?.set(key, next);
    return {
      allowed: next.count <= limit,
      remaining: Math.max(0, limit - next.count),
      retryAfter: Math.max(1, Math.ceil((next.startedAt + windowSeconds * 1000 - now) / 1000))
    };
  }
}

function isValidVisitorId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{16,80}$/.test(value);
}

function visitFingerprint(headers: Headers) {
  try {
    return getRequestIdentityFromHeaders(headers).fingerprint;
  } catch {
    const source = `${headers.get("x-forwarded-for") ?? "local"}:${headers.get("user-agent") ?? "unknown"}`;
    return createHash("sha256").update(source).digest("hex");
  }
}

async function persistentCount(visitorId?: string) {
  const sql = getDatabase();

  if (visitorId) {
    await sql`
      INSERT INTO visitas_sitio (visitor_id)
      VALUES (${visitorId})
      ON CONFLICT (visitor_id)
      DO UPDATE SET ultima_visita = NOW()
    `;
  }

  const rows = await sql`SELECT COUNT(*)::INT AS total FROM visitas_sitio`;
  return Number((rows[0] as VisitCountRow).total);
}

async function getCount(visitorId?: string) {
  try {
    return await persistentCount(visitorId);
  } catch {
    if (visitorId) visitMemory.storeMayVisitorIds?.add(visitorId);
    return visitMemory.storeMayVisitorIds?.size ?? 0;
  }
}

export async function GET(request: NextRequest) {
  const fingerprint = visitFingerprint(request.headers);
  const limit = await consumeVisitLimit("site-visits-read", fingerprint, 120, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }
  return NextResponse.json({ count: await getCount() });
}

export async function POST(request: NextRequest) {
  if (!isSmallJsonRequest(request)) {
    return NextResponse.json({ error: "Solicitud no válida." }, { status: 415 });
  }
  if (!isTrustedRequestOrigin(request)) {
    return NextResponse.json({ error: "Origen no autorizado." }, { status: 403 });
  }
  const fingerprint = visitFingerprint(request.headers);
  const limit = await consumeVisitLimit("site-visits-write", fingerprint, 20, 600);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }
  const body = await request.json().catch(() => null);
  const visitorId = body?.visitorId;

  if (!isValidVisitorId(visitorId)) {
    return NextResponse.json({ error: "Identificador de visita inválido." }, { status: 400 });
  }

  return NextResponse.json({ count: await getCount(visitorId) });
}
