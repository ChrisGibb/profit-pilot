
import type { BaseInput, CalculatedMetrics, ChannelData, Project, Scenario, ActiveBand, ProjectSettings, MathTrace, TotalsEnvelope, ChannelMechanics, ChangeMetric } from './types';
import { metricMeta } from './types';

// =================================================================================
// DATA PARSING & SANITIZATION
// =================================================================================

/**
 * Parses a raw string input into a number, handling various formats.
 * @param raw The raw string from the input field.
 * 'int' | 'currency' | 'percent' @param kind The type of number to parse (.
 * @returns The parsed number, or null if parsing fails.
 */
export const parseNumeric = (raw: string, kind: 'int' | 'currency' | 'percent'): number | null => {
    if (typeof raw !== 'string' || raw.trim() === '') return null;
    
    let normalized = raw.trim().replace(/\u00A0|\u202F|\u2009/g, ' '); // Normalize non-breaking spaces

    if (normalized.startsWith('(') && normalized.endsWith(')')) {
        normalized = '-' + normalized.substring(1, normalized.length - 1);
    }
    
    let isPercent = kind === 'percent';
    if (!isPercent && normalized.includes('%')) {
        isPercent = true;
    }
    normalized = normalized.replace(/%/g, '').trim();
    normalized = normalized.replace(/[€$£zł]/g, '').trim();
    
    const onlyComma = /,/.test(normalized) && !/\./.test(normalized);
    const onlyDot = /\./.test(normalized) && !/,/.test(normalized);
    const both = /,/.test(normalized) && /\./.test(normalized);

    const COMMA_GROUPS = /^\d{1,3}(,\d{3})+(\.\d{2})?$/;
    const DOT_GROUPS   = /^\d{1,3}(\.\d{3})+(,\d{2})?$/;

    if (both) {
        const lastComma = normalized.lastIndexOf(',');
        const lastDot = normalized.lastIndexOf('.');
        if (lastComma > lastDot) { 
            normalized = normalized.replace(/\./g, '').replace(',', '.');
        } else { 
            normalized = normalized.replace(/,/g, '');
        }
    } else if (onlyComma) {
        if (COMMA_GROUPS.test(normalized) || /^\d+,\d{3}$/.test(normalized)) {
            normalized = normalized.replace(/,/g, '');
        } else {
            normalized = normalized.replace(',', '.');
        }
    } else if (onlyDot) {
        if (DOT_GROUPS.test(normalized) || /^\d+\.\d{3}$/.test(normalized)) {
            normalized = normalized.replace(/\./g, '');
        }
    }

    let value = parseFloat(normalized);

    if (isNaN(value)) {
        return null;
    }

    if (isPercent) {
        value /= 100;
    }
    
    if (kind === 'int') {
        value = Math.round(value);
    }

    return value;
}


// =================================================================================
// CALCULATION ENGINE - PURE FUNCTIONS
// =================================================================================

interface Mechanics {
  channels: ChannelMechanics[];
  grossMarginPct: number;
  fixedOpex: number;
  envelope: TotalsEnvelope;
}


/**
 * Derives the core "mechanics" from the base input data.
 * Mechanics are the independent variables that scenarios can change.
 */
