export const productCategories = ["Hombre", "Mujer", "Niños", "Accesorios"] as const;
export type ProductCategory = (typeof productCategories)[number];

export type StoreProduct = {
  id: string;
  nombre: string;
  categoria: ProductCategory;
  imagenUrl: string;
  precioOriginal: number | null;
  precioVenta: number;
  tallas: string[];
  stock: number;
  fechaCreacion: Date;
};

export type ProductInput = Omit<StoreProduct, "id" | "fechaCreacion">;
