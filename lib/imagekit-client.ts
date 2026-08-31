import type {
  ProductImageUploadAuthResponse,
  UploadedProductImageReference
} from "@/lib/catalog-import-contract";
import { maximumCatalogMatrixImages } from "@/lib/catalog-matrix-contract";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maximumImageBytes = 5 * 1024 * 1024;

type UploadResult = { url?: string; fileId?: string };

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  timeoutMessage: string,
  networkMessage = "No se pudo conectar. Comprueba tu conexión e inténtalo otra vez."
) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new Error(timeoutMessage);
    throw new Error(networkMessage, { cause: error });
  } finally {
    window.clearTimeout(timer);
  }
}

function validateFiles(files: File[]) {
  if (!files.length) return;
  if (files.length > maximumCatalogMatrixImages) {
    throw new Error(`Selecciona hasta ${maximumCatalogMatrixImages} imágenes por lote.`);
  }
  for (const file of files) {
    if (!allowedTypes.has(file.type)) throw new Error(`La imagen '${file.name}' no tiene un formato válido.`);
    if (!file.size || file.size > maximumImageBytes) {
      throw new Error(`La imagen '${file.name}' debe pesar menos de 5 MB.`);
    }
  }
}

async function uploadOne(
  file: File,
  auth: Extract<ProductImageUploadAuthResponse, { ok: true }>,
  index: number
) {
  const credentials = auth.uploads[index];
  if (!credentials) throw new Error("No se pudo autorizar la carga de imágenes.");
  const extension = file.name.split(".").pop()?.toLocaleLowerCase() || "jpg";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", `producto-${crypto.randomUUID()}.${extension}`);
  formData.append("publicKey", auth.publicKey);
  formData.append("signature", credentials.signature);
  formData.append("expire", String(credentials.expire));
  formData.append("token", credentials.token);
  formData.append("folder", auth.folder);
  formData.append("tags", "store-may,producto");
  formData.append("useUniqueFileName", "true");

  const response = await fetchWithTimeout("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: formData
  }, 90_000,
  `La carga de '${file.name}' tardó demasiado. Comprueba tu conexión e inténtalo otra vez.`,
  `No se pudo conectar al subir '${file.name}'. Las fotos completadas se conservarán para el siguiente intento.`);
  const result = (await response.json().catch(() => ({}))) as UploadResult;
  if (!response.ok || !result.url || !result.fileId) {
    throw new Error(`No se pudo subir '${file.name}'. Comprueba tu conexión e inténtalo otra vez.`);
  }
  return { originalName: file.name, url: result.url, fileId: result.fileId };
}

export async function uploadProductImagesDirectly(
  files: File[],
  onProgress?: (completed: number, total: number) => void,
  onUploaded?: (result: UploadedProductImageReference) => void
): Promise<UploadedProductImageReference[]> {
  validateFiles(files);
  if (!files.length) return [];

  const authResponse = await fetchWithTimeout("/api/dashboard/image-upload-auth", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: files.length })
  }, 30_000, "La autorización de imágenes tardó demasiado. Recarga el dashboard e inténtalo nuevamente.");
  const auth = (await authResponse.json()) as ProductImageUploadAuthResponse;
  if (!auth.ok) throw new Error(auth.message);

  const results: UploadedProductImageReference[] = new Array(files.length);
  let completed = 0;
  for (let index = 0; index < files.length; index += 1) {
    const result = await uploadOne(files[index], auth, index);
    results[index] = result;
    completed += 1;
    onUploaded?.(result);
    onProgress?.(completed, files.length);
  }
  return results;
}
