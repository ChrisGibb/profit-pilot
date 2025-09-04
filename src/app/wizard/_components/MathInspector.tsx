
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Code2 } from 'lucide-react';

// TODO: Replace with actual trace from profit-engine
const mockTrace = {
  inputs: { revenue: 1000000, sessions: 500000 },
  derived: { aov: 2, cr: 0.05 },
  results: { netProfit: 150000 },
};

export default function MathInspector() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
            <Code2 className="mr-2" />
            Show Calculation Trace
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Calculation Trace</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <pre className="p-4 rounded-md bg-muted text-foreground text-sm">
            {JSON.stringify(mockTrace, null, 2)}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
