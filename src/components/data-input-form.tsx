
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Undo2Icon, Calculator } from "lucide-react";
import type { BaseInput, ChannelData, ProjectSettings, Currency, CalculatedMetrics } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { parseNumeric } from "@/lib/calc";
import { Badge } from "./ui/badge";
import { formatCurrencyEUR, formatInteger, formatPercent, formatCurrencySmart } from "@/lib/formatters";

type DataInputFormProps = {
    baseInput: BaseInput;
    derivedMetrics: CalculatedMetrics;
    settings: ProjectSettings;
    onBaseInputChange: (newBaseInput: BaseInput) => void;
    onSettingsChange: (newSettings: ProjectSettings) => void;
    onDeleteChannel: (channelId: string) => void;
    onRestoreChannel?: () => void;
    currency: Currency;
    currencySymbol: string;
};

const formatNumberForDisplay = (
    val: number | string | undefined,
    opts?: { isPercent?: boolean; isSmartCurrency?: boolean; omitSymbol?: boolean; isInteger?: boolean }
) => {
    const { isPercent = false, isSmartCurrency = false, omitSymbol = false, isInteger = false } = opts ?? {};
    if (val === undefined || val === null || typeof val === 'string') return typeof val === 'string' ? val : '';
    if (isNaN(val as number) || !isFinite(val as number)) return 'N/A';

    if (isPercent) {
        return formatPercent(val as number);
    }

    if (isInteger) {
        return formatInteger(val as number);
    }

    if (isSmartCurrency) {
        return formatCurrencySmart(val as number, !omitSymbol);
    }
    return formatCurrencyEUR(val as number, !omitSymbol);
};


const toUnformattedString = (val: number | undefined | null, kind: 'int' | 'currency' | 'percent'): string => {
    if (val === undefined || val === null || isNaN(val)) return '';
    if (kind === 'percent') return (val * 100).toString().replace('.', ',');
    return val.toString().replace('.', ',');
}

