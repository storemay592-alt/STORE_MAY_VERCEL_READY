"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { DashboardActionState, DashboardLoginState } from "@/lib/dashboard-state";
import { verifyAdminUser } from "@/lib/auth/admin-users";
import { requireAdminAction } from "@/lib/auth/dal";
import { createAdminSession, deleteAdminSession, readAdminSession } from "@/lib/auth/session";
import {
  createCatalogProduct,
  deleteCatalogProduct,
  getCatalogProductById,
  updateCatalogProduct
} from "@/lib/catalog-products";
import { validateDashboardProduct } from "@/lib/dashboard-product-validation";
import { isAllowedStoredImageUrl, verifyProductImageAssets } from "@/lib/imagekit";
import type { UploadedProductImageReference } from "@/lib/catalog-import-contract";
import { recordAdminSecurityEvent } from "@/lib/security/admin-audit";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedActionOrigin, getRequestIdentity } from "@/lib/security/request";
import { storeWhatsappNumber } from "@/lib/store-contact";

export async function dashboardLoginAction(
  _: DashboardLoginState,
  formData: FormData
): Promise<DashboardLoginState> {
  const parsed = z
    .object({
      username: z.string().trim().min(3).max(254),
      password: z.string().min(1).max(256)
    })
    .safeParse({ username: formData.get("username"), password: formData.get("password") });

  if (!parsed.success) return { status: "error", message: "Completa el usuario y la contraseña." };

  try {
    await assertTrustedActionOrigin();
    const identity = await getRequestIdentity();
    const username = parsed.data.username.trim().toLocaleLowerCase();
    const [ipLimit, credentialLimit] = await Promise.all([
      consumeRateLimit({ scope: "admin-login-ip", identifier: identity.ip, limit: 20, windowSeconds: 900 }),
      consumeRateLimit({ scope: "admin-login-pair", identifier: `${identity.ip}:${username}`, limit: 6, windowSeconds: 900 })
    ]);

    if (!ipLimit.allowed || !credentialLimit.allowed) {
      await recordAdminSecurityEvent({ username, eventType: "login_limited", ipHash: identity.ipHash });
      return {
        status: "error",
        message: `Demasiados intentos. Espera ${Math.ceil(Math.max(ipLimit.retryAfter, credentialLimit.retryAfter) / 60)} minutos.`
      };
    }

    const admin = await verifyAdminUser(parsed.data.username, parsed.data.password);
    if (!admin) {
      await recordAdminSecurityEvent({ username, eventType: "login_failure", ipHash: identity.ipHash });
      return { status: "error", message: "Usuario o contraseña incorrectos." };
    }
    await createAdminSession(admin);
    await recordAdminSecurityEvent({ username, eventType: "login_success", ipHash: identity.ipHash });
  } catch {
    return {
      status: "error",
      message: "No se pudo comprobar el acceso. Inténtalo nuevamente en un momento."
    };
  }

  redirect("/dashboard");
}

export async function dashboardLogoutAction() {
  await assertTrustedActionOrigin();
  const [session, identity] = await Promise.all([readAdminSession(), getRequestIdentity()]);
  if (session) {
    await recordAdminSecurityEvent({
      username: session.username,
      eventType: "logout",
      ipHash: identity.ipHash
    });
  }
  await deleteAdminSession();
  redirect("/dashboard/login");
}

function publicWhatsappNumber() {
  return storeWhatsappNumber;
}

function safeMessage(error: unknown) {
  if (!(error instanceof Error)) return "No se pudo guardar el producto.";
  const allowed = [
    "Las referencias de imágenes no son válidas.",
    "Una de las imágenes subidas no es válida.",
    "El almacenamiento de imágenes aún no está configurado.",
    "Tu sesión venció. Vuelve a iniciar sesión."
  ];
  return allowed.includes(error.message)
    ? error.message
    : "No se pudo guardar el producto. Revisa los datos e inténtalo otra vez.";
}

function validationErrors(result: ReturnType<typeof validateDashboardProduct>) {
  if (result.success) return undefined;
  return result.error.flatten().fieldErrors as Record<string, string[]>;
}

function uploadedImageReferences(formData: FormData) {
  try {
    const parsed = JSON.parse(String(formData.get("uploaded_image_references") ?? "[]"));
    return Array.isArray(parsed) ? (parsed as UploadedProductImageReference[]) : [];
  } catch {
    return [];
  }
}