const getBaseMechanics = (baseInput: BaseInput): Mechanics => {
    const manualChannels: ChannelData[] = JSON.parse(JSON.stringify(baseInput.channels));
    const baseBusiness = baseInput.business;

    let envelopeSource: TotalsEnvelope['source'] = 'ga4';

    let S = manualChannels.reduce((sum, ch) => sum + (ch.sessions || 0), 0);
    let T = manualChannels.reduce((sum, ch) => sum + (ch.transactions || 0), 0);
    let R = manualChannels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);
    let B = manualChannels.reduce((sum, ch) => sum + (ch.budget || 0), 0);
    
    if (S > baseBusiness.sessionsTotal || T > baseBusiness.transactionsTotal || R > baseBusiness.revenueGross || B > baseBusiness.totalBudget) {
       // Don't rescale user inputs silently. Mark envelope as derived so math is self-consistent.
       envelopeSource = 'derived';
    }

    let dS = baseBusiness.sessionsTotal - S;
    let dT = baseBusiness.transactionsTotal - T;
    let dR = baseBusiness.revenueGross - R;
    let dB = baseBusiness.totalBudget - B;

    const allChannelsData = [...manualChannels];
    
    if (dS > 0 || dT > 0 || dR > 0 || dB > 0) {
        allChannelsData.push({
            id: 'other',
            name: 'Other',
            budget: Math.max(0, dB),
            sessions: Math.max(0, dS),
            transactions: Math.max(0, dT),
            revenue: Math.max(0, dR),
        });
    }

    const mechanicsChannels: ChannelMechanics[] = allChannelsData.map(ch => {
        const isOther = ch.id === 'other';
        const isSeo = ch.id === 'seo';
        const mode: ChannelMechanics['mode'] = (isOther || isSeo) ? 'fixedOutput' : 'budgetDriven';
        
        const CR = ch.sessions > 0 ? ch.transactions / ch.sessions : 0;
        const AOV = ch.transactions > 0 ? ch.revenue / ch.transactions : 0;
        const costPerSession = ch.sessions > 0 ? ch.budget / ch.sessions : 0;
        
        return {
            id: ch.id,
            name: ch.name,
            budget: ch.budget,
            costPerSession: costPerSession > 0 && isFinite(costPerSession) ? costPerSession : 0,
            CR: Math.max(0, Math.min(1, CR)),
            AOV: Math.max(0, AOV),
            mode,
            baseline: (isOther || isSeo) ? { sessions: ch.sessions, transactions: ch.transactions, revenue: ch.revenue } : undefined,
        };
    });
    
    const envelope: TotalsEnvelope = {
        source: envelopeSource,
        sessionsTotal: baseBusiness.sessionsTotal,
        transactionsTotal: baseBusiness.transactionsTotal,
        revenueGross: baseBusiness.revenueGross,
        totalBudget: baseBusiness.totalBudget,
    };

    return {
        channels: mechanicsChannels,
        grossMarginPct: baseInput.business.grossMarginPct,
        fixedOpex: baseInput.business.fixedOpex,
        envelope: envelope
    };
};

const affectsTopLine = (s: Scenario) =>
  (s.cost?.kind === 'budget' && s.cost.totalPeriod !== 0) ||
  s.changes.some(c => ['budget', 'costPerSession', 'CR', 'AOV', 'transactions', 'sessions'].includes(c.metric));


const deriveEnvelopeFromChannels = (channels: ChannelMechanics[]): TotalsEnvelope => {
    let budget = 0, sessions = 0, transactions = 0, revenueGross = 0;
    
    channels.forEach(m => {
        budget += m.budget;
        if (m.mode === 'fixedOutput') {
            sessions += m.baseline?.sessions ?? 0;
            transactions += m.baseline?.transactions ?? 0;
            revenueGross += m.baseline?.revenue ?? 0;
        } else { // budgetDriven
            const s = m.costPerSession > 0 ? m.budget / m.costPerSession : 0;
            const t = s * m.CR;
            const r = t * m.AOV;
            sessions += s;
            transactions += t;
            revenueGross += r;
        }
    });

    return {
        source: 'derived',
        totalBudget: budget,
        sessionsTotal: sessions,
        transactionsTotal: transactions,
        revenueGross: revenueGross
    };
};

/**
 * Calculates all derived metrics from a set of mechanics.
 * This is the single source of truth for all financial calculations.
 */
