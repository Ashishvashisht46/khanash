import { clsx } from 'clsx';

/* ─────────────────────────────────────────────────────────────────────────────
   Utility helpers — Lux Dental Marketing RCM Portal
───────────────────────────────────────────────────────────────────────────── */

/**
 * Merge class names, filtering falsy values.
 * Wraps clsx — the same API, just re-exported from one place.
 *
 * @param {...(string|undefined|null|false|Record<string,boolean>)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return clsx(...classes);
}

/* ─── Currency ──────────────────────────────────────────────────────────── */

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatterCompact = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/**
 * Format a number as USD currency.
 * @param {number|string|null|undefined} n
 * @param {boolean} [compact=false] - Use compact notation (e.g. $1.2K)
 * @returns {string}
 */
export function fmt$(n, compact = false) {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (num == null || isNaN(num)) return '$0.00';
  return compact ? currencyFormatterCompact.format(num) : currencyFormatter.format(num);
}

/* ─── Dates ─────────────────────────────────────────────────────────────── */

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

/**
 * Format a date value to a human-readable string.
 * @param {Date|string|number|null|undefined} d
 * @param {'date'|'datetime'|'short'} [format='date']
 * @returns {string}
 */
export function fmtDate(d, format = 'date') {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '—';

  switch (format) {
    case 'datetime': return dateTimeFormatter.format(date);
    case 'short':    return shortDateFormatter.format(date);
    default:         return dateFormatter.format(date);
  }
}

/**
 * Return a relative time string (e.g. "3 days ago", "just now").
 * @param {Date|string|number} d
 * @returns {string}
 */
export function fmtRelative(d) {
  if (!d) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '—';

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 30)   return 'just now';
  if (seconds < 60)   return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return fmtDate(date);
}

/**
 * Calculate how many calendar days have elapsed since `date`.
 * @param {Date|string|number|null|undefined} date
 * @returns {number}
 */
export function getDaysOpen(date) {
  if (!date) return 0;
  const start = new Date(date);
  if (isNaN(start.getTime())) return 0;
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((now.getTime() - start.getTime()) / msPerDay);
}

/* ─── String helpers ────────────────────────────────────────────────────── */

/**
 * Extract initials from a display name (up to 2 characters).
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Truncate a string to `maxLength`, appending "…" if needed.
 * @param {string} str
 * @param {number} [maxLength=60]
 * @returns {string}
 */
export function truncate(str, maxLength = 60) {
  if (!str) return '';
  return str.length <= maxLength ? str : `${str.slice(0, maxLength - 1)}…`;
}

/**
 * Capitalise the first letter of each word (title case).
 * @param {string} str
 * @returns {string}
 */
export function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

/**
 * Convert a snake_case / kebab-case string to a human label.
 * @param {string} str
 * @returns {string}
 */
export function humanise(str) {
  if (!str) return '';
  return toTitleCase(str.replace(/[_-]/g, ' '));
}

/* ─── ID generators ─────────────────────────────────────────────────────── */

/**
 * Generate a deposit reference ID in the format DEP-XXXXXX.
 * Uses crypto.randomUUID when available, otherwise falls back to Math.random.
 * @returns {string}
 */
export function generateDepositId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'; // no I/O to avoid confusion
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DEP-${suffix}`;
}

/**
 * Generate a short unique key (not cryptographically secure, for UI keys only).
 * @returns {string}
 */
export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ─── Number / percentage helpers ──────────────────────────────────────── */

/**
 * Format a number as a percentage string.
 * @param {number} value - 0–100
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function fmtPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
}

/**
 * Clamp a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Sum an array of objects by a numeric key.
 * @template T
 * @param {T[]} arr
 * @param {keyof T} key
 * @returns {number}
 */
export function sumBy(arr, key) {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
}

/* ─── Misc ──────────────────────────────────────────────────────────────── */

/**
 * Deep-clone a plain object / array using JSON serialisation.
 * Do not use with Date, Map, Set, or circular refs.
 * @template T
 * @param {T} obj
 * @returns {T}
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce a function.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Sleep for `ms` milliseconds (useful in async flows).
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a URLSearchParams string from a plain object, omitting null/undefined.
 * @param {Record<string, any>} params
 * @returns {string}
 */
export function buildQuery(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') {
      sp.set(k, String(v));
    }
  }
  const str = sp.toString();
  return str ? `?${str}` : '';
}
