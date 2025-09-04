
"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function Step3Sessions() {
  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Label htmlFor="sessions" className="text-xl text-center block">
        How many website sessions did you have in the last 12 months?
      </Label>
      <Input
        id="sessions"
        type="text"
        inputMode="numeric"
        placeholder="e.g., 870,000"
        className="text-2xl h-14 text-center"
      />
      <p className="text-sm text-muted-foreground text-center">
        You can find this in Google Analytics (Audience &gt; Overview).
      </p>
    </div>
  );
}
