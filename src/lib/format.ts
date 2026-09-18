/**
 * Human-friendly formatters for Indian Rupee currency, dates, and portions.
 */

export function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(num);
}

export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

export function formatDateOnly(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatTimeOnly(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Converts a normalized decimal stock number (e.g. 10.25) into human-friendly string:
 * e.g. 10.25 -> "10 Plates + 1/4 Plate" or "10 ¼ Plates"
 * e.g. 10.50 -> "10 Plates + 1/2 Plate" or "10 ½ Plates"
 * e.g. 0.75  -> "1/2 Plate + 1/4 Plate"
 */
export function formatHumanStock(quantity: number, unitName: string = "Plates"): string {
  if (quantity === 0) return `0 ${unitName}`;

  const whole = Math.floor(quantity);
  const remainder = Math.round((quantity - whole) * 100) / 100;

  let fractionText = "";
  if (remainder === 0.25) {
    fractionText = "¼";
  } else if (remainder === 0.5) {
    fractionText = "½";
  } else if (remainder === 0.75) {
    fractionText = "¾";
  } else if (remainder > 0) {
    // Other decimal fallback
    fractionText = `.${Math.round(remainder * 100)}`;
  }

  if (whole > 0 && fractionText) {
    return `${whole} ${fractionText} ${unitName}`;
  } else if (whole > 0) {
    return `${whole} ${unitName}`;
  } else if (fractionText) {
    return `${fractionText} ${unitName}`;
  }
  return `0 ${unitName}`;
}
