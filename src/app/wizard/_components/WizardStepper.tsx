
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Step1Intro from './Step1Intro';
import Step2Revenue from './Step2Revenue';
import Step3Sessions from './Step3Sessions';
import Step4GrossMargin from './Step4GrossMargin';
import Step5FixedOpex from './Step5FixedOpex';
import Step6TemplateInputs from './Step6TemplateInputs';
import Step7Results from './Step7Results';
import { Progress } from '@/components/ui/progress';

// TODO: Define a proper state management solution (e.g., useReducer or Zustand)
// to handle wizard inputs and calculated results across steps.

const totalSteps = 7;

export default function WizardStepper() {
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState<string | null>(null);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));
  
  const selectTemplate = (templateId: string) => {
    setTemplate(templateId);
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
        return <Step6TemplateInputs templateId={template} />;
      case 7:
        return <Step7Results />;
      default:
        return <Step1Intro onSelectTemplate={selectTemplate} />;
    }
  };

  return (
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
  );
}
