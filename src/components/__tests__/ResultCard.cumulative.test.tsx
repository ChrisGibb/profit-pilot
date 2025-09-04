
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResultCard } from '../profit-calculator'; // Adjust the import path
import { mockCalculatedMetrics } from './test-fixtures';
import '@testing-library/jest-dom';

describe('ResultCard (Cumulative)', () => {
  it('shows Net Profit as the primary headline when primary="netProfit"', () => {
    render(
      <ResultCard
        title="Cumulative Results"
        results={mockCalculatedMetrics}
        isCumulative={true}
        baselineResults={{ ...mockCalculatedMetrics, netProfit: 500000 }}
        showNetProfit={true}
        primary="netProfit"
      />
    );

    const netProfitValue = screen.getByText('€711,349'); // Based on mock data
    // The headline metric has a larger font size
    expect(netProfitValue).toHaveClass('text-3xl');

    const marketingContributionValue = screen.getByText('€831,349');
    expect(marketingContributionValue).not.toHaveClass('text-3xl');
    expect(marketingContributionValue).toHaveClass('text-xl');
  });

  it('shows delta with "Δ vs Base" label for cumulative results', () => {
    const baseline = { ...mockCalculatedMetrics, netProfit: 700000 };
    const cumulative = { ...mockCalculatedMetrics, netProfit: 711349 };

    render(
      <ResultCard
        title="Cumulative Results"
        results={cumulative}
        isCumulative={true}
        baselineResults={baseline}
        showNetProfit={true}
        primary="netProfit"
      />
    );

    const deltaBadge = screen.getByText(/vs Base/i);
    expect(deltaBadge).toBeInTheDocument();
    // Check if the delta value is correct (711349 - 700000 = 11349)
    expect(deltaBadge.textContent).toContain('11.349');
  });
});
