
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, ArrowUp, ArrowDown, ChevronsUpDown, Trash2, Info, Calculator } from "lucide-react";
import type { Project, CalculatedMetrics, BaseInput, Currency, ChannelData, Scenario, ActiveBand, MathTrace, TotalsEnvelope, ChangeMetric } from "@/lib/types";
import { isMetricPositive, metricMeta, labelToMetricMap } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DataInputForm } from "./data-input-form";
import { ScenarioManager } from "./scenario-manager";
import { subYears, format } from 'date-fns';
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { solveTotals } from "@/lib/calc";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { formatCurrencyEUR, formatInteger, formatPP, formatPercent, formatCurrencySmart } from "@/lib/formatters";


const initialProject: Project = {
    id: "proj_1",
    name: "My eCommerce Business",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currency: "EUR",
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
            grossMarginPct: 0.60,
            fixedOpex: 120000,
            totalBudget: 53000,
        },
        channels: [
            { id: 'meta', name: 'Meta Ads', budget: 20000, sessions: 30000, transactions: 500, revenue: 61500 },
            { id: 'google', name: 'Google Ads', budget: 25000, sessions: 40000, transactions: 600, revenue: 73800 },
            { id: 'tiktok', name: 'TikTok Ads', budget: 5000, sessions: 10000, transactions: 50, revenue: 5000 },
            { id: 'seo', name: 'SEO', budget: 2000, sessions: 5000, transactions: 100, revenue: 10000 },
            { id: 'automation', name: 'Marketing Automation', budget: 1000, sessions: 1000, transactions: 50, revenue: 5000 },
        ],
        deletedChannels: [],
    }
};

const currencySymbols: Record<Currency, string> = {
    EUR: "€",
};

// =================================================================================
// MAIN COMPONENT
// =================================================================================

