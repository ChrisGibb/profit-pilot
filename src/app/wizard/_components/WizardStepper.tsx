
"use client";

import React, { useState, useReducer } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Step1Intro from './Step1Intro';
import Step2Revenue from './Step2Revenue';
import Step3Sessions from './Step3Sessions';
import Step4GrossMargin from './Step4GrossMargin';
import Step5FixedOpex from './Step5FixedOpex';
import Step6TemplateInputs from './Step6TemplateInputs';
import Step7Results from './Step7Results';
import { Progress } from '@/components/ui/progress';

// TODO: Move to a separate file
interface WizardState {
    template: string | null;
    inputs: {
        revenueGrossLTM: number;
        sessionsLTM: number;
        grossMarginPct: number;
        fixedOpexLTM: number;
    };
    settings: {
        revenueIncludesVat: boolean;
        vatRate: number;
    };
}

type WizardAction =
  | { type: 'SET_TEMPLATE'; payload: string }
  | { type: 'SET_INPUT'; payload: { field: keyof WizardState['inputs']; value: number } }
  | { type: 'SET_SETTING'; payload: { field: keyof WizardState['settings']; value: any } };

const initialState: WizardState = {
    template: null,
    inputs: {
        revenueGrossLTM: 1000000,
        sessionsLTM: 500000,
        grossMarginPct: 0.55,
        fixedOpexLTM: 200000,
    },
    settings: {
        revenueIncludesVat: true,
        vatRate: 0.23
    }
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
    switch (action.type) {
        case 'SET_TEMPLATE':
            return { ...state, template: action.payload };
        case 'SET_INPUT':
            return { ...state, inputs: { ...state.inputs, [action.payload.field]: action.payload.value } };
        case 'SET_SETTING':
            return { ...state, settings: { ...state.settings, [action.payload.field]: action.payload.value } };
        default:
            return state;
    }
}

export const WizardContext = React.createContext<{
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
} | null>(null);


const totalSteps = 7;

export default function WizardStepper() {
  const [step, setStep] = useState(1);
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));
  
  const selectTemplate = (templateId: string) => {
    dispatch({ type: 'SET_TEMPLATE', payload: templateId });
    handleNext();
  }

  const progress = (step / totalSteps) * 100;

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Intro onSelectTemplate={selectTemplate} />;
      case 2:
        return <Step2Revenue />;
      case 3:
        return <Step3Sessions />;
      case 4:
        return <Step4GrossMargin />;
      case 5:
        return <Step5FixedOpex />;
      case 6:
        return <Step6TemplateInputs templateId={state.template} />;
      case 7:
        return <Step7Results />;
      default:
        return <Step1Intro onSelectTemplate={selectTemplate} />;
    }
  };

  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Step {step} of {totalSteps}
            </p>
        </div>

        <Card>
          <CardContent className="p-6 md:p-8">
              {renderStep()}
          </CardContent>
        </Card>
        
        <div className="mt-8 flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : <div />}
          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ): null}
        </div>
      </div>
    </WizardContext.Provider>
  );
}
