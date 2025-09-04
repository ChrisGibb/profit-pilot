




// Base types
export type Currency = "EUR";
export type ActiveBand = "P" | "R" | "O";

export type ChangeMetric =
  | 'budget'
  | 'sessions'
  | 'costPerSession'
  | 'CR'
  | 'transactions'
  | 'AOV'
  | 'revenue'
  | 'grossMarginPct'
  | 'fixedOpex'
  | 'totalMarketingCost'
  | 'netProfit'
  | 'netMargin'
  | 'marketingContribution';


export type ScenarioScope = "global" | "opex" | `channel:${string}`;
export type ChangeMode = "relative" | "absolute";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currency: Currency;
  period: {
    startDate: string; // ISO YYYY-MM-DD
    endDate: string;   // ISO YYYY-MM-DD
  };
  settings: ProjectSettings;
  baseInput: BaseInput;
}

export interface ProjectSettings {
    revenueIncludesVat: boolean;
    vatRate: number; // 0..1
}

export interface BaseInput {
  business: {
    totalBudget: number;
    sessionsTotal: number;
    transactionsTotal: number;
    revenueGross: number;
    grossMarginPct: number; // 0..1
    fixedOpex: number;
  };
  channels: ChannelData[];
  deletedChannels: ChannelData[];
}

export interface ChannelData {
  id: string;
  name: string;
  budget: number;
  sessions: number;
  transactions: number;
  revenue: number;
}