export function ProjectView() {
  const [project, setProject] = useState<Project>(initialProject);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [deletedScenarios, setDeletedScenarios] = useState<Scenario[]>([]);
  const [globalActiveBand, setGlobalActiveBand] = useState<ActiveBand | 'Individual'>('R');
  
  const { baseTotals, baseTrace, perScenario, cumulative } = useMemo(() => {
    return solveTotals(project, scenarios, globalActiveBand);
  }, [project, scenarios, globalActiveBand]);


  const handleBaseInputChange = (newBaseInput: BaseInput) => {
    setProject(prev => ({
        ...prev,
        baseInput: newBaseInput,
        updatedAt: new Date().toISOString()
    }))
  }
  
  const handleScenariosChange = (newScenarios: Scenario[]) => {
      setScenarios(newScenarios);
  }

  const handleDeleteChannel = (channelId: string) => {
    const channelToDelete = project.baseInput.channels.find(c => c.id === channelId);
    if (!channelToDelete) return;
    
    console.info('channel_deleted', {id: channelId, name: channelToDelete.name});

    setProject(prev => {
        const newChannels = prev.baseInput.channels.filter(c => c.id !== channelId);
        const newDeletedChannels = [...(prev.baseInput.deletedChannels || []), channelToDelete];
        
        const newBaseInput: BaseInput = {
            ...prev.baseInput,
            channels: newChannels,
            deletedChannels: newDeletedChannels,
        };

        return {
            ...prev,
            baseInput: newBaseInput,
            updatedAt: new Date().toISOString(),
        };
    });
  };
  
  const handleRestoreChannel = () => {
    if (!project.baseInput.deletedChannels || project.baseInput.deletedChannels.length === 0) return;
    
    const newDeletedChannels = [...project.baseInput.deletedChannels];
    const channelToRestore = newDeletedChannels.pop();
    
    if (channelToRestore) {
        console.info('channel_restored', {id: channelToRestore.id, name: channelToRestore.name});
        setProject(prev => {
            const newBaseInput: BaseInput = {
                ...prev.baseInput,
                channels: [...prev.baseInput.channels, channelToRestore],
                deletedChannels: newDeletedChannels
            };
            return {
              ...prev,
              baseInput: newBaseInput,
              updatedAt: new Date().toISOString()
            }
        });
    }
  }

  const handleScenarioOrderChange = useCallback((index: number, direction: 'up' | 'down') => {
      const activeScenarios = scenarios.filter(s => s.active);
      const inactiveScenarios = scenarios.filter(s => !s.active);

      const scenarioToMove = activeScenarios[index];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex < 0 || newIndex >= activeScenarios.length) return;

      const newActiveScenarios = [...activeScenarios];
      [newActiveScenarios[index], newActiveScenarios[newIndex]] = [newActiveScenarios[newIndex], newActiveScenarios[index]];
      
      const newScenarios = [...newActiveScenarios, ...inactiveScenarios];
      
      console.info('scenario_reordered', { from: scenarios.findIndex(s => s.id === scenarioToMove.id), to: newScenarios.findIndex(s => s.id === scenarioToMove.id) });
      setScenarios(newScenarios);
  }, [scenarios]);


  const handleScenarioToggle = useCallback((id: string, active: boolean) => {
      console.info('scenario_toggled', { id, active });
      setScenarios(scenarios.map(s => s.id === id ? {...s, active} : s));
  }, [scenarios]);
  
  const handleScenarioDelete = (id: string) => {
    const scenarioToDelete = scenarios.find(s => s.id === id);
    if (!scenarioToDelete) return;
    setDeletedScenarios(prev => [...prev, scenarioToDelete]);
    setScenarios(scenarios.filter(s => s.id !== id));
    console.info('scenario_deleted',{id});
  }


  return (
    <TooltipProvider delayDuration={100}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-3 space-y-8">
            <Tabs defaultValue="inputs" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="inputs">Base Inputs</TabsTrigger>
                <TabsTrigger value="scenarios">Scenario Simulation</TabsTrigger>
              </TabsList>
              <TabsContent value="inputs" className="mt-6">
                <DataInputForm 
                  baseInput={project.baseInput}
                  derivedMetrics={baseTotals}
                  settings={project.settings}
                  onBaseInputChange={handleBaseInputChange}
                  onSettingsChange={(newSettings) => setProject(p => ({...p, settings: newSettings}))}
                  onDeleteChannel={handleDeleteChannel}
                  onRestoreChannel={project.baseInput.deletedChannels && project.baseInput.deletedChannels.length > 0 ? handleRestoreChannel : undefined}
                  currency={project.currency}
                  currencySymbol={currencySymbols[project.currency]}
                />
              </TabsContent>
              <TabsContent value="scenarios" className="mt-6">
                <ScenarioManager
                  scenarios={scenarios}
                  deletedScenarios={deletedScenarios}
                  onScenariosChange={handleScenariosChange}
                  onDeletedScenariosChange={setDeletedScenarios}
                  globalActiveBand={globalActiveBand}
                  onGlobalActiveBandChange={setGlobalActiveBand}
                />
              </TabsContent>
            </Tabs>
        </div>

        <div className="lg:col-span-2 shadow-lg sticky top-8 space-y-4">
            <ResultCard title="Base Results" results={baseTotals} trace={baseTrace} showNetProfit />
            
            {perScenario.map((item) => {
                const activeScenarios = scenarios.filter(s=>s.active);
                const scenarioIndex = activeScenarios.findIndex(s => s.id === item.scenario.id);
                return (
                    <ScenarioResultCard 
                        key={item.scenario.id} 
                        scenario={item.scenario}
                        results={item.after}
                        prevResults={item.before}
                        onToggle={handleScenarioToggle}
                        onDelete={handleScenarioDelete}
                        onReorder={(dir) => handleScenarioOrderChange(scenarioIndex, dir)}
                        isFirst={scenarioIndex === 0}
                        isLast={scenarioIndex === activeScenarios.length - 1}
                    />
                );
            })}

            {scenarios.filter(s => s.active).length > 0 && 
                <ResultCard 
                  title="Cumulative Results" 
                  results={cumulative} 
                  isCumulative={true} 
                  baselineResults={baseTotals} 
                  showNetProfit={true}
                  primary="marketingContribution"
                />
            }
        </div>
      </div>
    </TooltipProvider>
  );
}

