import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { CatalogImportError, confirmCatalogImport } from "@/lib/catalog-import";
import { readAdminSession } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getRequestIdentityFromHeaders, isTrustedRequestOrigin } from "@/lib/security/request";
import type { UploadedProductImageReference } from "@/lib/catalog-import-contract";

export const runtime = "nodejs";

const maximumRequestBytes = 4_450_000;
const maximumPhotoFiles = 60;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" }
  });
}

function safeImportMessage(error: unknown) {
  if (error instanceof CatalogImportError) return error.message;
  if (!(error instanceof Error)) return "No se pudo completar la importación.";
  const allowed = [
    "Las referencias de imágenes no son válidas.",
    "Una de las imágenes subidas no es válida.",
    "El almacenamiento de imágenes aún no está configurado."
  ];
  return allowed.includes(error.message)
    ? error.message
    : "No se pudo completar la importación. Ningún dato incompleto fue guardado.";
}

function refreshCatalog() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/estadisticas");
  revalidatePath("/catalogo");
  revalidatePath("/tienda");
  revalidatePath("/sitemap.xml");
}

export async function POST(request: Request) {
  if (!isTrustedRequestOrigin(request)) {
    return json({ ok: false, message: "Solicitud no autorizada." }, 403);
  }

  const session = await readAdminSession();
  if (!session) return json({ ok: false, message: "Tu sesión venció. Vuelve a iniciar sesión." }, 401);

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength <= 0 || contentLength > maximumRequestBytes) {
    return json({ ok: false, message: "El lote es demasiado grande. Impórtalo en dos partes." }, 413);
  }

  const identity = getRequestIdentityFromHeaders(request.headers);
  const rate = await consumeRateLimit({
    scope: "catalog-import-confirm",
    identifier: `${session.userId}:${identity.ip}`,
    limit: 12,
    windowSeconds: 3600
  });
  if (!rate.allowed) {
    return json({ ok: false, message: "Se alcanzó el límite de importaciones. Espera unos minutos." }, 429);
  }

  try {
    const formData = await request.formData();
    const spreadsheet = formData.get("spreadsheet");
    if (!(spreadsheet instanceof File) || spreadsheet.size === 0) {
      return json({ ok: false, message: "Selecciona el archivo Excel o CSV." }, 400);
    }

    const duplicateMode = formData.get("duplicate_mode");
    if (duplicateMode !== "create" && duplicateMode !== "update") {
      return json({ ok: false, message: "Elige qué hacer con los productos que ya existen." }, 400);
    }

    let uploadedPhotos: unknown;
    try {
      uploadedPhotos = JSON.parse(String(formData.get("uploaded_photos") ?? "[]"));
    } catch {
      return json({ ok: false, message: "Vuelve a seleccionar las fotos del lote." }, 400);
    }
    if (!Array.isArray(uploadedPhotos) || uploadedPhotos.length > maximumPhotoFiles) {
      return json({ ok: false, message: "Selecciona hasta 60 fotos por lote." }, 400);
    }

    const summary = await confirmCatalogImport(
      spreadsheet,
      uploadedPhotos as UploadedProductImageReference[],
      duplicateMode
    );
    refreshCatalog();
    return json({ ok: true, summary });
  } catch (error) {
    const message = safeImportMessage(error);
    return json({ ok: false, message }, error instanceof CatalogImportError ? 400 : 500);
  }
}
