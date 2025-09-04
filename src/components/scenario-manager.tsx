
"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "./ui/button";
import { PlusCircleIcon, EditIcon, Trash2Icon, ArrowUp, ArrowDown, Undo2Icon } from "lucide-react";
import type { Scenario, ScenarioChange, ChangeMetric, ActiveBand } from "@/lib/types";
import { isMetricPositive, metricMeta, formatDelta } from "@/lib/types";
import { ScenarioFormDialog } from "./scenario-form-dialog";
import { Switch } from "./ui/switch";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils";
import { suffixFor, roundAwayFromZero } from "@/lib/formatters";

const baseScenarios: Omit<Scenario, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'active' | 'activeBand'>[] = [
    {
        name: "Tracking & Analytics Fix",
        description: "Align purchases between ERP/CRM, GA4, and ad systems so ad platforms learn from correct data—driving CAC even lower. Get clear, reliable numbers—no more blind spots.",
        cost: { kind: 'opex', totalPeriod: 5000 },
        scope: 'global',
        changes: [{ metric: 'costPerSession', scope: 'global', mode: 'relative', values: { P: -7.5, R: -10, O: -12.5 } }]
    },
    {
        name: "Conversion Rate Optimization",
        description: "Turn more visitors into buyers. Quick wins that boost sales without extra ad spend.",
        cost: { kind: 'opex', totalPeriod: 3000 },
        scope: 'global',
        changes: [{ metric: 'CR', scope: 'global', mode: 'relative', values: { P: 7.5, R: 10, O: 12.5 } }]
    },
    {
        name: "SEO Fix",
        description: "Bring in more free traffic from Google. Remove barriers holding your site back so your best pages rank higher.",
        cost: { kind: 'opex', totalPeriod: 4000 },
        scope: 'channel:seo',
        changes: [{ metric: 'sessions', scope: 'channel:seo', mode: 'relative', values: { P: 7.5, R: 10, O: 12.5 } }]
    },
    {
        name: "Marketing Automation Fix",
        description: "Introduction of 4 basic automations: welcome flow, abandoned basket, abandoned view, win-back.",
        cost: { kind: 'opex', totalPeriod: 2500 },
        scope: 'global',
        changes: [{ metric: 'transactions', scope: 'global', mode: 'relative', values: { P: 7.5, R: 10, O: 12.5 } }]
    },
    {
        name: "Google Ads Optimization",
        description: "Optimize Google Ads campaigns for higher ROAS.",
        cost: { kind: 'opex', totalPeriod: 1000 },
        scope: 'channel:google',
        changes: [
            { metric: 'budget', scope: 'channel:google', mode: 'relative', values: { P: 7.5, R: 10, O: 12.5 } },
            { metric: 'transactions', scope: 'channel:google', mode: 'relative', values: { P: 7.5, R: 10, O: 12.5 } }
        ]
    },
    {
        name: "Meta Ads Optimization",
        description: "Optimize Meta Ads campaigns for higher ROAS.",
        cost: { kind: 'opex', totalPeriod: 1000 },
        scope: 'channel:meta',
        changes: [
            { metric: 'budget', scope: 'channel:meta', mode: 'relative', values: { P: 7.5, R: 10, O: 12.5 } },
            { metric: 'transactions', scope: 'channel:meta', mode: 'relative', values: { P: 7.5, R: 10, O: 12.5 } }
        ]
    },
     {
        name: "TikTok Ads Optimization",
        description: "Optimize TikTok Ads campaigns for higher ROAS.",
        cost: { kind: 'opex', totalPeriod: 1000 },
        scope: 'channel:tiktok',
        changes: [
            { metric: 'budget', scope: 'channel:tiktok', mode: 'relative', values: { P: 7.5, R: 10, O: 12.5 } },
            { metric: 'transactions', scope: 'channel:tiktok', mode: 'relative', values: { P: 7.5, R: 10, O: 12.5 } }
        ]
    },
    {
        name: "Cost Optimization",
        description: "Reduce variable costs and OPEX to improve Gross Margin and profitability.",
        cost: { kind: 'opex', totalPeriod: 0 },
        scope: 'global',
        changes: [
            { metric: 'fixedOpex', scope: 'opex', mode: 'relative', values: { P: -7.5, R: -10, O: -12.5 } },
            { metric: 'grossMarginPct', scope: 'global', mode: 'absolute', values: { P: 1, R: 2, O: 3 } }
        ]
    },
];

