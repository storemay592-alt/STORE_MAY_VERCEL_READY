export function calculateDiscount(
  originalPrice: number | null,
  salePrice: number
): number | null {
  if (!originalPrice || originalPrice <= salePrice) return null;

  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("es-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2
  }).format(value);
}
