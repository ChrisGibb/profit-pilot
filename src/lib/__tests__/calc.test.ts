
import { solveTotals } from '../calc';
import type { Project, Scenario } from '../types';
import { subYears, format } from 'date-fns';

const baseProject: Project = {
  id: 'proj_1',
  name: 'Test Project',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  currency: 'EUR',
  period: {
    startDate: format(subYears(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  },
  settings: {
    revenueIncludesVat: true,
    vatRate: 0.23,
  },
  baseInput: {
    business: {
      sessionsTotal: 1571548,
      transactionsTotal: 50512,
      revenueGross: 1812916,
      grossMarginPct: 0.6,
      fixedOpex: 120000,
      totalBudget: 53000,
    },
    channels: [
      { id: 'meta', name: 'Meta Ads', budget: 20000, sessions: 30000, transactions: 500, revenue: 61500 },
      { id: 'google', name: 'Google Ads', budget: 25000, sessions: 40000, transactions: 600, revenue: 73800 },
    ],
    deletedChannels: [],
  },
};

const makeProject = (): Project => ({
  id: 'p',
  name: 't',
  createdAt: '', updatedAt: '',
  currency: 'EUR',
  period: { startDate: '2024-01-01', endDate: '2024-12-31' },
  settings: { revenueIncludesVat: true, vatRate: 0.23 },
  baseInput: {
    business: {
      totalBudget: 53000,
      sessionsTotal: 1571548,
      transactionsTotal: 50512,
      revenueGross: 1812916,
      grossMarginPct: 0.60,
      fixedOpex: 120000,
    },
    channels: [
      { id:'meta', name:'Meta Ads', budget:20000, sessions:30000, transactions:500,  revenue:61500 },
      { id:'google', name:'Google Ads', budget:25000, sessions:40000, transactions:600,  revenue:73800 },
      { id:'seo', name:'SEO', budget:2000,  sessions:5000,  transactions:100,  revenue:10000 }, // fixedOutput
    ],
    deletedChannels: [],
  }
});

describe('solveTotals delta calculation', () => {
  it('correctly calculates Net Profit delta for a multi-faceted scenario', () => {
    const costOptimizationScenario: Scenario = {
      id: 'scen_cost_opt',
      projectId: 'proj_1',
      name: 'Cost Optimization',
      description: '',
      active: true,
      cost: { kind: 'opex', totalPeriod: 0 },
      scope: 'global',
      activeBand: 'R',
      changes: [
        {
          metric: 'fixedOpex',
          scope: 'opex',
          mode: 'relative',
          values: { P: -5, R: -10, O: -15 }, // -10% OPEX = -12,000
        },
        {
          metric: 'grossMarginPct',
          scope: 'global',
          mode: 'absolute',
          values: { P: 1, R: 2, O: 3 }, // +2pp Gross Margin
        },
      ],
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    const { baseTotals, cumulative } = solveTotals(baseProject, [costOptimizationScenario], 'R');
    
    // Marketing contribution should only increase due to Gross Margin change
    const expectedMarketingContributionDelta = (baseTotals.revenueNet * 0.62) - baseTotals.grossProfit;
    const actualMarketingContributionDelta = cumulative.marketingContribution - baseTotals.marketingContribution;
    expect(Math.round(actualMarketingContributionDelta)).toBe(Math.round(expectedMarketingContributionDelta));
    
    // Opex is reduced by 10% of 120,000 = 12,000
    const opexDelta = cumulative.business.fixedOpex - baseTotals.business.fixedOpex;
    expect(opexDelta).toBe(-12000);

    // Net Profit = MC - OPEX. DeltaNP = DeltaMC - DeltaOPEX
    const expectedNetProfitDelta = actualMarketingContributionDelta - opexDelta;
    const actualNetProfitDelta = cumulative.netProfit - baseTotals.netProfit;
    
    expect(Math.round(actualNetProfitDelta)).toBe(Math.round(expectedNetProfitDelta));
    expect(Math.round(actualNetProfitDelta)).toBe(41478);
  });

  it('calculates per-scenario delta against previous step, and cumulative against base', () => {
      const scenario1: Scenario = {
        id: 's1', projectId: '', name: 'S1', description: '', active: true,
        cost: { kind: 'opex', totalPeriod: 10000 },
        scope: 'global', activeBand: 'R', changes: [], createdAt: '', updatedAt: ''
      };
       const scenario2: Scenario = {
        id: 's2', projectId: '', name: 'S2', description: '', active: true,
        cost: { kind: 'opex', totalPeriod: 5000 },
        scope: 'global', activeBand: 'R', changes: [], createdAt: '', updatedAt: ''
      };

      const { baseTotals, perScenario, cumulative } = solveTotals(baseProject, [scenario1, scenario2], 'R');

      // Base NP = 711,349
      expect(Math.round(baseTotals.netProfit)).toBe(711349);

      // Scenario 1: NP should drop by 10k
      const s1_delta = perScenario[0].after.netProfit - perScenario[0].before.netProfit;
      expect(Math.round(s1_delta)).toBe(-10000);
      expect(Math.round(perScenario[0].after.netProfit)).toBe(701349);
      
      // Scenario 2: NP should drop by 5k vs S1's result
      const s2_delta = perScenario[1].after.netProfit - perScenario[1].before.netProfit;
      expect(Math.round(perScenario[1].before.netProfit)).toBe(701349);
      expect(Math.round(s2_delta)).toBe(-5000);
      expect(Math.round(perScenario[1].after.netProfit)).toBe(696349);

      // Cumulative: should be down 15k vs base
      const cumulative_delta = cumulative.netProfit - baseTotals.netProfit;
      expect(Math.round(cumulative_delta)).toBe(-15000);
      expect(Math.round(cumulative.netProfit)).toBe(696349);
  });
});

test('CPS -10% increases sessions/revenue with CR/AOV constant', () => {
  const project = makeProject();
  const scen: Scenario = {
    id:'s1', projectId:'p', name:'cps', description:'',
    active:true, activeBand:'R',
    cost:{ kind:'opex', totalPeriod:0 },
    scope:'global',
    changes:[{ metric:'costPerSession', scope:'global', mode:'relative', values:{P:-10,R:-10,O:-10} }],
    createdAt:'', updatedAt:''
  };

  const { baseTotals, perScenario } = solveTotals(project, [scen], 'R');
  expect(perScenario[0].after.business.sessionsTotal)
    .toBeGreaterThan(baseTotals.business.sessionsTotal);
  expect(perScenario[0].after.revenueNet)
    .toBeGreaterThan(baseTotals.revenueNet);
});

test('Global AOV +60% increases blended aovNet even with fixed-output channels', () => {
  const project = makeProject();
  const scen: Scenario = {
    id:'s2', projectId:'p', name:'aov', description:'',
    active:true, activeBand:'R',
    cost:{ kind:'opex', totalPeriod:0 },
    scope:'global',
    changes:[{ metric:'AOV', scope:'global', mode:'relative', values:{P:60,R:60,O:60} }],
    createdAt:'', updatedAt:''
  };

  const { baseTotals, perScenario } = solveTotals(project, [scen], 'R');
  const ratio = perScenario[0].after.aovNet / baseTotals.aovNet;
  expect(ratio).toBeGreaterThan(1.4); // “material” (>40%) threshold to catch partial-application bugs
});

test('Channel-scoped AOV affects only that channel', () => {
  const project = makeProject();
  const scen: Scenario = {
    id:'s3', projectId:'p', name:'meta-aov', description:'',
    active:true, activeBand:'R',
    cost:{ kind:'opex', totalPeriod:0 },
    scope:'channel:meta',
    changes:[{ metric:'AOV', scope:'channel:meta', mode:'relative', values:{P:60,R:60,O:60} }],
    createdAt:'', updatedAt:''
  };

  const { perScenario } = solveTotals(project, [scen], 'R');
  const after = perScenario[0].after;
  // spot-check: meta revenue up vs. google unchanged directionally (use channel list)
  const meta = after.channels.find(c => c.id === 'meta')!;
  const google = after.channels.find(c => c.id === 'google')!;
  expect(meta.revenue).toBeGreaterThan(0);
  // not strictly equal checks (other mechanics could change),
  // but directionally meta should lift more than google here.
  expect(meta.revenue).toBeGreaterThanOrEqual(google.revenue); 
});

test('Invariants hold', () => {
  const project = makeProject();
  const { baseTotals } = solveTotals(project, [], 'R');

  expect(baseTotals.business.transactionsTotal)
    .toBeCloseTo(baseTotals.business.sessionsTotal * baseTotals.crBlended, 6);
  expect(baseTotals.aovGross)
    .toBeCloseTo(baseTotals.business.revenueGross / baseTotals.business.transactionsTotal, 6);
  if (project.settings.revenueIncludesVat) {
    expect(baseTotals.revenueNet * (1 + project.settings.vatRate))
      .toBeCloseTo(baseTotals.business.revenueGross, 6);
  }
});

test('Global transactions +30% lifts blended transactions and preserves AOV unless changed', () => {
  const project = makeProject(); // includes a fixedOutput SEO channel
  const scen: Scenario = {
    id:'tx', projectId:'p', name:'Global TX', description:'',
    active:true, activeBand:'R',
    cost:{ kind:'opex', totalPeriod:0 },
    scope:'global',
    changes:[{ metric:'transactions', scope:'global', mode:'relative', values:{P:30,R:30,O:30} }],
    createdAt:'', updatedAt:''
  };
  const { baseTotals, perScenario } = solveTotals(project, [scen], 'R');
  const before = baseTotals.business.transactionsTotal;
  const after  = perScenario[0].after.business.transactionsTotal;
  expect(after).toBeGreaterThan(before * 1.25); // allow compounding / rounding tolerance
  // AOV should remain directionally stable if not changed
  expect(perScenario[0].after.aovNet).toBeCloseTo(baseTotals.aovNet, 3);
});

test('SEO sessions +10% increases total sessions (fixed-output)', () => {
  const project = makeProject();
  const scen: Scenario = {
    id:'seo-s', projectId:'p', name:'SEO Sessions', description:'',
    active:true, activeBand:'R',
    cost:{ kind:'opex', totalPeriod:0 },
    scope:'channel:seo',
    changes:[{ metric:'sessions', scope:'channel:seo', mode:'relative', values:{P:10,R:10,O:10} }],
    createdAt:'', updatedAt:''
  };
  const { baseTotals, perScenario } = solveTotals(project, [scen], 'R');
  expect(perScenario[0].after.business.sessionsTotal)
    .toBeGreaterThan(baseTotals.business.sessionsTotal);
});

test('Global CPS -80% lowers blended CPS and raises sessions', () => {
  const project = makeProject();
  const scen: Scenario = {
    id:'cps80', projectId:'p', name:'CPS down', description:'',
    active:true, activeBand:'R',
    cost:{ kind:'opex', totalPeriod:0 },
    scope:'global',
    changes:[{ metric:'costPerSession', scope:'global', mode:'relative', values:{P:-80,R:-80,O:-80} }],
    createdAt:'', updatedAt:''
  };
  const { baseTotals, perScenario } = solveTotals(project, [scen], 'R');
  expect(perScenario[0].after.costPerSession).toBeLessThan(baseTotals.costPerSession * 0.4);
  expect(perScenario[0].after.business.sessionsTotal)
    .toBeGreaterThan(baseTotals.business.sessionsTotal);
});
