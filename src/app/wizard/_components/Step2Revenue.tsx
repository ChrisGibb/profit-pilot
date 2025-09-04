
"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function Step2Revenue() {
  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Label htmlFor="revenue" className="text-xl text-center block">
        What was your total sales in the last 12 months?
      </Label>
      <Input
        id="revenue"
        type="text"
        inputMode="decimal"
        placeholder="e.g., 1,250,000"
        className="text-2xl h-14 text-center"
      />
      <p className="text-sm text-muted-foreground text-center">
        Rough is fine. You can round. This should include any sales tax (VAT).
      </p>
    </div>
  );
}
