/**
 * Shared formatting helpers for currency, dates, names, and status labels.
 */

/** Parses a numeric string and formats it with `formatCurrencyAmount`, or returns the raw string if not numeric. */
export function formatMoney(amount: string, currencyCode: string): string {
  const trimmed = amount?.trim() ?? '';
  if (!trimmed) {
    return formatCurrencyAmount(0, currencyCode);
  }
  const n = Number(trimmed.replace(/[^0-9.-]/g, ''));
  if (!Number.isNaN(n)) {
    return formatCurrencyAmount(n, currencyCode);
  }
  return trimmed;
}

/** Formats a number as currency (ISO 4217 code). Falls back to `<amount> <code>` for non-standard codes (e.g. crypto). */
export function formatCurrencyAmount(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`;
  }
}

/**
 * Formats an ISO-like datetime for display. Empty input → "Date unavailable";
 * unparseable input → returns the trimmed original string.
 */
export function formatDisplayDate(iso: string): string {
  const raw = iso?.trim() ?? '';
  if (!raw) {
    return 'Date unavailable';
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return raw;
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(d);
}

/** Up to two initials from the first words of a display name; empty → "--". */
export function initialsFromName(name: string): string {
  const parts = name
    .split(/\s+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) {
    return '--';
  }
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

/** Title-cases words split by whitespace, underscore, or hyphen. */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Maps a human-readable status label to a CSS class suffix (`succeeded` | `pending` | `failed`).
 * Used with transaction / payment status pills in the merchant UI.
 */
export function statusClassForLabel(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('success') || s.includes('complete')) {
    return 'succeeded';
  }
  if (s.includes('pending') || s.includes('process')) {
    return 'pending';
  }
  if (s.includes('fail') || s.includes('declin') || s.includes('error')) {
    return 'failed';
  }
  return 'pending';
}
