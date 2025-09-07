
/**
 * @file profit-engine.ts
 * Single source of truth for all business logic and financial calculations
 * for the ProfitPilot wizard. This module is designed to be environment-agnostic
 * and can be imported by both client-side components and server-side functions.
 *
 * It contains no external dependencies and performs no rounding; formatting is
 * left to the presentation layer.
 */

// ==================================
// INTERFACES
// ==================================

export interface EngineSettings {
  revenueIncludesVat: boolean;
  vatRate: number; // 0.23 for 23%
  currency: string;
}

export interface BaseInputs {
  revenueGrossLTM: number;
  sessionsLTM: number;
  grossMarginPct: number;
  fixedOpexLTM: number;
  marketingBudgetLTM?: number; // Optional, used in specific scenarios
  conversionRate?: number; // Optional, can be derived
}

export interface CalculatedMetrics {
  // Base derived
  transactionsLTM: number;
  aovGross: number;
  conversionRate: number;
  // Net revenue
  revenueNet: number;
  aovNet: number;
  // Profit stack
  grossProfit: number;
  marketingContribution: number;
  netProfit: number;
  // Efficiency
  costPerSession?: number;
  romi?: number; // Return on Marketing Investment
  cac?: number; // Customer Acquisition Cost
}

export interface CalculationTrace {
  timestamp: string;
  inputs: BaseInputs;
  settings: EngineSettings;
  results: CalculatedMetrics;
  notes: string[];
}

// ==================================
// CORE ENGINE
// ==================================

const MIN_CPS = 0.01; // Prevent division by zero

/**
 * Calculates all derived metrics from a set of base inputs and settings.
 * This is the primary pure function for the business model.
 *
 * @param inputs - The user-provided base metrics.
 * @param settings - Configuration for VAT and currency.
 * @returns An object containing all calculated metrics and a trace.
 */
export function calculate(inputs: BaseInputs, settings: EngineSettings): { results: CalculatedMetrics, trace: CalculationTrace } {
  const notes: string[] = [];
  const { revenueIncludesVat, vatRate } = settings;

  // Clamp inputs to prevent nonsensical calculations
  const revenueGrossLTM = Math.max(0, inputs.revenueGrossLTM);
  const sessionsLTM = Math.max(0, inputs.sessionsLTM);
  const grossMarginPct = Math.max(0, Math.min(1, inputs.grossMarginPct));
  const fixedOpexLTM = Math.max(0, inputs.fixedOpexLTM);
  const marketingBudgetLTM = inputs.marketingBudgetLTM ? Math.max(0, inputs.marketingBudgetLTM) : undefined;


  // Base derived metrics (assuming transactions are unknown and must be derived)
  // NOTE: This is a simplification. A real model might ask for transactions.
  // We derive CR from an assumed AOV, which is a weak point but necessary for this simple wizard.
  // A better wizard might ask for AOV or Transactions directly.
  const conversionRate = inputs.conversionRate ?? 0.02; // Use input CR or default
  if (!inputs.conversionRate) {
    notes.push(`Assumed a default Conversion Rate of ${(conversionRate * 100).toFixed(1)}% as it was not provided.`);
  }
  const transactionsLTM = sessionsLTM * conversionRate;
  const aovGross = transactionsLTM > 0 ? revenueGrossLTM / transactionsLTM : 0;
  
  // Revenue Net of VAT
  const revenueNet = revenueIncludesVat ? revenueGrossLTM / (1 + vatRate) : revenueGrossLTM;
  const aovNet = transactionsLTM > 0 ? revenueNet / transactionsLTM : 0;

  // Profit Stack
  const grossProfit = revenueNet * grossMarginPct;
  const marketingContribution = marketingBudgetLTM !== undefined ? grossProfit - marketingBudgetLTM : grossProfit;
  const netProfit = marketingContribution - fixedOpexLTM;

  // Efficiency Metrics (only if marketing budget is known)
  let costPerSession: number | undefined;
  let romi: number | undefined;
  let cac: number | undefined;

  if (marketingBudgetLTM !== undefined) {
    costPerSession = sessionsLTM > 0 ? marketingBudgetLTM / sessionsLTM : 0;
    if (costPerSession < MIN_CPS) {
        notes.push(`CPS was calculated below minimum threshold and adjusted to ${MIN_CPS}.`);
        costPerSession = MIN_CPS;
    }
    romi = marketingBudgetLTM > 0 ? (marketingContribution / marketingBudgetLTM) : undefined;
    cac = transactionsLTM > 0 ? marketingBudgetLTM / transactionsLTM : undefined;
  }

  const results: CalculatedMetrics = {
    transactionsLTM,
    aovGross,
    conversionRate,
    revenueNet,
    aovNet,
    grossProfit,
    marketingContribution,
    netProfit,
    costPerSession,
    romi,
    cac,
  };

  const trace: CalculationTrace = {
    timestamp: new Date().toISOString(),
    inputs,
    settings,
    results,
    notes,
  };

  return { results, trace };
}

// TODO: Add functions for applying "what-if" scenarios, which would take
// baseline results and a scenario definition as input and return the new results.
