
import { metricMeta } from "@/lib/types";

export type NumberStyle = 'currency' | 'percent' | 'integer';
export type PercentKind = 'relative' | 'pp';

export function roundAwayFromZero(n: number) {
  return n >= 0 ? Math.round(n) : -Math.round(-n);
}

/** Currency & integers never show decimals. Percent/pp show 2 decimals. */
export function formatCurrencyEUR(
  value: number | null | undefined,
  withSymbol: boolean = true,
  opts?: { minDecimals?: number; maxDecimals?: number }
) {
  if (value === null || value === undefined || !isFinite(value)) return withSymbol ? '—' : '—';
  const { minDecimals = 0, maxDecimals = minDecimals } = opts ?? {};
  const nf = new Intl.NumberFormat('de-DE', {
    style: withSymbol ? 'currency' : 'decimal',
    currency: 'EUR',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });
  const body = nf.format(value);
  return body;
}

export const formatCurrencySmart = (v: number | null, withSymbol: boolean = true) => {
  if (v === null || v === undefined || !isFinite(v)) return 'N/A';
  const abs = Math.abs(v);
  // <= 0.10: 3 decimals, <= 0.005: 4 decimals, else 2/0
  if (abs <= 0.005) return formatCurrencyEUR(v, withSymbol, { minDecimals: 4, maxDecimals: 4 });
  if (abs <= 0.10)  return formatCurrencyEUR(v, withSymbol, { minDecimals: 3, maxDecimals: 3 });
  if (abs < 100)    return formatCurrencyEUR(v, withSymbol, { minDecimals: 2, maxDecimals: 2 });
  return formatCurrencyEUR(v, withSymbol, { minDecimals: 0, maxDecimals: 0 });
};

export function formatInteger(n: number | null) {
  if (n == null || !isFinite(n)) return 'N/A';
  return new Intl.NumberFormat('de-DE', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundAwayFromZero(n));
}

export function formatPercent(v: number | null) {
  if (v == null || !isFinite(v)) return 'N/A';
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

export function formatPP(v: number | null) {
  if (v == null || !isFinite(v)) return 'N/A';
  const pct = new Intl.NumberFormat('de-DE', {
    style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(v).replace(/\s*%/g, '');
  return `${pct}pp`;
}


/** Suffix for ScenarioImpactChip based on metric+mode */
export function suffixFor(metricId: keyof typeof metricMeta, mode: 'relative'|'absolute') {
  const unit = metricMeta[metricId].unit;
  if (unit === 'percent') return mode === 'absolute' ? 'pp' : '%';
  if (unit === 'integer') return mode === 'relative' ? '%' : '';
  if (unit === 'currency') return mode === 'relative' ? '%' : '';
  return '';
}
