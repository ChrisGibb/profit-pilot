
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, TrendingUp, Search, DollarSign } from 'lucide-react';

interface Step1IntroProps {
    onSelectTemplate: (templateId: string) => void;
}

const templates = [
    { id: 'increase-budget', title: 'Increase Ad Budget', description: 'Model the impact of scaling your marketing spend.', icon: DollarSign },
    { id: 'improve-cr', title: 'Improve Conversion Rate', description: 'See how site improvements affect your bottom line.', icon: TrendingUp },
    { id: 'raise-prices', title: 'Raise Prices', description: 'Analyze the trade-off between higher AOV and conversion.', icon: LineChart },
    { id: 'seo-uplift', title: 'SEO Uplift', description: 'Project the profit from an increase in organic traffic.', icon: Search },
];

export default function Step1Intro({ onSelectTemplate }: Step1IntroProps) {
    return (
        <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">What-If Wizard</h1>
            <p className="mt-2 text-lg text-muted-foreground">Which "what-if" do you want to simulate?</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                    <Card key={template.id} className="text-left hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelectTemplate(template.id)}>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <template.icon className="w-8 h-8 text-primary" />
                                <CardTitle>{template.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>{template.description}</CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
