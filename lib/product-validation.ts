import { z } from "zod";
import { productCategories } from "@/lib/product-model";

const productSchema = z
  .object({
    nombre: z.string().trim().min(2, "Escribe el nombre del producto.").max(140),
    categoria: z.enum(productCategories, { message: "Elige una categoría." }),
    precioOriginal: z.number().positive("El precio original debe ser mayor que cero.").nullable(),
    precioVenta: z.number().positive("Escribe un precio de venta válido."),
    tallas: z.array(z.string().trim().min(1)).min(1, "Selecciona al menos una talla."),
    stock: z.number().int("El stock debe ser un número entero.").min(0, "El stock no puede ser negativo.")
  })
  .refine(
    (value) => value.precioOriginal === null || value.precioOriginal > value.precioVenta,
    {
      message: "El precio original debe ser mayor que el precio de venta.",
      path: ["precioOriginal"]
    }
  );

function toNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return Number.NaN;
  return Number(value.replace(",", "."));
}

export function validateProductForm(formData: FormData) {
  const originalRaw = formData.get("precio_original");
  const original =
    typeof originalRaw === "string" && originalRaw.trim() !== ""
      ? toNumber(originalRaw)
      : null;

  return productSchema.safeParse({
    nombre: formData.get("nombre"),
    categoria: formData.get("categoria"),
    precioOriginal: original,
    precioVenta: toNumber(formData.get("precio_venta")),
    tallas: formData.getAll("tallas").map(String),
    stock: toNumber(formData.get("stock"))
  });
}