export interface Scenario {
  id: string;
  projectId: string;
  name:string;
  description: string;
  active: boolean;
  cost: {
    kind: 'budget' | 'opex';
    totalPeriod: number;
  };
  scope: ScenarioScope;
  activeBand: ActiveBand;
  changes: ScenarioChange[];
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioChange {
  metric: ChangeMetric;
  scope: ScenarioScope;
  mode: ChangeMode;
  values: {
    P: number;
    R: number;
    O: number;
  };
}

export type ChannelMechanics = {
  id: string;
  name: string;
  budget: number;
  costPerSession: number;
  CR: number;
  AOV: number;
  mode: 'budgetDriven' | 'fixedOutput';
  baseline?: { sessions: number; transactions: number; revenue: number };
};


// Helper types for UI and calculations
export interface CalculatedMetrics {
    channels: (ChannelData & {costPerSession: number; CR: number; AOV: number, mode: ChannelMechanics['mode'], baseline?: ChannelMechanics['baseline']})[];
    business: BaseInput['business'];
    // Core derived inputs
    costPerSession: number;
    revenueNet: number;
    crBlended: number; // Blended Conversion Rate
    aovGross: number; // Blended Average Order Value (Gross)
    aovNet: number; // Blended Average Order Value (Net)
    // Profit stack
    grossProfit: number;
    totalMarketingCost: number;
    marketingContribution: number;
    contributionMargin: number;
    netProfit: number;
    netMargin: number;
    romi: number | null;
    // Payback
    cacBlended: number | null;
    grossProfitPerOrder: number;
    paybackOrders: number | null;
}

export type TotalsEnvelope = {
  source: 'ga4' | 'derived' | 'override';
  sessionsTotal: number;
  transactionsTotal: number;
  revenueGross: number;
  totalBudget: number;
};

export type MathTrace = {
  totalsSource: TotalsEnvelope['source'];
  budget: number;
  cps: number;
  sessions: number;
  cr: number;
  transactions: number;
aovGross: number;
  revenueGross: number;
  vatEnabled: boolean;
  vatRate: number;
  revenueNet: number;
  grossMarginPct: number;
  grossProfit: number;
  opex: number;
  marketingContribution: number;
  netProfit: number;
};


// =================================================================================
// METRIC METADATA & PRESENTATION LOGIC
// =================================================================================

export const metricMeta: Record<ChangeMetric, { label: string; unit: 'percent' | 'currency' | 'integer'; upGood: boolean; }> = {
  CR:                   { label: 'Conversion Rate',       unit: 'percent',  upGood: true },
  AOV:                  { label: 'Average Order Value',   unit: 'currency', upGood: true },
  grossMarginPct:       { label: 'Gross Margin',          unit: 'percent',  upGood: true },
  revenue:              { label: 'Revenue',               unit: 'currency', upGood: true },
  sessions:             { label: 'Sessions',              unit: 'integer',  upGood: true },
  transactions:         { label: 'Transactions',          unit: 'integer',  upGood: true },
  budget:               { label: 'Marketing Spend',       unit: 'currency', upGood: false },
  totalMarketingCost:   { label: 'Marketing Spend',       unit: 'currency', upGood: false },
  costPerSession:       { label: 'Cost per Session',      unit: 'currency', upGood: false },
  fixedOpex:            { label: 'Fixed OPEX',            unit: 'currency', upGood: false },
  netProfit:            { label: 'Net Profit',            unit: 'currency', upGood: true },
  netMargin:            { label: 'Net Margin',            unit: 'percent',  upGood: true },
  marketingContribution:{ label: 'Marketing Contribution',unit: 'currency', upGood: true },
} as const;

export const changeMetricLabel: Record<ChangeMetric, string> = {
  budget: 'Marketing Spend',
  sessions: 'Sessions',
  transactions: 'Transactions',
  costPerSession: 'Cost per Session',
  CR: 'Conversion Rate',
  AOV: 'Average Order Value',
  revenue: 'Revenue',
  grossMarginPct: 'Gross Margin',
  fixedOpex: 'Fixed OPEX',
  totalMarketingCost: 'Marketing Spend',
  netProfit: 'Net Profit',
  netMargin: 'Net Margin',
  marketingContribution: 'Marketing Contribution',
};

export function formatDelta(metricId: ChangeMetric, value: number, mode: ChangeMode) {
  const m = metricMeta[metricId];
  if (!m) return { good: value > 0, suffix: '' };
  
  const sign = Math.sign(value);
  const good = (m.upGood && sign >= 0) || (!m.upGood && sign < 0);

  let suffix = '';

  if (m.unit === 'percent') {
      suffix = mode === 'absolute' ? 'pp' : '%';
  } else if (m.unit === 'integer') {
      suffix = mode === 'relative' ? '%' : '';
  } else if (m.unit === 'currency') {
       suffix = mode === 'relative' ? '%' : '';
  }


  return { good, suffix };
}


type ImpactableMetric = { id: ChangeMetric; label: string; description: string };

const globalMetrics: ImpactableMetric[] = [
    { id: 'costPerSession', label: 'Cost per Session', description: 'Cost to acquire one site session from paid media. Lower is better.' },
    { id: 'CR', label: 'Conversion Rate', description: 'The percentage of sessions that result in a transaction.' },
    { id: 'AOV', label: 'Average Order Value', description: 'The average amount customers spend per transaction.' },
    { id: 'grossMarginPct', label: 'Gross Margin (%)', description: 'The percentage of revenue left after ALL variable costs (COGS, etc.).' },
];

const opexMetrics: ImpactableMetric[] = [
    { id: 'fixedOpex', label: 'Fixed OPEX', description: 'Fixed operating costs like salaries and rent.' },
]

const channelMetrics: ImpactableMetric[] = [
    { id: 'sessions', label: 'Sessions', description: 'Traffic from this channel.' },
    { id: 'budget', label: 'Marketing Spend', description: 'The marketing spend for this specific channel.' },
    { id: 'transactions', label: 'Transactions', description: 'The number of transactions for this channel.' },
    { id: 'costPerSession', label: 'Cost per Session', description: 'The cost to acquire a session from this channel.' },
    { id: 'CR', label: 'Conversion Rate', description: 'The conversion rate for this channel.' },
    { id: 'AOV', label: 'Average Order Value', description: 'The AOV for this channel.' },
];

export const impactableMetricsByScope: Record<ScenarioScope, ImpactableMetric[]> = {
    'global': globalMetrics,
    'opex': opexMetrics,
    'channel:meta': channelMetrics,
    'channel:google': channelMetrics,
    'channel:tiktok': channelMetrics,
    'channel:seo': channelMetrics,
    'channel:automation': channelMetrics,
    'channel:other': channelMetrics,
};

export const isMetricPositive = (metricId: ChangeMetric, delta: number): boolean => {
    const meta = metricMeta[metricId];
    if (!meta) return delta > 0; // Default to higher is better
    return meta.upGood ? delta >= 0 : delta < 0;
};
  
export const labelToMetricMap: Record<string, ChangeMetric> = {
    'Fixed OPEX': 'fixedOpex',
    'Cost per Session': 'costPerSession',
    'Marketing Spend': 'budget',
    'Revenue (Net)': 'revenue',
    'Marketing Contribution': 'marketingContribution',
    'Net Profit': 'netProfit',
    'Conversion Rate (pp)': 'CR',
    'AOV (Net)': 'AOV',
    'Gross Margin (pp)': 'grossMarginPct'
};
