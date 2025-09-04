
import { formatCurrencyEUR, formatInteger, formatPercent, formatPP, roundAwayFromZero } from '../formatters';

describe('formatters', () => {
  describe('roundAwayFromZero', () => {
    it('rounds positive numbers up', () => {
      expect(roundAwayFromZero(5.5)).toBe(6);
      expect(roundAwayFromZero(5.4)).toBe(5);
    });
    it('rounds negative numbers down (away from zero)', () => {
      expect(roundAwayFromZero(-5.5)).toBe(-6);
      expect(roundAwayFromZero(-5.4)).toBe(-5);
    });
  });

  describe('formatCurrencyEUR', () => {
    it('formats numbers with € symbol and no decimals', () => {
      expect(formatCurrencyEUR(12345.67)).toBe('12.346 €');
      expect(formatCurrencyEUR(-500)).toBe('-500 €');
    });
     it('formats numbers without symbol and no decimals', () => {
      expect(formatCurrencyEUR(12345.67, false)).toBe('12.346');
    });
  });

  describe('formatInteger', () => {
    it('formats numbers as integers with no decimals', () => {
      expect(formatInteger(12345.67)).toBe('12.346');
      expect(formatInteger(-500)).toBe('-500');
    });
  });

  describe('formatPercent', () => {
    it('formats numbers as percentages with two decimal places', () => {
      expect(formatPercent(0.12345)).toBe('12,35 %');
      expect(formatPercent(0.75)).toBe('75,00 %');
    });
  });
  
  describe('formatPP', () => {
    it('formats numbers as percentage points with two decimal places', () => {
      expect(formatPP(0.02345)).toBe('2,35pp');
      expect(formatPP(-0.05)).toBe('-5,00pp');
    });
  });
});
