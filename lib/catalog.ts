import catalogData from "@/data/catalogo.json";

export type CategoryId = "hombres" | "mujeres" | "ninos" | "accesorios";

export type Product = {
  id: string;
  slug: string;
  nombre: string;
  categoria: CategoryId;
  subcategoria: string;
  marca: string;
  imagen: string;
  imagenModelo?: string;
  galeria?: string[];
  fuenteOficial?: string;
  alt: string;
  descripcion: string;
  color: string;
  genero: string;
  precioOriginal?: number | null;
  precio: number | null;
  precioNota: string;
  tallas: string[];
  tallasNota: string;
  disponible: boolean;
};

export type Category = {
  id: CategoryId;
  label: string;
  number: string;
  image: string;
  alt: string;
  imagePosition: string;
  mark: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

export const products = catalogData as Product[];

export const categories: Category[] = [
  {
    id: "mujeres",
    label: "Mujeres",
    number: "01",
    image: "/catalog/mujeres/handbag-white.webp",
    alt: "Bolso mujer blanco Store MAY",
    imagePosition: "center center",
    mark: "/brand/mark-a.webp",
    description:
      "Bolsos y accesorios contemporáneos seleccionados por su equilibrio entre función, presencia y detalle.",
    seoTitle: "Ropa, calzado y accesorios para mujer 100% originales",
    seoDescription:
      "Descubre la selección para mujeres de Store MAY: bolsos, calzado y accesorios de marcas internacionales 100% originales."
  },
  {
    id: "hombres",
    label: "Hombres",
    number: "02",
    image: "/catalog/hombres/crossbody-black.webp",
    alt: "Bolso crossbody hombre negro Store MAY",
    imagePosition: "center 42%",
    mark: "/brand/mark-m.webp",
    description:
      "Calzado, bolsos y esenciales de líneas limpias para construir un guardarropa versátil y auténtico.",
    seoTitle: "Ropa, calzado y accesorios para hombre 100% originales",
    seoDescription:
      "Explora productos para hombres en Store MAY: calzado, bolsos y accesorios de marcas internacionales 100% originales."
  },
  {
    id: "ninos",
    label: "Niños",
    number: "03",
    image: "/catalog/ninos/puma-roma.webp",
    alt: "Zapatillas niños negras Store MAY",
    imagePosition: "59% center",
    mark: "/brand/mark-y.webp",
    description:
      "Diseños cómodos y resistentes para acompañar cada etapa con libertad de movimiento y estilo propio.",
    seoTitle: "Ropa y calzado para niños 100% originales",
    seoDescription:
      "Encuentra calzado, ropa y accesorios para niños en Store MAY, con productos de marcas internacionales 100% originales."
  },
  {
    id: "accesorios",
    label: "Accesorios",
    number: "04",
    image: "/catalog/accesorios/cap-black.webp",
    alt: "Gorra unisex negra Store MAY",
    imagePosition: "54% center",
    mark: "/brand/mark-m.webp",
    description:
      "Gorras, bolsos y detalles que completan el look con funcionalidad, diseño y carácter contemporáneo.",
    seoTitle: "Accesorios de marcas internacionales 100% originales",
    seoDescription:
      "Compra accesorios originales en Store MAY: gorras, bolsos y piezas seleccionadas de marcas internacionales reconocidas."
  }
];

export const categoryIds = categories.map((category) => category.id);

export function isCategoryId(value: string): value is CategoryId {
  return categoryIds.includes(value as CategoryId);
}

export function getCategory(id: string) {
  return categories.find((category) => category.id === id);
}

export function getProductsByCategory(category: CategoryId) {
  return products.filter((product) => product.categoria === category);
}

export function getProductByPath(category: string, subcategory: string, slug: string) {
  return products.find(
    (product) =>
      product.categoria === category &&
      product.subcategoria === subcategory &&
      product.slug === slug
  );
}

export function productPath(product: Product) {
  return `/${product.categoria}/${product.subcategoria}/${product.slug}`;
}

export function productPrice(product: Product) {
  if (product.precio === null) return product.precioNota;

  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD"
  }).format(product.precio);
}

export function productSizes(product: Product) {
  return product.tallas.length > 0 ? product.tallas.join(", ") : product.tallasNota;
}
