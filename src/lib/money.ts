const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Format integer minor units (paise) as Indian Rupees, e.g. 129900 → "₹1,299". */
export function formatINR(minorUnits: number): string {
  return inr.format(minorUnits / 100)
}