function existingImages(formData: FormData) {
  return formData
    .getAll("existing_image_urls")
    .map(String)
    .filter(isAllowedStoredImageUrl);
}

function refreshCatalog() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/estadisticas");
  revalidatePath("/catalogo");
  revalidatePath("/tienda");
  revalidatePath("/sitemap.xml");
}

export async function createDashboardProductAction(
  _: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  try {
    await assertTrustedActionOrigin();
    await requireAdminAction();
    const parsed = validateDashboardProduct(formData);
    if (!parsed.success) {
      return { status: "error", message: "Revisa los campos señalados.", errors: validationErrors(parsed) };
    }

    const references = uploadedImageReferences(formData);
    if (!references.length) {
      return {
        status: "error",
        message: "Agrega al menos una imagen.",
        errors: { images: ["Agrega al menos una imagen del producto."] }
      };
    }
    if (references.length > 8) return { status: "error", message: "Puedes subir hasta 8 imágenes." };

    const imageUrls = (await verifyProductImageAssets(references)).map((image) => image.url);
    const product = await createCatalogProduct({
      ...parsed.data,
      imageUrls,
      whatsappNumber: publicWhatsappNumber()
    });
    refreshCatalog();
    return { status: "success", message: `${product.code} guardado correctamente ✅` };
  } catch (error) {
    return { status: "error", message: safeMessage(error) };
  }
}

export async function updateDashboardProductAction(
  id: string,
  _: DashboardActionState,
  formData: FormData
): Promise<DashboardActionState> {
  try {
    await assertTrustedActionOrigin();
    await requireAdminAction();
    if (!z.string().uuid().safeParse(id).success) return { status: "error", message: "Producto no válido." };

    const current = await getCatalogProductById(id);
    if (!current) return { status: "error", message: "El producto ya no existe." };
    const parsed = validateDashboardProduct(formData);
    if (!parsed.success) {
      return { status: "error", message: "Revisa los campos señalados.", errors: validationErrors(parsed) };
    }

    const references = uploadedImageReferences(formData);
    const keptImages = existingImages(formData);
    if (references.length > 8) return { status: "error", message: "Puedes subir hasta 8 imágenes." };
    const newImages = references.length
      ? (await verifyProductImageAssets(references)).map((image) => image.url)
      : [];
    const imageUrls = [...keptImages, ...newImages].slice(0, 8);
    if (!imageUrls.length) {
      return {
        status: "error",
        message: "El producto debe conservar al menos una imagen.",
        errors: { images: ["Conserva o agrega una imagen."] }
      };
    }

    await updateCatalogProduct(id, {
      ...parsed.data,
      article: current.article || parsed.data.type,
      model: current.model || parsed.data.name,
      imageUrls,
      whatsappNumber: current.whatsappNumber || publicWhatsappNumber()
    });
    refreshCatalog();
    return { status: "success", message: "Cambios guardados ✅" };
  } catch (error) {
    return { status: "error", message: safeMessage(error) };
  }
}

export async function deleteDashboardProductAction(id: string) {
  await assertTrustedActionOrigin();
  await requireAdminAction();
  if (!z.string().uuid().safeParse(id).success) return;
  await deleteCatalogProduct(id);
  refreshCatalog();
}

export async function setDashboardProductStatusAction(id: string, formData: FormData) {
  await assertTrustedActionOrigin();
  await requireAdminAction();
  if (!z.string().uuid().safeParse(id).success) return;
  const parsedStatus = z.enum(["disponible", "agotado"]).safeParse(formData.get("status"));
  if (!parsedStatus.success) return;

  const current = await getCatalogProductById(id);
  if (!current || current.status === parsedStatus.data) return;
  await updateCatalogProduct(id, {
    name: current.name,
    description: current.description,
    brand: current.brand,
    article: current.article,
    model: current.model,
    category: current.category,
    type: current.type,
    color: current.color,
    gender: current.gender,
    price: current.price,
    brandPrice: current.brandPrice,
    sizesAvailable: current.sizesAvailable,
    status: parsedStatus.data,
    imageUrls: current.imageUrls,
    whatsappNumber: current.whatsappNumber
  });
  refreshCatalog();
}