export const ResultCard = ({ title, results, trace, isCumulative, baselineResults, showNetProfit = false, primary = "marketingContribution" }: { 
    title: string, 
    results: CalculatedMetrics, 
    trace?: MathTrace, 
    isCumulative?: boolean, 
    baselineResults?: CalculatedMetrics, 
    showNetProfit?: boolean,
    primary?: "marketingContribution" | "netProfit"
}) => {
    
    const metrics = [
        { key: "marketingContribution", label: "Marketing Contribution", tooltip: "Gross Profit − Marketing Spend", isPrimary: primary === 'marketingContribution' },
        { key: "netProfit", label: "Net Profit", tooltip: "Marketing Contribution − Fixed OPEX", isPrimary: primary === 'netProfit' }
    ].sort((a,b) => (a.isPrimary ? -1 : b.isPrimary ? 1: 0));

    const renderMetric = (label: string, value: number, tooltip: string, compareValue?: number, isMain = false) => {
        let colorClass = 'text-white';
        const metricId = labelToMetricMap[label as keyof typeof labelToMetricMap] || "netProfit";
        if (isMetricPositive(metricId, value)) {
             colorClass = 'text-green-500';
        } else if (value < 0) {
             colorClass = 'text-destructive';
        }

        const delta = isCumulative && compareValue !== undefined && value !== compareValue ? value - compareValue : null;
        const deltaDisplay = delta !== null ? formatCurrencyEUR(Math.round(delta!)) : null;
        const deltaIsGood = delta !== null ? isMetricPositive(metricId, delta) : false;
          
        return (
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-2">
                <p className={cn("font-semibold", isMain ? "text-xl" : "text-base")}>{label}</p>
                <Tooltip><TooltipTrigger asChild><HelpCircle className="w-4 h-4 text-muted-foreground cursor-pointer" /></TooltipTrigger><TooltipContent><p>{tooltip}</p></TooltipContent></Tooltip>
            </div>
            <div className="flex items-center gap-4">
                 {deltaDisplay && (
                    <Badge variant={deltaIsGood ? "default" : "destructive"} className={cn("text-sm font-bold flex items-center gap-1", deltaIsGood ? "bg-green-800/50 text-green-200" : "bg-red-800/50 text-red-200")}>
                        {delta! > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                        {deltaDisplay.replace(/^[+-]/, '')}
                        {isCumulative && <span data-testid="cumulative-delta-label" className="text-xs font-normal ml-1 opacity-70">vs Base</span>}
                    </Badge>
                )}
                <p className={cn("font-headline font-bold", isMain ? "text-3xl" : "text-xl", colorClass)}>
                  {formatCurrencyEUR(value)}
                </p>
            </div>
          </div>
        );
      };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-headline text-2xl">{title}</CardTitle>
                {trace && <MathInspector trace={trace} />}
            </CardHeader>
            <CardContent className="space-y-2">
              {metrics.map(metric => {
                  if (metric.key === 'netProfit' && !showNetProfit && primary !== 'netProfit') return null;
                  return (
                    <div key={metric.key}>
                      {renderMetric(
                          metric.label,
                          results[metric.key] as number,
                          metric.tooltip,
                          baselineResults?.[metric.key] as number | undefined,
                          metric.isPrimary
                      )}
                    </div>
                  )
              })}
              
              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex justify-between items-center"><Tooltip><TooltipTrigger asChild><span>Revenue (Net)</span></TooltipTrigger><TooltipContent>Gross revenue adjusted for VAT settings.</TooltipContent></Tooltip><span className="font-bold">{formatCurrencyEUR(results.revenueNet)}</span></div>
                <div className="flex justify-between items-center"><Tooltip><TooltipTrigger asChild><span>Contribution Margin</span></TooltipTrigger><TooltipContent>(Gross Profit − Marketing Spend) ÷ Revenue (Net).</TooltipContent></Tooltip><span className="font-bold">{formatPercent(results.contributionMargin)}</span></div>
                <div className="flex justify-between items-center"><Tooltip><TooltipTrigger asChild><span>ROMI</span></TooltipTrigger><TooltipContent>(Gross Profit − Marketing Spend) ÷ Marketing Spend.</TooltipContent></Tooltip><span className="font-bold">{formatPercent(results.romi)}</span></div>
                <div className="flex justify-between items-center"><Tooltip><TooltipTrigger asChild><span>Blended CAC</span></TooltipTrigger><TooltipContent>Total Marketing Spend ÷ Transactions.</TooltipContent></Tooltip><span className="font-bold">{formatCurrencySmart(results.cacBlended)}</span></div>
              </div>
            </CardContent>
        </Card>
    );
};