const solveFromMechanics = (mechanics: Mechanics, settings: Project['settings']): CalculatedMetrics => {
    
    mechanics.channels.forEach(ch => {
      if (!isFinite(ch.budget) || ch.budget < 0) ch.budget = 0;
      if (!isFinite(ch.costPerSession) || ch.costPerSession <= 0) ch.costPerSession = 1e-9;
      if (!isFinite(ch.CR) || ch.CR < 0) ch.CR = 0;
      if (ch.CR > 1) ch.CR = 1;
      if (!isFinite(ch.AOV) || ch.AOV < 0) ch.AOV = 0;
    });

    const channels = mechanics.channels.map(m => {
        if (m.mode === 'fixedOutput') {
            const sessions      = m.baseline?.sessions ?? 0;
            const transactions  = m.baseline?.transactions ?? 0;
            const revenue       = m.baseline?.revenue ?? 0;
            return { ...m, sessions, transactions, revenue };
        } else { // budgetDriven
            const sessions     = m.costPerSession > 0 ? m.budget / m.costPerSession : 0;
            const transactions = sessions * m.CR;
            const revenue      = transactions * m.AOV;
            return { ...m, sessions, transactions, revenue };
        }
    });

    const sessionsTotal    = channels.reduce((s,c) => s + c.sessions, 0);
    const transactionsTotal= channels.reduce((s,c) => s + c.transactions, 0);
    const revenueGross     = channels.reduce((s,c) => s + c.revenue, 0);
    const totalBudget      = channels.reduce((s,c) => s + c.budget, 0);

    const business = {
        totalBudget,
        sessionsTotal,
        transactionsTotal,
        revenueGross,
        grossMarginPct: mechanics.grossMarginPct,
        fixedOpex: mechanics.fixedOpex,
    };

    const revenueNet = settings.revenueIncludesVat ? business.revenueGross / (1 + settings.vatRate) : business.revenueGross;
    const costPerSession = business.sessionsTotal > 0 ? business.totalBudget / business.sessionsTotal : 0;
    const crBlended = business.sessionsTotal > 0 ? business.transactionsTotal / business.sessionsTotal : 0;
    const aovGross = business.transactionsTotal > 0 ? business.revenueGross / business.transactionsTotal : 0;
    
    const grossProfit = revenueNet * mechanics.grossMarginPct;
    const totalMarketingCost = business.totalBudget;
    const marketingContribution = grossProfit - totalMarketingCost;
    const contributionMargin = revenueNet > 0 ? marketingContribution / revenueNet : 0;
    const netProfit = marketingContribution - mechanics.fixedOpex;
    
    const netMargin = revenueNet > 0 ? netProfit / revenueNet : 0;
    const romi = totalMarketingCost > 0 ? (grossProfit - totalMarketingCost) / totalMarketingCost : null;
    const cacBlended = business.transactionsTotal > 0 ? totalMarketingCost / business.transactionsTotal : 0;
    const grossProfitPerOrder = business.transactionsTotal > 0 ? grossProfit / business.transactionsTotal : 0;
    const paybackOrders = cacBlended && grossProfitPerOrder > 0 ? cacBlended / grossProfitPerOrder : null;

    return {
        channels,
        business,
        costPerSession,
        revenueNet,
        crBlended,
        aovGross,
        aovNet: business.transactionsTotal > 0 ? revenueNet / business.transactionsTotal : 0,
        grossProfit,
        totalMarketingCost,
        marketingContribution,
        contributionMargin,
        netProfit,
        netMargin,
        romi,
        cacBlended,
        paybackOrders,
        grossProfitPerOrder,
    };
};

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

/**
 * Applies a single scenario's changes to a set of mechanics.
 */
