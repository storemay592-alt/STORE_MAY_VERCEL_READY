import { NextRequest, NextResponse } from "next/server";
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
};

const visitMemory = globalThis as VisitMemory;
visitMemory.storeMayVisitorIds ??= new Set<string>();

function isValidVisitorId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{16,80}$/.test(value);
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
  const identity = getRequestIdentityFromHeaders(request.headers);
  const limit = await consumeRateLimit({
    scope: "site-visits-read",
    identifier: identity.fingerprint,
    limit: 120,
    windowSeconds: 600
  });
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
  const identity = getRequestIdentityFromHeaders(request.headers);
  const limit = await consumeRateLimit({
    scope: "site-visits-write",
    identifier: identity.fingerprint,
    limit: 20,
    windowSeconds: 600
  });
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
