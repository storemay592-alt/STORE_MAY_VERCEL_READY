import { z } from "zod";
import { productCategories, productGenders, productStatuses } from "@/lib/product-options";

const dashboardProductSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del producto.").max(160),
  description: z.string().trim().max(2000),
  brand: z.string().trim().min(1, "Escribe la marca.").max(100),
  category: z.enum(productCategories, { message: "Elige una categoría válida." }),
  type: z.string().trim().min(1, "Escribe el tipo de producto.").max(80),
  color: z.string().trim().min(1, "Escribe el color.").max(80),
  gender: z.enum(productGenders, { message: "Elige un género válido." }),
  price: z.number().finite().min(0, "Escribe un precio válido.").max(99999999.99, "El precio es demasiado alto."),
  sizesAvailable: z.string().trim().min(1, "Indica las tallas o escribe Consultar.").max(240),
  status: z.enum(productStatuses, { message: "Elige un estado." })
});

function numberFromForm(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return Number.NaN;
  return Number(value.replace(",", "."));
}

export function validateDashboardProduct(formData: FormData) {
  return dashboardProductSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    brand: formData.get("brand"),
    category: formData.get("category"),
    type: formData.get("type"),
    color: formData.get("color"),
    gender: formData.get("gender"),
    price: numberFromForm(formData.get("price")),
    sizesAvailable: formData.get("sizes_available"),
    status: formData.get("status")
  });
}
