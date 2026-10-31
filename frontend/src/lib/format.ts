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

/** Formats a date string or timestamp including hours, minutes, and seconds. */
export function formatDateTimeWithSeconds(
  val: string | Date | null | undefined
): string {
  if (!val) return "—";
  const d = val instanceof Date ? val : new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** Formats an exact timestamp in YYYY-MM-DD HH:mm:ss local format. */
export function formatExactTimestamp(
  val: string | Date | null | undefined
): string {
  if (!val) return "—";
  const d = val instanceof Date ? val : new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/** Formats exact time only with seconds (e.g. 10:25:46 PM). */
export function formatExactTime(
  val: string | Date | null | undefined
): string {
  if (!val) return "—";
  const d = val instanceof Date ? val : new Date(val);
  if (Number.isNaN(d.getTime())) return String(val);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/** Removes the leading "1. " numbering used by pipeline stage values. */
export function cleanStage(stage: string): string {
  return stage.replace(/^\d+\.\s*/, "");
}

