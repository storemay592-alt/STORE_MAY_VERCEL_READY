export const productCategories = ["Mujer", "Hombre", "Niños", "Accesorios"] as const;
export const productGenders = ["Mujer", "Hombre", "Niños", "Unisex"] as const;
export const productStatuses = ["disponible", "agotado", "bajo_confirmacion"] as const;

export const productStatusOptions = [
  { value: "disponible", label: "Disponible" },
  { value: "bajo_confirmacion", label: "Confirmar disponibilidad" },
  { value: "agotado", label: "Agotado" }
] as const;

export type ProductCategory = (typeof productCategories)[number];
export type ProductGender = (typeof productGenders)[number];
export type ProductStatus = (typeof productStatuses)[number];

