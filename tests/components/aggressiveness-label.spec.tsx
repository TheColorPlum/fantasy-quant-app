import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AggressivenessLabel } from '@/components/ui/AggressivenessLabel';

describe('AggressivenessLabel', () => {
  it('shows Balanced for small balanced trades', () => {
    render(
      <AggressivenessLabel deltaYou={1.0} deltaOpp={-1.0} />
    );
    
    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText(/fair trade.*mutual/i)).toBeInTheDocument();
  });

  it('shows Aggressive for large favorable trades', () => {
    render(
      <AggressivenessLabel deltaYou={8.0} deltaOpp={-4.0} />
    );
    
    expect(screen.getByText('Aggressive')).toBeInTheDocument();
    expect(screen.getByText(/high-reward.*heavily favoring/i)).toBeInTheDocument();
  });

  it('shows Balanced for even trades within threshold', () => {
    render(
      <AggressivenessLabel deltaYou={2.0} deltaOpp={0} />
    );
    
    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText(/fair trade.*mutual/i)).toBeInTheDocument();
  });

  it('shows Moderate for decent value trades', () => {
    render(
      <AggressivenessLabel deltaYou={4.0} deltaOpp={-0.5} />
    );
    
    expect(screen.getByText('Moderate')).toBeInTheDocument();
    expect(screen.getByText(/good value.*acceptable/i)).toBeInTheDocument();
  });

  it('shows Risky for unfavorable trades', () => {
    render(
      <AggressivenessLabel deltaYou={-2.0} deltaOpp={3.0} />
    );
    
    expect(screen.getByText('Risky')).toBeInTheDocument();
    expect(screen.getByText(/may not be favorable/i)).toBeInTheDocument();
  });

  it('handles edge case: zero deltas', () => {
    render(
      <AggressivenessLabel deltaYou={0} deltaOpp={0} />
    );
    
    expect(screen.getByText('Balanced')).toBeInTheDocument();
  });

  it('handles edge case: equal positive deltas', () => {
    render(
      <AggressivenessLabel deltaYou={4.0} deltaOpp={4.0} />
    );
    
    // When opponent gains too much (>2), it should show as risky
    expect(screen.getByText('Risky')).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(
      <AggressivenessLabel 
        deltaYou={1.0} 
        deltaOpp={-1.0}
        className="custom-class"
      />
    );
    
    const container = screen.getByText('Balanced').closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
    expect(container).toHaveClass('flex', 'items-center', 'gap-2');
  });

  it('shows Balanced badge styling', () => {
    render(<AggressivenessLabel deltaYou={1.0} deltaOpp={-1.0} />);
    
    const badge = screen.getByText('Balanced');
    expect(badge).toHaveClass('text-green-600', 'bg-green-50');
  });

  it('shows Aggressive badge styling', () => {
    render(<AggressivenessLabel deltaYou={10.0} deltaOpp={-2.0} />);
    
    const badge = screen.getByText('Aggressive');
    expect(badge).toHaveClass('text-red-600', 'bg-red-50');
  });

  it('shows Moderate badge styling', () => {
    render(<AggressivenessLabel deltaYou={4.0} deltaOpp={-0.5} />);
    
    const badge = screen.getByText('Moderate');
    expect(badge).toHaveClass('text-orange-600', 'bg-orange-50');
  });

  it('shows Risky badge styling', () => {
    render(<AggressivenessLabel deltaYou={-1.0} deltaOpp={2.0} />);
    
    const badge = screen.getByText('Risky');
    expect(badge).toHaveClass('text-yellow-600', 'bg-yellow-50');
  });
});