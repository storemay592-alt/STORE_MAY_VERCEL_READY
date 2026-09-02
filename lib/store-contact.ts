export const storeWhatsappNumber = "593981944339";

export function storeWhatsappHref(message: string) {
  return `https://wa.me/${storeWhatsappNumber}?text=${encodeURIComponent(message)}`;
}

