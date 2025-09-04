
"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface Step6TemplateInputsProps {
    templateId: string | null;
}

// TODO: Replace with a proper component structure and state management
function renderInputsForTemplate(templateId: string | null) {
    switch (templateId) {
        case 'increase-budget':
            return (
                <div className="space-y-8">
                    <div>
                        <Label htmlFor="current-budget" className="text-lg">Current marketing budget (LTM)</Label>
                        <Input id="current-budget" placeholder="e.g., 100,000" />
                    </div>
                    <div>
                        <Label htmlFor="budget-change" className="text-lg">Planned budget change</Label>
                        <Slider defaultValue={[20]} max={200} step={5} />
                        <p className="text-center font-bold text-primary text-lg">+20%</p>
                    </div>
                    <div>
                        <Label htmlFor="cps-change" className="text-lg">Expected CPS change (cost per session)</Label>
                        <Slider defaultValue={[0]} min={-50} max={50} step={5} />
                         <p className="text-center font-bold text-primary text-lg">0%</p>
                    </div>
                </div>
            );
        case 'improve-cr':
             return (
                <div>
                    <Label htmlFor="cr-lift" className="text-lg">Expected CR lift</Label>
                    <Slider defaultValue={[10]} max={100} step={1} />
                    <p className="text-center font-bold text-primary text-lg">+10%</p>
                </div>
            );
        // TODO: Add other templates
        default:
            return <p>Please select a template first.</p>;
    }
}

export default function Step6TemplateInputs({ templateId }: Step6TemplateInputsProps) {
    return (
        <div className="space-y-4 max-w-lg mx-auto text-center">
            <h2 className="text-xl font-semibold">Define Your What-If Scenario</h2>
            <div className="pt-4 text-left">
                {renderInputsForTemplate(templateId)}
            </div>
             {/* TODO: Add P/R/O band selector */}
        </div>
    );
}
