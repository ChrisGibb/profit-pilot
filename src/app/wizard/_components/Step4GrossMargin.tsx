
"use client";

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export default function Step4GrossMargin() {
  const [value, setValue] = useState(55);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <Label htmlFor="gross-margin" className="text-xl text-center block">
        What’s your gross margin?
      </Label>
      <div className="relative">
          <Input
            id="gross-margin"
            type="text"
            inputMode="numeric"
            value={`${value}%`}
            readOnly
            className="text-2xl h-14 text-center text-primary font-bold"
          />
      </div>
      <Slider
        value={[value]}
        onValueChange={(vals) => setValue(vals[0])}
        max={100}
        step={1}
        className="w-full"
      />
      <p className="text-sm text-muted-foreground text-center">
        (Revenue - Cost of Goods Sold) / Revenue. This should not include marketing or fixed costs.
      </p>
    </div>
  );
}
