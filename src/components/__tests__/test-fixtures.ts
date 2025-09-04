
import type { CalculatedMetrics, Scenario } from '@/lib/types';

export const mockCalculatedMetrics: CalculatedMetrics = {
  channels: [],
  business: {
    totalBudget: 53000,
    sessionsTotal: 1571548,
    transactionsTotal: 50512,
    revenueGross: 1812916,
    grossMarginPct: 0.6,
    fixedOpex: 120000,
  },
  costPerSession: 0.03,
  revenueNet: 1473915.45,
  crBlended: 0.032,
  aovGross: 35.9,
  aovNet: 29.18,
  grossProfit: 884349.27,
  totalMarketingCost: 53000,
  marketingContribution: 831349.27,
  contributionMargin: 0.56,
  netProfit: 711349.27,
  netMargin: 0.48,
  romi: 15.68,
  cacBlended: 1.05,
  grossProfitPerOrder: 17.5,
  paybackOrders: 0.06,
};

export const mockScenario: Scenario = {
  id: 'scen_1',
  projectId: 'proj_1',
  name: 'Test Scenario',
  description: 'A test scenario',
  active: true,
  cost: {
    kind: 'opex',
    totalPeriod: 5000,
  },
  scope: 'global',
  activeBand: 'R',
  changes: [
    {
      metric: 'costPerSession',
      scope: 'global',
      mode: 'relative',
      values: { P: -5, R: -10, O: -15 },
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