const InputField = React.forwardRef<HTMLInputElement, {
    label: string;
    id: string;
    value: number | undefined;
    onChange: (value: number | null) => void;
    onSmartPaste?: (data: Record<string, number>) => void;
    prefix?: string;
    suffix?: string;
    description?: string;
    disabled?: boolean;
    isCalculated?: boolean;
    className?: string;
    isSmartCurrency?: boolean;
    isInteger?: boolean;
}>(({ label, id, value, onChange, onSmartPaste, prefix, suffix, description, disabled = false, isCalculated = false, className = '', isSmartCurrency = false, isInteger = false }, ref) => {
    
    const [isFocused, setIsFocused] = useState(false);
    const [localRawValue, setLocalRawValue] = useState<string>(() => toUnformattedString(value, isInteger ? 'int' : suffix === '%' ? 'percent' : 'currency'));
    
    useEffect(() => {
        if (!isFocused) {
            const kind = suffix === '%' ? 'percent' : isInteger ? 'int' : 'currency';
            setLocalRawValue(toUnformattedString(value, kind));
        }
    }, [value, isFocused, suffix, isInteger]);

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        if (!onSmartPaste) return;
        const pasteData = e.clipboardData.getData('text');
        const lines = pasteData.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length === 0) return;
        
        e.preventDefault();

        let mappedData: Record<string, number> = {};

        if (lines.length > 1) { // Multi-line paste
            const parsedLines = lines.map(line => parseNumeric(line, 'currency'));
            if (lines.length === 3) { // sessions, users(ignored), transactions
                if (parsedLines[0] !== null) mappedData['sessionsTotal'] = parsedLines[0];
                if (parsedLines[2] !== null) mappedData['transactionsTotal'] = parsedLines[2];
            } else if (lines.length === 2) { // sessions, transactions
                if (parsedLines[0] !== null) mappedData['sessionsTotal'] = parsedLines[0];
                if (parsedLines[1] !== null) mappedData['transactionsTotal'] = parsedLines[1];
            }
             // Check for revenue line specifically
            const revenueLineIndex = lines.findIndex(l => /[€$£zł]/.test(l));
            if (revenueLineIndex > -1) {
                const revenueVal = parseNumeric(lines[revenueLineIndex], 'currency');
                if (revenueVal !== null) mappedData['revenueGross'] = revenueVal;
            }

        } else if (lines.length === 1) { // Single-line paste
            const kind = suffix === '%' ? 'percent' : isInteger ? 'int' : 'currency';
            const parsed = parseNumeric(lines[0], kind);
            if(parsed !== null) {
                (mappedData as any)[id] = parsed;
            }
        }
        
        console.info('ga4_paste', { lines, autoApplied: true, mappedData });
        onSmartPaste(mappedData);

        // If this field itself was part of the paste, reflect it immediately in the input
        if (mappedData[id as keyof typeof mappedData] !== undefined) {
            const pasted = mappedData[id as keyof typeof mappedData] as number;
            const kind = suffix === '%' ? 'percent' : isInteger ? 'int' : 'currency';
            setLocalRawValue(
                kind === 'percent'
                ? String(pasted * 100).replace('.', ',')
                : String(pasted ?? '').replace('.', ',')
            );
        }
    };

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        setLocalRawValue(rawValue);
        const kind = suffix === '%' ? 'percent' : isInteger ? 'int' : 'currency';
        const parsed = parseNumeric(rawValue, kind);
        
        onChange(parsed);
    };
    
    const displayValue = isFocused
      ? localRawValue
      : formatNumberForDisplay(value, {
          isPercent: suffix === '%',
          isSmartCurrency,
          omitSymbol: !!prefix,
          isInteger,
        });


    return (
        <div className={cn("space-y-1 w-full", className)}>
            <Label htmlFor={id}>{label}</Label>
            <div className="relative flex items-center h-10">
                {prefix && <span className="pointer-events-none absolute left-3 text-muted-foreground">{prefix}</span>}
                {isCalculated && <Calculator className="pointer-events-none absolute left-3 text-muted-foreground h-4 w-4" />}
                <Input
                    ref={ref}
                    id={id}
                    type={'text'}
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck={false}
                    value={displayValue}
                    onChange={handleOnChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onPaste={onSmartPaste ? handlePaste : undefined}
                    className={cn(
                        "h-10",
                        "text-base",
                        (prefix || isCalculated) && 'pl-8', 
                        suffix && 'pr-8', 
                        isCalculated && "font-bold text-primary border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0"
                    )}
                    disabled={disabled || isCalculated}
                    readOnly={isCalculated}
                />
                {suffix && <span className="pointer-events-none absolute right-3 text-muted-foreground">{suffix}</span>}
            </div>
             {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        </div>
    );
});
InputField.displayName = 'InputField';