const getNewScenario = (): Scenario => ({
    id: `scen_${Date.now()}`,
    projectId: "proj_1",
    name: "",
    description: "",
    active: true,
    cost: {
        kind: 'opex',
        totalPeriod: 0,
    },
    scope: 'global',
    activeBand: "R",
    changes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});

const ScenarioImpactChip = ({
  metricId,
  value,
  mode,
}: { metricId: ChangeMetric; value: number; mode: 'relative'|'absolute' }) => {
  const m = metricMeta[metricId];
  if (!m) return null;

  const { good, suffix } = formatDelta(metricId, value, mode);
  
  const displayVal = roundAwayFromZero(value);


  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-xs font-medium inline-flex items-center gap-1',
        good ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
      )}
      title={`${m.label}: ${displayVal}${suffix}`}
      aria-label={`${m.label}: ${displayVal}${suffix} ${good ? 'good' : 'bad'}`}
    >
      <span className="font-semibold">{m.label}:</span>
      <span>
        {displayVal > 0 ? '+' : ''}{displayVal}{suffix}
      </span>
    </span>
  );
}


interface ScenarioManagerProps {
    scenarios: Scenario[];
    onScenariosChange: (scenarios: Scenario[]) => void;
    deletedScenarios: Scenario[];
    onDeletedScenariosChange: (scenarios: Scenario[]) => void;
    globalActiveBand: ActiveBand | 'Individual';
    onGlobalActiveBandChange: (band: ActiveBand | 'Individual') => void;
}

