export function formatCurrency(
  val: string | number | undefined | null,
  currency = "USD"
): string {
  const num = Number(val || 0);
  if (Number.isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

/** Short money format for big numbers, e.g. $14.1M, $139K */
export function formatCompactCurrency(val: string | number | undefined | null): string {
  const num = Number(val || 0);
  if (Number.isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

export function formatDate(val: string | null | undefined): string {
  if (!val) return "—";
  const d = new Date(val.length === 10 ? `${val}T00:00:00` : val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Removes the leading "1. " numbering used by pipeline stage values. */
export function cleanStage(stage: string): string {
  return stage.replace(/^\d+\.\s*/, "");
}