export function DataInputForm({ baseInput, derivedMetrics, settings, onBaseInputChange, onSettingsChange, onDeleteChannel, onRestoreChannel, currency, currencySymbol }: DataInputFormProps) {
    
    const handleBusinessChange = (field: keyof BaseInput['business'], value: number | null) => {
        const newBusinessInput = { ...baseInput.business, [field]: value };
        onBaseInputChange({ ...baseInput, business: newBusinessInput });
    };

    const handleSmartPaste = (data: Record<string, number>) => {
        const newBusinessInput = { ...baseInput.business };
        
        for (const key in data) {
            if (Object.keys(newBusinessInput).includes(key)) {
                let finalValue = data[key];
                (newBusinessInput as any)[key] = finalValue;
            }
        }
        
        onBaseInputChange({ ...baseInput, business: newBusinessInput });
    }

    const handleChannelChange = (index: number, field: keyof Omit<ChannelData, 'id' | 'name'>, value: number | null) => {
        if (value === null) return;
        const newChannels = [...baseInput.channels];
        newChannels[index] = { ...newChannels[index], [field]: value };
        onBaseInputChange({ ...baseInput, channels: newChannels });
    };

    const baseInputWithOther: BaseInput = useMemo(() => {
        const manualChannels = baseInput.channels;
        
        const S = manualChannels.reduce((sum, ch) => sum + ch.sessions, 0);
        const T = manualChannels.reduce((sum, ch) => sum + ch.transactions, 0);
        const R = manualChannels.reduce((sum, ch) => sum + ch.revenue, 0);
        const B = manualChannels.reduce((sum, ch) => sum + ch.budget, 0);
        
        const dS = baseInput.business.sessionsTotal - S;
        const dT = baseInput.business.transactionsTotal - T;
        const dR = baseInput.business.revenueGross - R;
        const dB = baseInput.business.totalBudget - B;
    
        const otherChannel: ChannelData = {
            id: 'other',
            name: 'Other',
            budget: Math.max(0, dB),
            sessions: Math.max(0, dS),
            transactions: Math.max(0, dT),
            revenue: Math.max(0, dR),
        };
    
        return {
            ...baseInput,
            channels: [...manualChannels, otherChannel]
        }
    }, [baseInput]);

    const summaryChips = (
        <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">GM: {formatPercent(baseInput.business.grossMarginPct)}</Badge>
            <Badge variant="outline">OPEX: {formatCurrencyEUR(baseInput.business.fixedOpex)}</Badge>
            <Badge variant="outline">VAT: {formatPercent(settings.vatRate)} ({settings.revenueIncludesVat ? 'On' : 'Off'})</Badge>
        </div>
    );


    return (
        <div className="space-y-6">
            <Accordion type="multiple" defaultValue={['ga4-core']} className="w-full space-y-4">
                <Card>
                    <AccordionItem value="ga4-core" className="border-b-0">
                        <AccordionTrigger className="p-6">
                             <CardHeader className="p-0">
                                <CardTitle>GA4 Core Metrics</CardTitle>
                                <CardDescription>Core metrics for a 12-month period, often sourced from Google Analytics 4.</CardDescription>
                            </CardHeader>
                        </AccordionTrigger>
                        <AccordionContent className="px-6">
                           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <InputField
                                    id="sessionsTotal"
                                    label="Sessions (Total)"
                                    value={baseInput.business.sessionsTotal}
                                    onChange={(v) => handleBusinessChange('sessionsTotal', v)}
                                    onSmartPaste={handleSmartPaste}
                                    isInteger={true}
                                />
                                 <InputField
                                    id="transactionsTotal"
                                    label="Transactions (Total)"
                                    value={baseInput.business.transactionsTotal}
                                    onChange={(v) => handleBusinessChange('transactionsTotal', v)}
                                    onSmartPaste={handleSmartPaste}
                                    isInteger={true}
                                />
                                <InputField
                                    id="revenueGross"
                                    label="Revenue (Gross)"
                                    value={baseInput.business.revenueGross}
                                    onChange={(v) => handleBusinessChange('revenueGross', v)}
                                    onSmartPaste={handleSmartPaste}
                                    prefix={currencySymbol}
                                />
                               <InputField
                                    id="totalBudget"
                                    label="Marketing Budget (Total)"
                                    value={baseInput.business.totalBudget}
                                    onChange={(v) => handleBusinessChange('totalBudget', v)}
                                    onSmartPaste={handleSmartPaste}
                                    prefix={currencySymbol}
                                    description="Not sourced from GA4 — enter planned yearly spend."
                                />
                           </div>
                           <Separator className="my-6" />
                           <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                <InputField
                                    id="crBlended"
                                    label="Conversion Rate"
                                    value={derivedMetrics.crBlended}
                                    onChange={() => {}}
                                    suffix="%"
                                    isCalculated={true}
                                />
                                 <InputField
                                    id="aovGross"
                                    label="Average Order Value (AOV, Gross)"
                                    value={derivedMetrics.aovGross}
                                    onChange={() => {}}
                                    prefix={currencySymbol}
                                    isCalculated={true}
                                />
                                 <InputField
                                    id="costPerSession"
                                    label="Cost per Session"
                                    value={derivedMetrics.costPerSession}
                                    onChange={() => {}}
                                    prefix={currencySymbol}
                                    isCalculated={true}
                                    isSmartCurrency={true}
                                />
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>

                 <Card>
                    <AccordionItem value="business-costs" className="border-b-0">
                         <AccordionTrigger className="p-6">
                              <CardHeader className="p-0 flex-1 text-left">
                                 <CardTitle>Business &amp; Cost Metrics</CardTitle>
                                 <CardDescription>Key financial data like margins, fixed costs, and VAT settings.</CardDescription>
                              </CardHeader>
                              {summaryChips}
                         </AccordionTrigger>
                         <AccordionContent className="px-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    id="grossMarginPct"
                                    label="Gross Margin (%)"
                                    value={baseInput.business.grossMarginPct}
                                    onChange={(v) => handleBusinessChange('grossMarginPct', v)}
                                    suffix="%"
                                    description="Revenue minus ALL variable costs (COGS, payment, shipping, etc.)."
                                />
                                <InputField
                                    id="fixedOpex"
                                    label="Fixed Operating Expenses (OPEX)"
                                    value={baseInput.business.fixedOpex}
                                    onChange={(v) => handleBusinessChange('fixedOpex', v)}
                                    prefix={currencySymbol}
                                    description="Fixed costs for the period (e.g., salaries, rent)."
                                />
                            </div>
                            <Separator className="my-6" />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="revenueIncludesVat"
                                            checked={settings.revenueIncludesVat}
                                            onCheckedChange={(checked) => onSettingsChange({...settings, revenueIncludesVat: !!checked})}
                                        />
                                        <Label
                                            htmlFor="revenueIncludesVat"
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            Revenue includes VAT?
                                        </Label>
                                    </div>
                                </div>
                                {settings.revenueIncludesVat && (
                                    <InputField
                                        id="vatRate"
                                        label="VAT Rate"
                                        value={settings.vatRate}
                                        onChange={(v) => onSettingsChange({...settings, vatRate: v ?? 0})}
                                        suffix="%"
                                    />
                                )}
                             </div>
                              <div className="text-right text-lg mt-4">
                               <span className="text-muted-foreground">Revenue (Net):</span> <span className="font-bold text-primary">{formatCurrencyEUR(derivedMetrics.revenueNet)}</span>
                            </div>
                         </AccordionContent>
                     </AccordionItem>
                 </Card>

                <Card>
                    <AccordionItem value="marketing-channels" className="border-b-0">
                        <AccordionTrigger className="p-6">
                            <CardHeader className="p-0 text-left">
                                <CardTitle>Marketing Channels</CardTitle>
                                <CardDescription>Break down performance by channel. The "Other" channel is calculated automatically.</CardDescription>
                            </CardHeader>
                        </AccordionTrigger>
                        <AccordionContent className="px-6">
                            {onRestoreChannel && (
                                <div className="flex justify-end mb-4">
                                    <Button variant="outline" onClick={onRestoreChannel}>
                                        <Undo2Icon className="mr-2 h-4 w-4" />
                                        Restore Channel
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-4">
                                {baseInputWithOther.channels.map((channel) => {
                                    const isOtherChannel = channel.id === 'other';
                                    const handleLocalChannelChange = (field: keyof Omit<ChannelData, 'id'|'name'>, value: number | null) => {
                                        const channelIndexInBase = baseInput.channels.findIndex(c => c.id === channel.id);
                                        if(channelIndexInBase > -1) {
                                            handleChannelChange(channelIndexInBase, field, value);
                                        }
                                    }

                                    return (
                                        <div key={channel.id} className="border rounded-md px-4">
                                        <div className="flex justify-between items-center w-full py-4">
                                                <h3 className="text-lg font-semibold">{channel.name}</h3>
                                                {!isOtherChannel && (
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive shrink-0" onClick={() => onDeleteChannel(channel.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="pb-4">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <InputField
                                                        id={`channel-budget-${channel.id}`}
                                                        label="Marketing Spend"
                                                        value={channel.budget}
                                                        onChange={(v) => handleLocalChannelChange('budget', v)}
                                                        prefix={currencySymbol}
                                                        disabled={isOtherChannel}
                                                    />
                                                    <InputField
                                                        id={`channel-sessions-${channel.id}`}
                                                        label="Sessions"
                                                        value={channel.sessions}
                                                        onChange={(v) => handleLocalChannelChange('sessions', v)}
                                                        disabled={isOtherChannel}
                                                        isInteger={true}
                                                    />
                                                    <InputField
                                                        id={`channel-transactions-${channel.id}`}
                                                        label="Transactions"
                                                        value={channel.transactions}
                                                        onChange={(v) => handleLocalChannelChange('transactions', v)}
                                                        disabled={isOtherChannel}
                                                        isInteger={true}
                                                    />
                                                    <InputField
                                                        id={`channel-revenue-${channel.id}`}
                                                        label="Revenue (Gross)"
                                                        value={channel.revenue}
                                                        onChange={(v) => handleLocalChannelChange('revenue', v)}
                                                        prefix={currencySymbol}
                                                        disabled={isOtherChannel}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Card>
            </Accordion>
        </div>
    );
}

    