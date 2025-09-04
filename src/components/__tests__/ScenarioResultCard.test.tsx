
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScenarioResultCard } from '../profit-calculator'; // Adjust the import path
import { mockCalculatedMetrics, mockScenario } from './test-fixtures';
import '@testing-library/jest-dom';

describe('ScenarioResultCard', () => {
  it('renders rows in the correct business-flow order', () => {
    const scenarioWithAllChanges = {
      ...mockScenario,
      changes: [
        { metric: 'costPerSession' as const, scope: 'global' as const, mode: 'relative' as const, values: { P: -10, R: -10, O: -10 } },
        { metric: 'CR' as const, scope: 'global' as const, mode: 'relative' as const, values: { P: 10, R: 10, O: 10 } },
        { metric: 'AOV' as const, scope: 'global' as const, mode: 'relative' as const, values: { P: 10, R: 10, O: 10 } },
        { metric: 'grossMarginPct' as const, scope: 'global' as const, mode: 'absolute' as const, values: { P: 2, R: 2, O: 2 } },
        { metric: 'fixedOpex' as const, scope: 'opex' as const, mode: 'absolute' as const, values: { P: 5000, R: 5000, O: 5000 } },
      ],
    };

    render(
      <ScenarioResultCard
        scenario={scenarioWithAllChanges}
        results={mockCalculatedMetrics}
        prevResults={{...mockCalculatedMetrics, netProfit: mockCalculatedMetrics.netProfit - 1000}}
        onToggle={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
        isFirst={true}
        isLast={true}
      />
    );

    // Open the details table
    const expandButton = screen.getByRole('button', { name: /chevrons-up-down/i });
    expandButton.click();

    const rows = screen.getAllByRole('row');
    const rowTexts = rows.map(row => row.textContent);

    const renderedOrder = rowTexts.map(text => text?.split(/([A-Z(])/)[0].trim()).filter(Boolean);
    
    // Check that Gross Margin is not N/A
    const grossMarginRow = screen.getByText('Gross Margin (pp)').closest('tr');
    expect(grossMarginRow).not.toHaveTextContent('N/A');

    const separator = screen.getByTestId('scenario-section-results');
    expect(separator).toBeInTheDocument();

    const separatorIndex = renderedOrder.indexOf('Fixed OPEX') + 1;
    const itemsBeforeSeparator = renderedOrder.slice(1, separatorIndex);
    const itemsAfterSeparator = renderedOrder.slice(separatorIndex);

    expect(itemsBeforeSeparator).toContain('Revenue (Net)');
    expect(itemsAfterSeparator).toContain('Marketing Contribution');
    expect(itemsAfterSeparator).toContain('Net Profit');
  });

  it('renders "Δ vs Prev" as the delta column header', () => {
     render(
      <ScenarioResultCard
        scenario={mockScenario}
        results={mockCalculatedMetrics}
        prevResults={mockCalculatedMetrics}
        onToggle={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
        isFirst={true}
        isLast={true}
      />
    );
     // Open the details table
    const expandButton = screen.getByRole('button', { name: /chevrons-up-down/i });
    expandButton.click();

    const header = screen.getByTestId('scenario-delta-header');
    expect(header).toHaveTextContent('Δ vs Prev');
  });
});