const applyScenario = (
    mechanics: Mechanics,
    scenario: Scenario,
    band: ActiveBand
): Mechanics => {
    let newMechanics: Mechanics = JSON.parse(JSON.stringify(mechanics));

    const applyChange = (
        currentValue: number,
        change: { metric: ChangeMetric; mode: 'relative' | 'absolute'; values: Record<ActiveBand, number> }
    ) => {
        const val = change.values[band];
        if (change.mode === 'absolute' && metricMeta[change.metric].unit === 'percent') {
            return clamp(currentValue + (val / 100), 0, 1);
        } else if (change.mode === 'relative') {
            return currentValue * (1 + val / 100);
        }
        return currentValue + val;
    };
    
    if (scenario.cost && scenario.cost.totalPeriod !== 0) {
        if (scenario.cost.kind === 'opex') {
            newMechanics.fixedOpex += scenario.cost.totalPeriod;
        } else if (scenario.cost.kind === 'budget') {
            const channelToBudget = newMechanics.channels.find(c => c.id === scenario.scope.split(':')[1]) || newMechanics.channels.find(c=>c.id==='other') || newMechanics.channels[0];
            if (channelToBudget) {
                channelToBudget.budget += scenario.cost.totalPeriod;
            }
        }
    }
    
    scenario.changes.forEach(change => {
        if (change.scope === 'global') {
            if (change.metric === 'grossMarginPct') {
                newMechanics.grossMarginPct = applyChange(newMechanics.grossMarginPct, change);
            } else if (change.metric === 'CR') {
                newMechanics.channels.forEach(ch => { if(ch.mode==='budgetDriven') ch.CR = Math.max(0, Math.min(1, applyChange(ch.CR, change))) });
            } else if (change.metric === 'AOV') {
                const factorRel = 1 + change.values[band] / 100;
                const isRelative = change.mode === 'relative';

                newMechanics.channels.forEach(ch => {
                    if (ch.mode === 'budgetDriven') {
                        // Budget-driven: change AOV directly
                        ch.AOV = Math.max(0, isRelative ? ch.AOV * factorRel : ch.AOV + change.values[band]);
                    } else if (ch.mode === 'fixedOutput' && ch.baseline) {
                        // Fixed-output: scale revenue baseline (transactions/sessions fixed unless CR also changes)
                        if (isRelative) {
                            ch.baseline.revenue = Math.max(0, ch.baseline.revenue * factorRel);
                        } else {
                             // Absolute change to AOV on a fixed output channel means we add the delta per transaction
                             const aovDelta = change.values[band];
                             ch.baseline.revenue = Math.max(0, ch.baseline.revenue + (aovDelta * ch.baseline.transactions));
                        }
                    }
                });
            } else if (change.metric === 'costPerSession') {
                 const factor = Math.max(0.01, 1 + change.values[band] / 100);
                 newMechanics.channels.forEach(ch => {
                    if (ch.mode === 'budgetDriven') {
                        ch.costPerSession = Math.max(1e-9, ch.costPerSession * factor);
                    }
                 });
            } else if (change.metric === 'transactions') {
                const isRelative = change.mode === 'relative';
                const factor = 1 + change.values[band] / 100;

                newMechanics.channels.forEach(ch => {
                    if (ch.mode === 'budgetDriven') {
                    // Transactions = Sessions * CR. To lift T globally without re-budgeting,
                    // we adjust CR (bounded in [0,1]).
                    if (isRelative) {
                        ch.CR = Math.max(0, Math.min(1, ch.CR * factor));
                    } else {
                        const sessions = ch.costPerSession > 0 ? ch.budget / ch.costPerSession : 0;
                        const currentT = sessions * ch.CR;
                        const targetT = Math.max(0, currentT + change.values[band]);
                        ch.CR = sessions > 0 ? Math.min(1, Math.max(0, targetT / sessions)) : ch.CR;
                    }
                    } else if (ch.mode === 'fixedOutput' && ch.baseline) {
                    // For fixed-output channels, scale baseline.transactions.
                    const oldT = ch.baseline.transactions;
                    if (isRelative) {
                        ch.baseline.transactions = Math.max(0, oldT * factor);
                    } else {
                        ch.baseline.transactions = Math.max(0, oldT + change.values[band]);
                    }
                    // Keep AOV stable by scaling revenue proportionally to transactions.
                    const tRatio = oldT > 0 ? (ch.baseline.transactions / oldT) : 1;
                    ch.baseline.revenue = Math.max(0, ch.baseline.revenue * tRatio);
                    }
                });
            }
        } else if (change.scope === 'opex') {
             if (change.metric === 'fixedOpex') newMechanics.fixedOpex = applyChange(newMechanics.fixedOpex, change);
        } else if (change.scope.startsWith('channel:')) {
            const channelId = change.scope.split(':')[1];
            const channel = newMechanics.channels.find(c => c.id === channelId);
            if (channel) {
                if (change.metric === 'budget') channel.budget = Math.max(0, applyChange(channel.budget, change));
                if (change.metric === 'costPerSession') {
                    if (change.mode === 'relative') {
                        const factor = 1 + change.values[band] / 100;
                        const safeFactor = Math.max(0.01, factor);
                        channel.costPerSession = Math.max(1e-9, channel.costPerSession * safeFactor);
                    } else {
                        channel.costPerSession = Math.max(1e-9, channel.costPerSession + change.values[band]);
                    }
                }
                if (change.metric === 'sessions' && channel.mode === 'fixedOutput' && channel.baseline) {
                    if (change.mode === 'relative') {
                        channel.baseline.sessions *= (1 + change.values[band] / 100);
                    } else {
                        channel.baseline.sessions += change.values[band];
                    }
                }
                if (change.metric === 'CR') channel.CR = Math.max(0, Math.min(1, applyChange(channel.CR, change)));
                if (change.metric === 'AOV') {
                  if (channel.mode === 'budgetDriven') {
                      channel.AOV = Math.max(0, applyChange(channel.AOV, change));
                  } else if (channel.mode === 'fixedOutput' && channel.baseline) {
                      const val = change.values[band];
                      if (change.mode === 'relative') {
                          channel.baseline.revenue = Math.max(0, channel.baseline.revenue * (1 + val/100));
                      } else {
                          channel.baseline.revenue = Math.max(0, channel.baseline.revenue + (val * channel.baseline.transactions));
                      }
                  }
                }
                if (change.metric === 'transactions') {
                    if (change.mode === 'relative') {
                        channel.CR = Math.max(0, Math.min(1, channel.CR * (1 + change.values[band] / 100)));
                    } else {
                        const sessions = channel.costPerSession > 0 ? channel.budget / channel.costPerSession : 0;
                        const currentT = sessions * channel.CR;
                        const targetT  = Math.max(0, currentT + change.values[band]);
                        channel.CR = sessions > 0 ? Math.min(1, Math.max(0, targetT / sessions)) : channel.CR;
                    }
                }
            }
        }
    });

    if (newMechanics.envelope.source === 'ga4') {
        const changedTopLine = affectsTopLine(scenario);
        if(changedTopLine) {
            newMechanics.envelope = deriveEnvelopeFromChannels(newMechanics.channels);
        }
    }
    
    return newMechanics;
};

