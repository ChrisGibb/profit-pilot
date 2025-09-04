
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Scenario, ScenarioChange, ChangeMetric, ActiveBand, ScenarioScope, impactableMetricsByScope, changeMetricLabel } from '@/lib/types';
import { Checkbox } from './ui/checkbox';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, DraftingCompass, LineChart, Target } from 'lucide-react';

interface ScenarioFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scenario: Scenario | null;
  onSave: (scenario: Scenario) => void;
}

const steps = ['Basics', 'Scope', 'Metrics', 'Values'];

const getNewScenario = (): Scenario => ({
    id: `scen_${Date.now()}`,
    projectId: "proj_1",
    name: "",
    description: "",
    active: true,
    cost: {
      kind: 'opex',
      totalPeriod: 0
    },
    scope: 'global',
    activeBand: "R",
    changes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
});

const formatNumberForDisplay = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (isNaN(val) || val === null) return '0';
    
    // Check if it's a decimal and format accordingly
    if (val.toString().includes('.')) {
        return val.toString().replace('.', ',');
    }

    return new Intl.NumberFormat("de-DE").format(val);
};

const parseFormattedNumber = (val: string): number => {
    if (val.trim() === '' || val.trim() === '-') return 0;
    const cleaned = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned);
};


export function ScenarioFormDialog({ open, onOpenChange, scenario: initialScenario, onSave }: ScenarioFormDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [scenario, setScenario] = useState<Scenario>(getNewScenario());

  useEffect(() => {
    if (open) {
        const newScenario = initialScenario ? JSON.parse(JSON.stringify(initialScenario)) : getNewScenario();
        // Migration for legacy cost structure
        if ((newScenario as any).costOneOff || (newScenario as any).costMonthly) {
            newScenario.cost = {
                kind: 'opex',
                totalPeriod: ((newScenario as any).costOneOff || 0) + ((newScenario as any).costMonthly || 0) * 12
            };
            delete (newScenario as any).costOneOff;
            delete (newScenario as any).costMonthly;
        }
        if (!newScenario.cost) {
            newScenario.cost = { kind: 'opex', totalPeriod: 0 };
        }
        setScenario(newScenario);
        setCurrentStep(0);
    }
  }, [initialScenario, open]);

  const handleNext = () => {
      if (currentStep === 2) { // After selecting metrics
        const currentMetricIds = new Set(scenario.changes.map(c => c.metric));
        const availableMetrics = impactableMetricsByScope[scenario.scope] || [];
        
        // Filter out changes for metrics that are no longer selected
        const newChanges = scenario.changes.filter(c => availableMetrics.some(m => m.id === c.metric));

        // Add new changes for newly selected metrics
        availableMetrics.forEach(metric => {
            if (currentMetricIds.has(metric.id) && !newChanges.some(c => c.metric === metric.id)) {
                 newChanges.push({
                    metric: metric.id,
                    scope: scenario.scope,
                    mode: 'relative',
                    values: { P: 0, R: 0, O: 0 }
                });
            }
        });

        setScenario(prev => ({...prev, changes: newChanges}));
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  }
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSave = () => {
    onSave(scenario);
    onOpenChange(false);
  };
  
  const handleChangesUpdate = (newChanges: ScenarioChange[]) => {
      setScenario(prev => ({...prev, changes: newChanges}));
  }
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <Step1Basics scenario={scenario} setScenario={setScenario} />;
      case 1:
        return <Step2Scope scenario={scenario} setScenario={setScenario} />;
      case 2:
        return <Step3Metrics scenario={scenario} onChangesUpdate={handleChangesUpdate} />;
      case 3:
        return <Step4Values scenario={scenario} onChangesUpdate={handleChangesUpdate} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setScenario(getNewScenario());
            setCurrentStep(0);
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initialScenario?.name ? 'Edit Scenario' : 'Create New Scenario'}</DialogTitle>
          <div className="flex items-center gap-4 pt-2">
            {steps.map((step, index) => (
                <React.Fragment key={step}>
                    <div className="flex items-center gap-2">
                         <div className={cn(
                             "w-6 h-6 rounded-full flex items-center justify-center text-sm",
                             index === currentStep ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                             index < currentStep && "bg-green-600 text-white"
                         )}>
                             {index < currentStep ? <CheckCircle2 size={16}/> : index + 1}
                         </div>
                         <span className={cn(index === currentStep ? "font-bold text-primary" : "text-muted-foreground")}>{step}</span>
                    </div>
                    {index < steps.length - 1 && <Separator className="flex-1" />}
                </React.Fragment>
            ))}
          </div>
        </DialogHeader>

        <div className="my-4 min-h-[40vh]">{renderStepContent()}</div>

        <DialogFooter>
          <div className="w-full flex justify-between">
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={handleBack}>
                Back
              </Button>
            ) : <div></div>}
            <div className='flex gap-2'>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button onClick={handleSave}>Save Scenario</Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


