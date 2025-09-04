
"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';

export default function Step5FixedOpex() {
  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <Label htmlFor="opex" className="text-xl text-center block">
        What are your fixed operating costs for the last 12 months?
      </Label>
      <Input
        id="opex"
        type="text"
        inputMode="decimal"
        placeholder="e.g., 300,000"
        className="text-2xl h-14 text-center"
      />
      <p className="text-sm text-muted-foreground text-center">
        Include salaries, rent, and other fixed overhead. Do not include marketing spend.
      </p>
      
      <Accordion type="single" collapsible className="w-full pt-4">
        <AccordionItem value="item-1">
          <AccordionTrigger>Optional: VAT & Currency</AccordionTrigger>
          <AccordionContent className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="includes-vat" defaultChecked />
              <Label htmlFor="includes-vat">My sales revenue includes VAT</Label>
            </div>
            <div className="space-y-1">
                <Label htmlFor="vat-rate">VAT Rate (%)</Label>
                <Input id="vat-rate" defaultValue="23" />
            </div>
            {/* TODO: Add currency dropdown */}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