const buildTrace = (totals: CalculatedMetrics, settings: ProjectSettings, envelope: TotalsEnvelope): MathTrace => ({
    totalsSource: envelope.source,
    budget: totals.totalMarketingCost,
    cps: totals.costPerSession,
    sessions: totals.business.sessionsTotal,
    cr: totals.crBlended,
    transactions: totals.business.transactionsTotal,
    aovGross: totals.aovGross,
    revenueGross: totals.business.revenueGross,
    vatEnabled: settings.revenueIncludesVat,
    vatRate: settings.vatRate,
    revenueNet: totals.revenueNet,
    grossMarginPct: totals.business.grossMarginPct,
    grossProfit: totals.grossProfit,
    opex: totals.business.fixedOpex,
    marketingContribution: totals.marketingContribution,
    netProfit: totals.netProfit,
});

/**
 * The main calculation function for the entire application.
 * @param project The full project object.
 * @param scenarios The list of all scenarios.
 * @param globalActiveBand The currently selected global estimation band.
 * @returns The base totals, per-scenario deltas, and cumulative totals.
 */
export const solveTotals = (
    project: Project,
    scenarios: Scenario[],
    globalActiveBand: ActiveBand | 'Individual'
): { baseTotals: CalculatedMetrics, baseTrace: MathTrace, perScenario: any[], cumulative: CalculatedMetrics } => {
    const baseMechanics = getBaseMechanics(project.baseInput);
    const baseTotals = solveFromMechanics(baseMechanics, project.settings);
    const baseTrace = buildTrace(baseTotals, project.settings, baseMechanics.envelope);

    const perScenario: { scenario: Scenario, before: CalculatedMetrics, after: CalculatedMetrics }[] = [];
    let currentMechanics = baseMechanics;
    let lastTotals = baseTotals;

    const activeScenarios = scenarios.filter(s => s.active);

    activeScenarios.forEach(scenario => {
        const bandToUse = globalActiveBand === 'Individual' ? scenario.activeBand : globalActiveBand;
        const beforeTotals = lastTotals;
        
        const nextMechanics = applyScenario(currentMechanics, scenario, bandToUse);
        const afterTotals = solveFromMechanics(nextMechanics, project.settings);
        
        if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
            const hasGlobalT = scenario.changes.some(c => c.scope === 'global' && c.metric === 'transactions');
            if (hasGlobalT) {
              const intended = scenario.changes.find(c => c.metric === 'transactions')!;
              const factor = 1 + intended.values[bandToUse] / 100;
              const expectUp = factor > 1 || (intended.mode === 'absolute' && intended.values[bandToUse] > 0);
              const moved = afterTotals.business.transactionsTotal - beforeTotals.business.transactionsTotal;
              console.assert(
                expectUp ? moved >= -1 : moved <= 1, // tolerate ±1 rounding
                'Global transactions change did not move blended transactions as expected',
                { before: beforeTotals.business.transactionsTotal, after: afterTotals.business.transactionsTotal, scenario }
              );
            }

            const cpsChange = scenario.changes.find(c => c.metric === 'costPerSession' && c.scope === 'global');
            if (cpsChange) {
              const factor = 1 + cpsChange.values[bandToUse] / 100;
              if (factor < 1) {
                console.assert(afterTotals.totalMarketingCost === beforeTotals.totalMarketingCost, 'Global CPS should not change total budget.', { before: beforeTotals, after: afterTotals, scenario });
                console.assert(afterTotals.business.sessionsTotal >= beforeTotals.business.sessionsTotal - 1, 'Lower CPS with same spend should not reduce sessions', { before: beforeTotals, after: afterTotals, scenario });
              }
            }
        }
        
        perScenario.push({ scenario, before: beforeTotals, after: afterTotals });
        
        currentMechanics = nextMechanics;
        lastTotals = afterTotals;
    });
    
    const cumulative = perScenario.length > 0 ? perScenario[perScenario.length - 1].after : baseTotals;
    
    const close = (a:number,b:number)=>Math.abs(a-b) <= Math.max(1, 1e-6*Math.max(Math.abs(a),Math.abs(b)));
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.assert(close(baseTotals.business.sessionsTotal, baseTotals.totalMarketingCost / baseTotals.costPerSession), 'Invariant S ≈ Budget/CPS failed', baseTotals);
        console.assert(close(baseTotals.business.transactionsTotal, baseTotals.business.sessionsTotal * baseTotals.crBlended), 'Invariant T ≈ S*CR failed', baseTotals);
        console.assert(close(baseTotals.aovGross, baseTotals.business.transactionsTotal > 0 ? baseTotals.business.revenueGross / baseTotals.business.transactionsTotal : 0), 'Invariant AOVgross ≈ RevenueGross / Transactions failed', baseTotals);
        console.assert(close(baseTotals.aovNet, baseTotals.business.transactionsTotal > 0 ? baseTotals.revenueNet / baseTotals.business.transactionsTotal : 0), 'Invariant AOVnet ≈ RevenueNet / Transactions failed', baseTotals);
        if(project.settings.revenueIncludesVat) console.assert(close(baseTotals.revenueNet * (1+project.settings.vatRate), baseTotals.business.revenueGross), 'Invariant Gross/Net VAT bridge failed', baseTotals);
    }


    return { baseTotals, baseTrace, perScenario, cumulative };
}