const Step1Basics = ({ scenario, setScenario }: { scenario: Scenario, setScenario: (s: Scenario) => void }) => {
    return (
        <div className="space-y-6">
            <div>
                <Label htmlFor="name">Scenario Name</Label>
                <Input id="name" value={scenario.name} onChange={e => setScenario({...scenario, name: e.target.value})} />
            </div>
            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={scenario.description} onChange={e => setScenario({...scenario, description: e.target.value})} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Scenario Cost (12-month total)</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <Input 
                        type="text" 
                        value={formatNumberForDisplay(scenario.cost.totalPeriod)} 
                        onChange={e => setScenario({...scenario, cost: {...scenario.cost, totalPeriod: parseFormattedNumber(e.target.value)} })}
                    />
                    <RadioGroup 
                        value={scenario.cost.kind} 
                        onValueChange={(val) => setScenario({...scenario, cost: {...scenario.cost, kind: val as 'budget' | 'opex' }})}
                        className="flex gap-4"
                    >
                        <div className="flex items-center space-x-2">
                           <RadioGroupItem value="budget" id="budget" />
                           <Label htmlFor="budget">Add to Marketing Budget</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                           <RadioGroupItem value="opex" id="opex" />
                           <Label htmlFor="opex">Add to Marketing OPEX</Label>
                        </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground">
                        {scenario.cost.kind === 'budget' 
                           ? "e.g., media spend, linkbuilding, content creation. This will be added to Total Marketing Spend."
                           : "e.g., agency fees, team costs, tools. This will be added to Fixed Operating Expenses."
                        }
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

const Step2Scope = ({ scenario, setScenario }: { scenario: Scenario, setScenario: (s: Scenario) => void }) => {
    const scopes: {id: ScenarioScope, name: string, description: string, icon: React.ElementType}[] = [
        { id: 'global', name: 'Global', description: 'Affects multiple areas of the business.', icon: LineChart },
        { id: 'opex', name: 'OPEX', description: 'Changes to fixed operating costs.', icon: DraftingCompass },
        { id: 'channel:meta', name: 'Meta Ads', description: 'Changes specific to Meta Ads.', icon: Target },
        { id: 'channel:google', name: 'Google Ads', description: 'Changes specific to Google Ads.', icon: Target },
        { id: 'channel:tiktok', name: 'TikTok Ads', description: 'Changes specific to TikTok Ads.', icon: Target },
        { id: 'channel:seo', name: 'SEO', description: 'Changes specific to SEO efforts.', icon: Target },
        { id: 'channel:automation', name: 'Automation', description: 'Changes from marketing automation.', icon: Target },
        { id: 'channel:other', name: 'Other', description: 'Changes for any other channel.', icon: Target },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {scopes.map(scope => (
                <Card 
                    key={scope.id} 
                    className={cn(
                        "p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                        scenario.scope === scope.id ? "border-primary ring-2 ring-primary shadow-lg" : "hover:shadow-md"
                    )}
                    onClick={() => setScenario({ ...scenario, scope: scope.id, changes: [] })}
                >
                    <scope.icon className={cn("w-12 h-12 mb-2", scenario.scope === scope.id ? "text-primary" : "text-muted-foreground")} />
                    <p className="font-semibold">{scope.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{scope.description}</p>
                </Card>
            ))}
        </div>
    )
}

const Step3Metrics = ({ scenario, onChangesUpdate }: { scenario: Scenario, onChangesUpdate: (c: ScenarioChange[]) => void }) => {
    const availableMetrics = impactableMetricsByScope[scenario.scope] || [];
    
    const handleMetricToggle = (metricId: ChangeMetric, isChecked: boolean) => {
        let newChanges = [...scenario.changes];
        const isCurrentlyChecked = newChanges.some(c => c.metric === metricId);

        if (isChecked && !isCurrentlyChecked) {
            newChanges.push({
                metric: metricId,
                scope: scenario.scope,
                mode: 'relative',
                values: { P: 0, R: 0, O: 0 }
            });
        } else if (!isChecked) {
            newChanges = newChanges.filter(c => c.metric !== metricId);
        }

        onChangesUpdate(newChanges);
    }
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {availableMetrics.map(metric => {
                const isChecked = scenario.changes.some(c => c.metric === metric.id);
                return (
                    <Card
                        key={metric.id}
                        className={cn("p-4 cursor-pointer", isChecked && "border-primary ring-2 ring-primary")}
                        onClick={() => handleMetricToggle(metric.id as ChangeMetric, !isChecked)}
                    >
                        <div className="flex items-center space-x-2">
                             <Checkbox 
                                id={`${scenario.scope}-${metric.id}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => handleMetricToggle(metric.id as ChangeMetric, !!checked)}
                            />
                            <Label htmlFor={`${scenario.scope}-${metric.id}`} className="font-semibold">{metric.label}</Label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
                    </Card>
                )
            })}
        </div>
    )
}

const Step4Values = ({ scenario, onChangesUpdate }: { scenario: Scenario, onChangesUpdate: (c: ScenarioChange[]) => void }) => {
    const [autoFill, setAutoFill] = useState(true);

    const handleValueChange = (changeIndex: number, band: ActiveBand, valueStr: string) => {
        const newChanges = [...scenario.changes];
        const change = {...newChanges[changeIndex]};
        change.values = { ...change.values };
        
        const numValue = parseFormattedNumber(valueStr);
        
        if (isNaN(numValue) && valueStr.trim() !== '' && valueStr.trim() !== '-') {
             return;
        }

        change.values[band] = isNaN(numValue) ? 0 : numValue;

        if (autoFill && band === 'R') {
            change.values.P = numValue * 0.75;
            change.values.O = numValue * 1.25;
        }

        newChanges[changeIndex] = change;
        onChangesUpdate(newChanges);
    };

    const handleModeChange = (changeIndex: number, mode: 'relative' | 'absolute') => {
        const newChanges = [...scenario.changes];
        newChanges[changeIndex].mode = mode;
        onChangesUpdate(newChanges);
    }

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="flex items-center space-x-2">
                <Checkbox id="autofill-variants" checked={autoFill} onCheckedChange={checked => setAutoFill(!!checked)} />
                <Label htmlFor="autofill-variants">Auto-fill Pessimistic/Optimistic variants based on Realistic</Label>
            </div>
            <p className="text-sm text-muted-foreground">
                Define the expected impact for each metric. Use negative values for decreases (e.g., -15% or -5000).
            </p>
            <Separator />
            {scenario.changes.map((change, index) => (
                <Card key={index} className="p-4">
                    <div className="w-full">
                        <div className="flex justify-between items-center mb-4">
                            <Label className="font-semibold">{changeMetricLabel[change.metric]}</Label>
                            <RadioGroup defaultValue={change.mode} onValueChange={(val) => handleModeChange(index, val as any)} className="flex">
                                <div className="flex items-center space-x-2"><RadioGroupItem value="relative" id={`rel-${index}`} /><Label htmlFor={`rel-${index}`}>%</Label></div>
                                <div className="flex items-center space-x-2"><RadioGroupItem value="absolute" id={`abs-${index}`} /><Label htmlFor={`abs-${index}`}>Abs</Label></div>
                            </RadioGroup>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {['P', 'R', 'O'].map((band) => (
                                <div key={band}>
                                    <Label className="text-xs text-muted-foreground">{ {P: 'Pessimistic', R: 'Realistic', O: 'Optimistic'}[band as ActiveBand]}</Label>
                                    <Input 
                                        type="text" 
                                        value={formatNumberForDisplay(change.values[band as ActiveBand])}
                                        onChange={e => handleValueChange(index, band as ActiveBand, e.target.value)}
                                        className={cn(band === 'R' && "border-primary")}
                                    />
                                </div>
                            ))}
                        </div>
                     </div>
                </Card>
            ))}
        </div>
    )
}
