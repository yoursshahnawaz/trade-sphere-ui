/** The price a buyer actually pays: the sale price when it's a valid discount, else list price. */
export function effectivePriceCents(p: { priceCents: number; salePriceCents?: number }): number {
  return p.salePriceCents != null && p.salePriceCents < p.priceCents ? p.salePriceCents : p.priceCents
}
