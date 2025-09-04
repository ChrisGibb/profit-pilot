
/**
 * @file formatting.ts
 * Contains utility functions for formatting numbers, currency, and percentages
 * for display in the UI. All rounding for presentation should happen here.
 */

/**
 * Formats a number as EUR currency.
 * @param value The number to format.
 * @param withSymbol Whether to include the "€" symbol.
 * @returns A formatted string.
 */
export function formatCurrencyEUR(value: number, withSymbol: boolean = true): string {
  if (value === null || value === undefined || !isFinite(value)) return withSymbol ? '—' : '—';
  
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Formats a number as a percentage with two decimal places.
 * @param value The number to format (e.g., 0.23 for 23%).
 * @returns A formatted percentage string.
 */
export function formatPercent(value: number): string {
  if (value === null || value === undefined || !isFinite(value)) return 'N/A';
  
  return new Intl.NumberFormat('de-DE', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a number as an integer.
 * @param value The number to format.
 * @returns A formatted integer string.
 */
export function formatInteger(value: number): string {
  if (value === null || value === undefined || !isFinite(value)) return 'N/A';

  return new Intl.NumberFormat('de-DE', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}
