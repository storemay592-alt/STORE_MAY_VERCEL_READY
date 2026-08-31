import "server-only";
import { randomUUID } from "node:crypto";
import ImageKit, { toFile } from "@imagekit/nodejs";
import type {
  ProductImageUploadAuthorization,
  UploadedProductImageReference
} from "@/lib/catalog-import-contract";
import { maximumCatalogMatrixImages } from "@/lib/catalog-matrix-contract";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxImageSize = 5 * 1024 * 1024;
export const productImageFolder = "/store-may/productos";

const extensionsByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

export function isImageKitConfigured() {
  return Boolean(
    process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.IMAGEKIT_PUBLIC_KEY &&
      process.env.IMAGEKIT_URL_ENDPOINT
  );
}

function imageKitClient() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!isImageKitConfigured() || !privateKey) {
    throw new Error("El almacenamiento de imágenes aún no está configurado.");
  }

  return new ImageKit({ privateKey });
}

function detectedImageType(bytes: Uint8Array) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)
  ) return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) return "image/webp";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(4, 8)) === "ftyp") {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return null;
}

export function isAllowedStoredImageUrl(value: string) {
  if (/^\/catalog\/[a-zA-Z0-9/_-]+\.(?:jpe?g|png|webp|avif)$/i.test(value) && !value.includes("..")) {
    return true;
  }

  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return false;
  try {
    const candidate = new URL(value);
    const allowed = new URL(endpoint);
    const allowedPath = allowed.pathname.endsWith("/") ? allowed.pathname : `${allowed.pathname}/`;
    return candidate.protocol === "https:" && candidate.origin === allowed.origin && candidate.pathname.startsWith(allowedPath);
  } catch {
    return false;
  }
}

export async function validateProductImageFile(file: File) {
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Usa una imagen JPG, PNG, WebP o AVIF.");
  }

  if (file.size === 0 || file.size > maxImageSize) {
    throw new Error("La imagen debe pesar menos de 5 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (detectedImageType(bytes) !== file.type) {
    throw new Error("El contenido del archivo no corresponde a una imagen válida.");
  }

  const extension = extensionsByMimeType[file.type];
  return { bytes, extension };
}

export async function uploadProductImageAsset(file: File) {
  const { bytes, extension } = await validateProductImageFile(file);
  const fileName = `producto-${randomUUID()}.${extension}`;
  const uploadable = await toFile(bytes, fileName, {
    type: file.type
  });

  const result = await imageKitClient().files.upload({
    file: uploadable,
    fileName,
    folder: "/store-may/productos",
    tags: ["store-may", "producto"],
    useUniqueFileName: true
  });

  if (!result.url) {
    throw new Error("ImageKit no devolvió una URL para la imagen.");
  }

  return { url: result.url, fileId: result.fileId ?? "" };
}

export async function uploadProductImage(file: File) {
  return (await uploadProductImageAsset(file)).url;
}

export async function uploadProductImages(files: File[]) {
  const uploaded: string[] = [];
  for (const file of files) uploaded.push(await uploadProductImage(file));
  return uploaded;
}

export async function deleteProductImageAssets(fileIds: string[]) {
  if (!fileIds.length || !isImageKitConfigured()) return;
  const client = imageKitClient();
  await Promise.allSettled(fileIds.filter(Boolean).map((fileId) => client.files.delete(fileId)));
}

export function createProductImageUploadAuthorizations(count: number) {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  if (!publicKey || !isImageKitConfigured()) {
    throw new Error("El almacenamiento de imágenes aún no está configurado.");
  }
  const client = imageKitClient();
  const uploads: ProductImageUploadAuthorization[] = Array.from({ length: count }, () =>
    client.helper.getAuthenticationParameters()
  );
  return { publicKey, folder: productImageFolder, uploads };
}

function safeReference(reference: UploadedProductImageReference) {
  return (
    typeof reference.originalName === "string" &&
    reference.originalName.length > 0 &&
    reference.originalName.length <= 255 &&
    typeof reference.fileId === "string" &&
    /^[A-Za-z0-9_-]{10,128}$/.test(reference.fileId) &&
    typeof reference.url === "string" &&
    reference.url.length <= 2048 &&
    isAllowedStoredImageUrl(reference.url)
  );
}

export async function verifyProductImageAssets(references: UploadedProductImageReference[]) {
  if (references.length > maximumCatalogMatrixImages || references.some((reference) => !safeReference(reference))) {
    throw new Error("Las referencias de imágenes no son válidas.");
  }

  const client = imageKitClient();
  const verified: UploadedProductImageReference[] = [];
  for (let index = 0; index < references.length; index += 4) {
    const batch = references.slice(index, index + 4);
    const assets = await Promise.all(
      batch.map(async (reference) => ({ reference, asset: await client.files.get(reference.fileId) }))
    );
    for (const { reference, asset } of assets) {
      const valid =
        asset.fileId === reference.fileId &&
        asset.url === reference.url &&
        asset.fileType === "image" &&
        Boolean(asset.mime && allowedImageTypes.has(asset.mime)) &&
        Boolean(asset.size && asset.size > 0 && asset.size <= maxImageSize) &&
        Boolean(asset.filePath?.startsWith(`${productImageFolder}/`));
      if (!valid) {
        throw new Error(`Una de las imágenes subidas no es válida. fileId: ${asset.fileId === reference.fileId}, url: ${asset.url === reference.url}, fileType: ${asset.fileType}, mime: ${asset.mime}, size: ${asset.size}, filePath: ${asset.filePath}`);
      }
      verified.push(reference);
    }
  }
  return verified;
}
