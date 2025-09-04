
import { Suspense } from 'react';
import WizardStepper from './_components/WizardStepper';

// TODO: Implement Firebase Remote Config to fetch this value.
const isWizardEnabled = true; 

export default function WizardPage() {
  if (!isWizardEnabled) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Coming Soon!
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Our new What-If Wizard is under construction. Check back later for powerful new ways to model your business.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<div>Loading Wizard...</div>}>
        <WizardStepper />
      </Suspense>
    </main>
  );
}