export function ScenarioManager({ scenarios, onScenariosChange, deletedScenarios, onDeletedScenariosChange, globalActiveBand, onGlobalActiveBandChange }: ScenarioManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);

  const handleAddNew = () => {
    setEditingScenario(null);
    setIsFormOpen(true);
  }

  const handleEdit = (scenario: Scenario) => {
    setEditingScenario(scenario);
    setIsFormOpen(true);
  }

  const handleDelete = (id: string) => {
    const scenarioToDelete = scenarios.find(s => s.id === id);
    if (scenarioToDelete) {
        onDeletedScenariosChange([...deletedScenarios, scenarioToDelete]);
    }
    onScenariosChange(scenarios.filter(s => s.id !== id));
  }

   const handleRestoreScenario = () => {
    if (deletedScenarios.length === 0) return;
    const newDeleted = [...deletedScenarios];
    const scenarioToRestore = newDeleted.pop();
    if (scenarioToRestore) {
        onScenariosChange([...scenarios, scenarioToRestore]);
        onDeletedScenariosChange(newDeleted);
    }
  };
  
  const handleToggle = (id: string, active: boolean) => {
    console.info('scenario_toggled', {id, active});
    onScenariosChange(scenarios.map(s => s.id === id ? {...s, active} : s));
  }
  
  const handleBandChange = (id: string, band: ActiveBand) => {
    const newScenarios = scenarios.map(s => {
      if (s.id === id) {
        return { ...s, activeBand: band };
      }
      return s;
    });
    onScenariosChange(newScenarios);
  };
  
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newScenarios = [...scenarios];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newScenarios.length) return;
    [newScenarios[index], newScenarios[newIndex]] = [newScenarios[newIndex], newScenarios[index]];
    console.info('scenario_reordered', {from: index, to: newIndex});
    onScenariosChange(newScenarios);
  };

  const handleSave = (scenarioToSave: Scenario) => {
    const exists = scenarios.some(s => s.id === scenarioToSave.id);
    if (exists) {
        onScenariosChange(scenarios.map(s => s.id === scenarioToSave.id ? { ...scenarioToSave, updatedAt: new Date().toISOString() } : s));
    } else {
        onScenariosChange([...scenarios, scenarioToSave]);
    }
  }

  const handleActivateTemplate = (template: Omit<Scenario, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'active' | 'activeBand'>) => {
    const newScenario: Scenario = {
        ...getNewScenario(),
        ...template,
        name: `${template.name}`
    };
    handleSave(newScenario);
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle className="font-headline text-2xl">Scenario Simulation</CardTitle>
                    <CardDescription>
                        Scenarios are applied sequentially. Changes from one scenario will compound on top of the next. Use the arrows to change the order.
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    {deletedScenarios.length > 0 && (
                         <Button variant="outline" onClick={handleRestoreScenario}>
                            <Undo2Icon className="mr-2 h-4 w-4" />
                            Restore Scenario
                        </Button>
                    )}
                    <Button onClick={handleAddNew}>
                        <PlusCircleIcon className="mr-2 h-4 w-4" />
                        New Scenario
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <Label>Global Estimation Level</Label>
                   <RadioGroup 
                        value={globalActiveBand}
                        onValueChange={(val) => onGlobalActiveBandChange(val as any)}
                        className="flex items-center space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="P" id="P" />
                        <Label htmlFor="P">Pessimistic</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="R" id="R" />
                        <Label htmlFor="R">Realistic</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="O" id="O" />
                        <Label htmlFor="O">Optimistic</Label>                      </div>
                       <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Individual" id="Ind" />
                        <Label htmlFor="Ind">Individual</Label>
                      </div>
                   </RadioGroup>
                </CardContent>
              </Card>

              {scenarios.map((scenario, index) => (
                <Card key={scenario.id} className={cn(!scenario.active && "opacity-50")}>
                    <CardContent className="p-4 flex items-center justify-between">
                         <div className="flex flex-col gap-1">
                            <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                                <ArrowUp className="w-4 h-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="w-6 h-6" onClick={() => handleMove(index, 'down')} disabled={index === scenarios.length - 1}>
                                <ArrowDown className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex-1 space-y-1 ml-4">
                            <p className="font-semibold">{scenario.name}</p>
                            <p className="text-sm text-muted-foreground">{scenario.description}</p>
                            <div className="flex items-center gap-1 pt-1 flex-wrap">
                                <span className="text-xs text-primary mr-1">Impacts:</span>
                                {scenario.changes.map((change) => {
                                    const bandToUse = globalActiveBand === 'Individual' ? scenario.activeBand : globalActiveBand;
                                    const value = change.values[bandToUse];
                                    return <ScenarioImpactChip key={`${change.scope}-${change.metric}`} metricId={change.metric} value={value} mode={change.mode} />
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-40">
                             <Select 
                                value={scenario.activeBand}
                                onValueChange={(val) => handleBandChange(scenario.id, val as ActiveBand)}
                                disabled={globalActiveBand !== 'Individual'}
                             >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select confidence" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="P">Pessimistic</SelectItem>
                                  <SelectItem value="R">Realistic</SelectItem>
                                  <SelectItem value="O">Optimistic</SelectItem>
                                </SelectContent>
                              </Select>
                          </div>
                           <Switch checked={scenario.active} onCheckedChange={(checked) => handleToggle(scenario.id, checked)} />
                           <Button variant="ghost" size="icon" onClick={() => handleEdit(scenario)}>
                                <EditIcon className="w-4 h-4"/>
                           </Button>
                           <Button variant="ghost" size="icon" onClick={() => handleDelete(scenario.id)}>
                                <Trash2Icon className="w-4 h-4 text-destructive"/>
                           </Button>
                        </div>
                    </CardContent>
                </Card>
              ))}

            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Scenario Templates</CardTitle>
                <CardDescription>
                    Use these pre-built scenarios as a starting point for your analysis.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {baseScenarios.map((scenarioTemplate, index) => {
                      const isActivated = scenarios.some(s => s.name === scenarioTemplate.name);
                      return (
                        <Card key={index} className={cn("flex flex-col", isActivated && "bg-muted/50")}>
                            <CardHeader>
                                <CardTitle className="text-base">{scenarioTemplate.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-sm text-muted-foreground">{scenarioTemplate.description}</p>
                            </CardContent>
                            <div className="p-4 pt-0">
                                <Button 
                                  variant="secondary" 
                                  className="w-full" 
                                  onClick={() => handleActivateTemplate(scenarioTemplate)}
                                  disabled={isActivated}
                                >
                                  {isActivated ? 'Activated' : 'Activate Scenario'}
                                </Button>
                            </div>
                        </Card>
                      )
                    })}
                </div>
            </CardContent>
        </Card>

        {isFormOpen && (
            <ScenarioFormDialog 
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                scenario={editingScenario}
                onSave={handleSave}
            />
        )}
    </div>
  );
}
