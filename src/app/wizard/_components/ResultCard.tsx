
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowUp } from 'lucide-react';
import { formatCurrencyEUR } from '@/lib/formatting';

// TODO: This is a placeholder component.
interface ResultCardProps {
    results: {
        marketingContribution: { delta: number };
        netProfit: { delta: number };
    };
}

const ResultMetric = ({ label, value }: { label: string; value: number }) => (
    <div className="p-6 rounded-lg bg-muted flex flex-col items-center justify-center text-center">
        <div className="flex items-center gap-2 text-green-500">
            <ArrowUp className="w-6 h-6" />
            <span className="text-3xl md:text-4xl font-bold">
                {formatCurrencyEUR(value)}
            </span>
        </div>
        <p className="text-sm uppercase tracking-wider text-muted-foreground mt-2">{label}</p>
    </div>
);

export function ResultCard({ results }: ResultCardProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResultMetric label="Marketing Contribution" value={results.marketingContribution.delta} />
            <ResultMetric label="Net Profit" value={results.netProfit.delta} />
        </div>
    );
}
