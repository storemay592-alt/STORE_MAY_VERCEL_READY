import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/auth/session";
import { createProductImageUploadAuthorizations } from "@/lib/imagekit";
import { maximumCatalogMatrixImages } from "@/lib/catalog-matrix-contract";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import {
  getRequestIdentityFromHeaders,
  isSmallJsonRequest,
  isTrustedRequestOrigin
} from "@/lib/security/request";

export const runtime = "nodejs";

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" }
  });
}

export async function POST(request: Request) {
  if (!isTrustedRequestOrigin(request) || !isSmallJsonRequest(request, 1024)) {
    return json({ ok: false, message: "Solicitud no autorizada." }, 403);
  }
  const session = await readAdminSession();
  if (!session) return json({ ok: false, message: "Tu sesión venció. Vuelve a iniciar sesión." }, 401);

  const identity = getRequestIdentityFromHeaders(request.headers);
  const rate = await consumeRateLimit({
    scope: "image-upload-auth",
    identifier: `${session.userId}:${identity.ip}`,
    limit: 20,
    windowSeconds: 900
  });
  if (!rate.allowed) {
    return json({ ok: false, message: "Has iniciado muchas cargas seguidas. Espera unos minutos." }, 429);
  }

  try {
    const body = (await request.json()) as { count?: unknown };
    const count = Number(body.count);
    if (!Number.isInteger(count) || count < 1 || count > maximumCatalogMatrixImages) {
      return json(
        { ok: false, message: `Selecciona entre 1 y ${maximumCatalogMatrixImages} imágenes.` },
        400
      );
    }
    return json({ ok: true, ...createProductImageUploadAuthorizations(count) });
  } catch {
    return json({ ok: false, message: "No se pudo autorizar la carga de imágenes." }, 500);
  }
}
