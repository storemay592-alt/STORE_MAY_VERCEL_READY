import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/auth/session";
import { CatalogMatrixError, uploadCatalogMatrix } from "@/lib/catalog-matrix";
import {
  maximumCatalogMatrixImages,
  type CatalogMatrixAssignment,
  type CatalogMatrixClassificationOverride,
  type CatalogMatrixInventoryOverride
} from "@/lib/catalog-matrix-contract";
import type { UploadedProductImageReference } from "@/lib/catalog-import-contract";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getRequestIdentityFromHeaders, isTrustedRequestOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

const maximumRequestBytes = 4_750_000;

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" }
  });
}

function parseJsonArray(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function safeErrorMessage(error: unknown) {
  if (error instanceof CatalogMatrixError) return error.message;
  if (!(error instanceof Error)) return "No se pudo guardar el catálogo.";
  const allowed = new Set([
    "Las referencias de imágenes no son válidas.",
    "Una de las imágenes subidas no es válida.",
    "El almacenamiento de imágenes aún no está configurado."
  ]);
  return allowed.has(error.message)
    ? error.message
    : "No se pudo guardar el catálogo. Ningún producto incompleto fue insertado.";
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
    return json({ ok: false, message: "El lote es demasiado grande. Divídelo en dos matrices." }, 413);
  }

  const identity = getRequestIdentityFromHeaders(request.headers);
  const limit = await consumeRateLimit({
    scope: "catalog-matrix-upload",
    identifier: `${session.userId}:${identity.ip}`,
    limit: 12,
    windowSeconds: 3600
  });
  if (!limit.allowed) {
    return json({ ok: false, message: "Se alcanzó el límite de importaciones. Espera unos minutos." }, 429);
  }

  try {
    const formData = await request.formData();
    const spreadsheet = formData.get("spreadsheet");
    if (!(spreadsheet instanceof File) || !spreadsheet.size) {
      return json({ ok: false, message: "Selecciona la matriz de Excel." }, 400);
    }

    const duplicateMode = formData.get("duplicate_mode");
    if (duplicateMode !== "skip" && duplicateMode !== "create" && duplicateMode !== "update") {
      return json({ ok: false, message: "Elige si se crean o actualizan los productos existentes." }, 400);
    }

    const uploadedPhotos = parseJsonArray(formData.get("uploaded_photos"));
    const assignments = parseJsonArray(formData.get("assignments"));
    const selectedRowNumbers = parseJsonArray(formData.get("selected_row_numbers"));
    const inventoryOverrides = parseJsonArray(formData.get("inventory_overrides"));
    const classificationOverrides = parseJsonArray(formData.get("classification_overrides"));
    if (
      !uploadedPhotos ||
      !assignments ||
      !selectedRowNumbers ||
      !inventoryOverrides ||
      !classificationOverrides ||
      uploadedPhotos.length > maximumCatalogMatrixImages ||
      assignments.length > maximumCatalogMatrixImages ||
      selectedRowNumbers.length > 500 ||
      inventoryOverrides.length > 500 ||
      classificationOverrides.length > 500
    ) {
      return json({ ok: false, message: "La relación entre imágenes y productos no es válida." }, 400);
    }

    const summary = await uploadCatalogMatrix({
      spreadsheet,
      uploadedPhotos: uploadedPhotos as UploadedProductImageReference[],
      assignments: assignments as CatalogMatrixAssignment[],
      selectedRowNumbers: selectedRowNumbers as number[],
      inventoryOverrides: inventoryOverrides as CatalogMatrixInventoryOverride[],
      classificationOverrides: classificationOverrides as CatalogMatrixClassificationOverride[],
      duplicateMode,
      category: String(formData.get("category") ?? ""),
      gender: String(formData.get("gender") ?? "")
    });
    refreshCatalog();
    return json({ ok: true, summary });
  } catch (error) {
    console.error("[upload-catalog] Error:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error("[upload-catalog] Stack:", error.stack.split("\n").slice(0, 5).join(" | "));
    }
    return json(
      { ok: false, message: safeErrorMessage(error) },
      error instanceof CatalogMatrixError ? 400 : 500
    );
  }
}
