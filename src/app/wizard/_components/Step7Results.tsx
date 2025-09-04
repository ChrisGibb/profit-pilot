
"use client";

import { ResultCard } from './ResultCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// TODO: This is a placeholder. Wire up to the profit engine.
const mockResults = {
    marketingContribution: { delta: 50000 },
    netProfit: { delta: 45000 },
};

export default function Step7Results() {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Your Results</h1>
                <p className="text-muted-foreground mt-2">Based on your inputs, here is the projected impact.</p>
            </div>
            
            <ResultCard results={mockResults} />

            <div className="max-w-lg mx-auto pt-8 border-t">
                <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold">Get the Full Report</h3>
                    <p className="text-muted-foreground">We'll send a detailed, server-verified breakdown to your inbox.</p>
                </div>
                <div className="mt-6 space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="you@company.com" />
                    </div>
                    <Button className="w-full" size="lg">
                        Send My Report
                    </Button>
                </div>
            </div>
        </div>
    );
}