const MathInspector = ({ trace }: { trace: MathTrace}) => {
    const [isOpen, setIsOpen] = useState(false);
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === '?') {
                setIsOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    type Part = { v: number; t: 'currency' | 'percent' | 'integer' };
    const equations: { name: string; formula: string; parts: [Part, Part, Part]; op: '÷' | '×' | '−'; }[] = [
      { name: 'Sessions',           formula: 'Σ(Budget ÷ CPS) + Sessions_fixed',        parts: [{v: trace.budget, t:'currency'}, {v: trace.cps, t:'currency'}, {v: trace.sessions, t:'integer'}],  op: '÷' },
      { name: 'Transactions',       formula: 'Σ(Sessions × CR) + Transactions_fixed',   parts: [{v: trace.sessions, t:'integer'}, {v: trace.cr, t:'percent'}, {v: trace.transactions, t:'integer'}], op: '×' },
      { name: 'Revenue (Gross)',    formula: 'Σ(Transactions × AOV) + Revenue_fixed',   parts: [{v: trace.transactions, t:'integer'}, {v: trace.aovGross, t:'currency'}, {v: trace.revenueGross, t:'currency'}], op: '×' },
      { name: 'Revenue (Net)',      formula: trace.vatEnabled ? 'Revenue (Gross) ÷ (1 + VAT)' : 'Revenue (Gross)',
        parts: [{v: trace.revenueGross, t:'currency'}, {v: trace.vatRate, t:'percent'}, {v: trace.revenueNet, t:'currency'}], op: '÷' },
      { name: 'Gross Profit',       formula: 'Revenue (Net) × Gross Margin',            parts: [{v: trace.revenueNet, t:'currency'}, {v: trace.grossMarginPct, t:'percent'}, {v: trace.grossProfit, t:'currency'}], op: '×' },
      { name: 'Marketing Contribution', formula: 'Gross Profit − Marketing Spend',      parts: [{v: trace.grossProfit, t:'currency'}, {v: trace.budget, t:'currency'}, {v: trace.marketingContribution, t:'currency'}], op: '−' },
      { name: 'Net Profit',         formula: 'Marketing Contribution − OPEX',           parts: [{v: trace.marketingContribution, t:'currency'}, {v: trace.opex, t:'currency'}, {v: trace.netProfit, t:'currency'}], op: '−' },
    ];

    const fmt = (p: Part) => p.t === 'currency' ? formatCurrencyEUR(p.v) : p.t === 'percent' ? formatPercent(p.v) : formatInteger(p.v);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Info className="w-4 h-4 mr-2" />
                    How this is calculated
                     <Badge variant="outline" className='ml-2 capitalize'>{trace.totalsSource}</Badge>
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <Card className="mt-2 text-sm">
                    <CardContent className="p-4 space-y-2">
                        {equations.map((eq, i) => (
                            <div key={eq.name} className="p-2 rounded-md hover:bg-muted/50">
                                <p className="font-semibold text-muted-foreground">
                                  {i+1}) {eq.name} <span className="font-normal">= {eq.formula}</span>
                                </p>
                                <p className="font-mono text-base">
                                  = {fmt(eq.parts[0])} {eq.op} {eq.name === 'Revenue (Net)' && trace.vatEnabled ? `(1 + ${formatPercent(trace.vatRate)})` : fmt(eq.parts[1])}
                                  {' '}= <span className="font-bold text-primary">{fmt(eq.parts[2])}</span>
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </CollapsibleContent>
        </Collapsible>
    )
}

const rowTooltips: Record<string, string> = {
  'Revenue (Net)': 'Gross revenue adjusted for VAT settings.',
  'Cost per Session': 'Total paid media spend ÷ paid sessions.',
  'Conversion Rate (pp)': 'Transactions ÷ Sessions; absolute change in percentage points.',
  'AOV (Net)': 'Average order value after VAT adjustment.',
  'Gross Margin (pp)': 'Gross profit margin; absolute change in percentage points.',
  'Fixed OPEX': 'Fixed operating expenses for the period.',
  'Marketing Contribution': 'Gross Profit − Marketing Spend.',
  'Net Profit': 'Marketing Contribution − OPEX.',
};

const renderLabelWithTooltip = (label: string) => (
    <div className="flex items-center gap-2">
      <span>{label}</span>
      {rowTooltips[label] && (
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>{rowTooltips[label]}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );


export const ScenarioResultCard = ({ scenario, results, prevResults, onToggle, onDelete, onReorder, isFirst, isLast }: { 
    scenario: Scenario;
    results: CalculatedMetrics;
    prevResults: CalculatedMetrics;
    onToggle: (id: string, active: boolean) => void;
    onDelete: (id: string) => void;
    onReorder: (direction: 'up' | 'down') => void;
    isFirst: boolean;
    isLast: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const renderDelta = (label: string, currentValue: number | null, prevValue: number | null, isCurrency = true) => {
        if (currentValue === null || prevValue === null) return <p>N/A</p>;
        const delta = currentValue - prevValue;

        const isPp = label.includes('(pp)');
        const metricId = labelToMetricMap[label as keyof typeof labelToMetricMap] || 'netProfit';
        const good = isMetricPositive(metricId, delta);
        
        let displayValue;
        const isCentMetric = label === 'Cost per Session' || label === 'Blended CAC';
        
        if (!isPp && !isCentMetric && Math.abs(delta) < 1) {
            return <p className="text-muted-foreground">-</p>;
        }

        if(isPp) {
             displayValue = formatPP(delta);
        } else if (isCurrency) {
             displayValue = isCentMetric ? formatCurrencySmart(delta) : formatCurrencyEUR(delta);
        } else {
             displayValue = formatInteger(delta);
        }
        
        return (
            <p className={cn(delta !== 0 && (good ? "text-green-500" : "text-destructive"), "font-bold flex items-center gap-1 text-right")}>
                {delta !== 0 && (delta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                {displayValue.replace(/^[+-]/, '')}
            </p>
        );
    };
    
    const impactTableRows: {label: string, before: number, after: number, isCurrency: boolean, isPP?: boolean, isSeparator?: boolean, isInteger?: boolean }[] = useMemo(() => {
        const rows: {label: string, before: number, after: number, isCurrency: boolean, isPP?: boolean, isSeparator?: boolean, isInteger?: boolean }[] = [];
        const changedMetrics = scenario.changes.map(c => c.metric);

        const readTotals = (m: ChangeMetric, totals: CalculatedMetrics): number => {
            switch (m) {
                case 'CR': return totals.crBlended;
                case 'AOV': return totals.aovNet;
                case 'costPerSession': return totals.costPerSession;
                case 'sessions': return totals.business.sessionsTotal;
                case 'transactions': return totals.business.transactionsTotal;
                default: return NaN;
            }
        };

        // 1. Revenue
        rows.push({ label: 'Revenue (Net)', before: prevResults.revenueNet, after: results.revenueNet, isCurrency: true });
        
        // 2. Variables
        const variables: {label: string, metric: ChangeMetric, isPP?: boolean, isInteger?: boolean}[] = [
            { label: 'Cost per Session', metric: 'costPerSession' },
            { label: 'Conversion Rate (pp)', metric: 'CR', isPP: true },
            { label: 'AOV (Net)', metric: 'AOV' },
            { label: 'Sessions', metric: 'sessions', isInteger: true },
            { label: 'Transactions', metric: 'transactions', isInteger: true },
        ];
        
        variables.forEach(v => {
            if (changedMetrics.includes(v.metric)) {
                 rows.push({ 
                    label: v.label, 
                    before: readTotals(v.metric, prevResults),
                    after: readTotals(v.metric, results),
                    isCurrency: !v.isPP && !v.isInteger,
                    isPP: v.isPP,
                    isInteger: v.isInteger
                });
            }
        });
        
        if (changedMetrics.includes('grossMarginPct')) {
            rows.push({ 
                label: 'Gross Margin (pp)', 
                before: prevResults.business.grossMarginPct,
                after: results.business.grossMarginPct,
                isCurrency: false,
                isPP: true
            });
        }

        // 3. OPEX
        if (changedMetrics.includes('fixedOpex') || (scenario.cost?.kind === 'opex' && scenario.cost.totalPeriod !== 0)) {
           rows.push({ label: 'Fixed OPEX', before: prevResults.business.fixedOpex, after: results.business.fixedOpex, isCurrency: true });
        }

        // 4. Separator
        rows.push({label: 'separator', before: 0, after: 0, isCurrency: false, isSeparator: true});
        
        // 5. Results
        rows.push({ label: 'Marketing Contribution', before: prevResults.marketingContribution, after: results.marketingContribution, isCurrency: true });
        rows.push({ label: 'Net Profit', before: prevResults.netProfit, after: results.netProfit, isCurrency: true });
        
        return rows.filter((row, index, self) => 
            row.isSeparator || index === self.findIndex((r) => r.label === row.label)
        );

    }, [scenario, results, prevResults]);
    
    const deltaPills: { key: ChangeMetric; label: string; value: number; type: 'currency' | 'pp' }[] = useMemo(() => [
        { key: 'netProfit', label: 'Net Profit', value: results.netProfit - prevResults.netProfit, type: 'currency' },
        ...((results.totalMarketingCost - prevResults.totalMarketingCost !== 0) ? [{ key: 'totalMarketingCost' as ChangeMetric, label: 'Spend', value: results.totalMarketingCost - prevResults.totalMarketingCost, type: 'currency' as 'currency' | 'pp' }] : [])
    ], [results, prevResults]);

    const hasFixedOutput = results.channels.some(ch => ch.mode === 'fixedOutput' && ch.baseline && ch.baseline.sessions > 0);
    const onlyEfficiencyChange = scenario.changes.every(ch => ['costPerSession', 'CR', 'AOV', 'grossMarginPct'].includes(ch.metric));

    return (
        <Card className={cn(!scenario.active && "opacity-60")}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex-1 space-y-1">
                    <CardTitle className="text-xl">{scenario.name}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                        {deltaPills.map(pill => {
                            if (Math.abs(pill.value) < 1 && pill.type === 'currency') return null;
                            const good = isMetricPositive(pill.key, pill.value);
                            const colorClass = !scenario.active ? 'grayscale' 
                                : good ? "bg-green-800/50 text-green-200"
                                : "bg-red-800/50 text-red-200";
                            
                            const formattedValue = pill.type === 'pp' 
                                ? formatPP(pill.value)
                                : formatCurrencyEUR(pill.value);

                             return (
                               <Badge key={pill.key} variant="secondary" className={cn("font-normal", colorClass)}>
                                  <span className="flex items-center gap-1">
                                      {pill.value > 0 ? <ArrowUp className="w-3 h-3" /> : pill.value < 0 ? <ArrowDown className="w-3 h-3" /> : null}
                                      {formattedValue}
                                      {' '}
                                      {pill.label}
                                  </span>
                               </Badge>
                             )
                        })}
                         {hasFixedOutput && onlyEfficiencyChange && <Badge variant="outline">Fixed sources unchanged</Badge>}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <Button variant="outline" size="icon" className="w-6 h-6" onClick={() => onReorder('up')} disabled={isFirst || !scenario.active}><ArrowUp className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="w-6 h-6" onClick={() => onReorder('down')} disabled={isLast || !scenario.active}><ArrowDown className="w-4 h-4" /></Button>
                </div>
            </CardHeader>
             <CardContent className="p-4 pt-2 space-y-2">
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => setIsOpen(!isOpen)}><ChevronsUpDown className="w-4 h-4" /></Button>
                    <Tooltip><TooltipTrigger asChild>
                        <Switch checked={scenario.active} onCheckedChange={(checked) => onToggle(scenario.id, checked)} />
                    </TooltipTrigger><TooltipContent>{scenario.active ? 'Turn scenario off (keeps it for later)' : 'Turn scenario on'}</TooltipContent></Tooltip>
                    
                    <Tooltip><TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-6 h-6 text-muted-foreground hover:text-destructive" onClick={() => onDelete(scenario.id)}><Trash2 className="w-4 h-4" /></Button>
                    </TooltipTrigger><TooltipContent>Delete scenario</TooltipContent></Tooltip>
                    {!scenario.active && <Badge variant="outline">Disabled</Badge>}
                </div>

                {isOpen && (
                    <div className="space-y-2 pt-2">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Metric</TableHead>
                                    <TableHead className="text-right">Before</TableHead>
                                    <TableHead className="text-right">After</TableHead>
                                    <TableHead data-testid="scenario-delta-header" className="text-right">Δ vs Prev</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {impactTableRows.map((row, index) => {
                                    if(row.isSeparator) {
                                        return (
                                            <TableRow key={`sep-${index}`} data-testid="scenario-section-results">
                                                <TableCell colSpan={4}>
                                                    <Separator className="my-2" />
                                                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Results</div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    }
                                    return (
                                        <TableRow key={row.label}>
                                            <TableCell className="font-medium">{renderLabelWithTooltip(row.label)}</TableCell>
                                            <TableCell className="text-right">{row.isPP ? formatPercent(row.before) : row.isInteger ? formatInteger(row.before) : (row.label === 'Cost per Session' ? formatCurrencySmart(row.after) : formatCurrencyEUR(row.before))}</TableCell>
                                            <TableCell className="text-right">{row.isPP ? formatPercent(row.after) : row.isInteger ? formatInteger(row.after) : (row.label === 'Cost per Session' ? formatCurrencySmart(row.after) : formatCurrencyEUR(row.after))}</TableCell>
                                            <TableCell className="text-right">{renderDelta(row.label, row.after, row.before, !row.isPP && !row.isInteger)}</TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
