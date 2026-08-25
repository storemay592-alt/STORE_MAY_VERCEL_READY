import { NextResponse } from "next/server";
import { CatalogImportError, previewCatalogImport } from "@/lib/catalog-import";
import { readAdminSession } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getRequestIdentityFromHeaders, isTrustedRequestOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

const maximumRequestBytes = 4_450_000;
const maximumPhotoNames = 60;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" }
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
    return json({ ok: false, message: "El archivo Excel debe pesar menos de 4 MB." }, 413);
  }

  const identity = getRequestIdentityFromHeaders(request.headers);
  const rate = await consumeRateLimit({
    scope: "catalog-import-preview",
    identifier: `${session.userId}:${identity.ip}`,
    limit: 30,
    windowSeconds: 900
  });
  if (!rate.allowed) {
    return json({ ok: false, message: "Has revisado muchos archivos seguidos. Espera unos minutos." }, 429);
  }

  try {
    const formData = await request.formData();
    const spreadsheet = formData.get("spreadsheet");
    if (!(spreadsheet instanceof File) || spreadsheet.size === 0) {
      return json({ ok: false, message: "Selecciona el archivo Excel o CSV." }, 400);
    }

    let photoNames: unknown = [];
    try {
      photoNames = JSON.parse(String(formData.get("photo_names") ?? "[]"));
    } catch {
      return json({ ok: false, message: "Vuelve a seleccionar las fotos del lote." }, 400);
    }
    if (
      !Array.isArray(photoNames) ||
      photoNames.length > maximumPhotoNames ||
      photoNames.some((name) => typeof name !== "string" || name.length > 255)
    ) {
      return json({ ok: false, message: `Selecciona hasta ${maximumPhotoNames} fotos por lote.` }, 400);
    }

    const preview = await previewCatalogImport(spreadsheet, photoNames as string[]);
    return json({ ok: true, ...preview });
  } catch (error) {
    if (error instanceof CatalogImportError) {
      return json({ ok: false, message: error.message }, 400);
    }
    return json({ ok: false, message: "No se pudo revisar el archivo. Inténtalo nuevamente." }, 500);
  }
}
