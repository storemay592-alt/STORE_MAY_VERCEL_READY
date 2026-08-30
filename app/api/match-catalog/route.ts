import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/auth/session";
import {
  CatalogMatrixError,
  previewCatalogMatrix
} from "@/lib/catalog-matrix";
import { maximumCatalogMatrixImages } from "@/lib/catalog-matrix-contract";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getRequestIdentityFromHeaders, isTrustedRequestOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

const maximumRequestBytes = 4_500_000;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" }
  });
}

export async function POST(request: Request) {
  if (!isTrustedRequestOrigin(request)) {
    return json({ ok: false, message: "Solicitud no autorizada." }, 403);
  }
  const session = await readAdminSession();
  if (!session) return json({ ok: false, message: "Tu sesión venció. Vuelve a iniciar sesión." }, 401);

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > maximumRequestBytes) {
    return json({ ok: false, message: "La matriz debe pesar menos de 4 MB." }, 413);
  }

  const identity = getRequestIdentityFromHeaders(request.headers);
  const limit = await consumeRateLimit({
    scope: "catalog-matrix-match",
    identifier: `${session.userId}:${identity.ip}`,
    limit: 30,
    windowSeconds: 900
  });
  if (!limit.allowed) {
    return json({ ok: false, message: "Has analizado muchos lotes seguidos. Espera unos minutos." }, 429);
  }

  try {
    const formData = await request.formData();
    const spreadsheet = formData.get("spreadsheet");
    if (!(spreadsheet instanceof File) || !spreadsheet.size) {
      return json({ ok: false, message: "Selecciona la matriz de Excel." }, 400);
    }

    let imageNames: unknown;
    try {
      imageNames = JSON.parse(String(formData.get("image_names") ?? "[]"));
    } catch {
      return json({ ok: false, message: "Vuelve a seleccionar las imágenes del lote." }, 400);
    }
    if (
      !Array.isArray(imageNames) ||
      imageNames.length > maximumCatalogMatrixImages ||
      imageNames.some((name) => typeof name !== "string" || name.length > 255)
    ) {
      return json(
        { ok: false, message: `Selecciona hasta ${maximumCatalogMatrixImages} imágenes válidas.` },
        400
      );
    }

    const preview = await previewCatalogMatrix(spreadsheet, imageNames as string[]);
    return json({ ok: true, preview });
  } catch (error) {
    if (error instanceof CatalogMatrixError) {
      return json({ ok: false, message: error.message }, 400);
    }
    return json({ ok: false, message: "No se pudo analizar el lote. Inténtalo nuevamente." }, 500);
  }
}
