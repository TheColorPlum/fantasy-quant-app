import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PriceBreakdown } from '@/components/valuation/PriceBreakdown';

describe('PriceBreakdown', () => {
  const mockValuationComponents = {
    anchor: 12.5,
    deltaPerf: 4.2,
    vorp: 6.8,
    global: 2.3
  };

  beforeEach(() => {
    // Reset any global state
  });

  afterEach(() => {
    // Cleanup
  });

  it('renders trigger with total price', () => {
    const totalPrice = 25.8;
    
    render(
      <PriceBreakdown 
        price={totalPrice}
        components={mockValuationComponents}
      />
    );
    
    expect(screen.getByText(/\$25\.8/)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with custom trigger content when provided', () => {
    render(
      <PriceBreakdown 
        price={25.8}
        components={mockValuationComponents}
      >
        <span data-testid="custom-trigger">Custom Price Display</span>
      </PriceBreakdown>
    );
    
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    expect(screen.getByText('Custom Price Display')).toBeInTheDocument();
  });

  it('opens popover when trigger is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PriceBreakdown 
        price={25.8}
        components={mockValuationComponents}
      />
    );
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    await waitFor(() => {
      expect(screen.getByText('Price Breakdown')).toBeInTheDocument();
    });
  });

  it('displays all component values correctly in popover', async () => {
    const user = userEvent.setup();
    
    render(
      <PriceBreakdown 
        price={25.8}
        components={mockValuationComponents}
      />
    );
    
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      // Check each component is displayed
      expect(screen.getByText('Anchor Value')).toBeInTheDocument();
      expect(screen.getByText(/\$12\.5/)).toBeInTheDocument();
      
      expect(screen.getByText('Performance Delta')).toBeInTheDocument();
      expect(screen.getByText(/\$4\.2/)).toBeInTheDocument();
      
      expect(screen.getByText('Value Over Replacement')).toBeInTheDocument();
      expect(screen.getByText(/\$6\.8/)).toBeInTheDocument();
      
      expect(screen.getByText('Global Adjustment')).toBeInTheDocument();
      expect(screen.getByText(/\$2\.3/)).toBeInTheDocument();
    });
  });

  it('shows total in popover footer', async () => {
    const user = userEvent.setup();
    const totalPrice = 25.8;
    
    render(
      <PriceBreakdown 
        price={totalPrice}
        components={mockValuationComponents}
      />
    );
    
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText('Total Price')).toBeInTheDocument();
      expect(screen.getAllByText(/\$25\.8/)).toHaveLength(2); // Once in trigger, once in total
    });
  });

  it('handles negative component values correctly', async () => {
    const user = userEvent.setup();
    const componentsWithNegative = {
      anchor: 15.0,
      deltaPerf: -2.5,
      vorp: 8.0,
      global: 1.5
    };
    
    render(
      <PriceBreakdown 
        price={22.0}
        components={componentsWithNegative}
      />
    );
    
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getByText(/\-\$2\.5/)).toBeInTheDocument();
    });
  });

  it('closes popover when clicking outside', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <PriceBreakdown 
          price={25.8}
          components={mockValuationComponents}
        />
        <div data-testid="outside">Outside content</div>
      </div>
    );
    
    // Open popover
    await user.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText('Price Breakdown')).toBeInTheDocument();
    });
    
    // Click outside
    await user.click(screen.getByTestId('outside'));
    
    await waitFor(() => {
      expect(screen.queryByText('Price Breakdown')).not.toBeInTheDocument();
    });
  });

  it('applies correct styling classes', () => {
    render(
      <PriceBreakdown 
        price={25.8}
        components={mockValuationComponents}
        className="custom-class"
      />
    );
    
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveClass('custom-class');
  });

  it('includes proper accessibility attributes', async () => {
    const user = userEvent.setup();
    
    render(
      <PriceBreakdown 
        price={25.8}
        components={mockValuationComponents}
      />
    );
    
    const trigger = screen.getByRole('button');
    
    // Should have proper ARIA attributes
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    
    await user.click(trigger);
    
    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('formats currency values consistently', async () => {
    const user = userEvent.setup();
    const componentsWithDecimals = {
      anchor: 12.456,
      deltaPerf: 4.234,
      vorp: 6.789,
      global: 2.321
    };
    
    render(
      <PriceBreakdown 
        price={25.8}
        components={componentsWithDecimals}
      />
    );
    
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      // Should format to reasonable decimal places
      expect(screen.getByText(/\$12\.46/)).toBeInTheDocument();
      expect(screen.getByText(/\$4\.23/)).toBeInTheDocument();
      expect(screen.getByText(/\$6\.79/)).toBeInTheDocument();
      expect(screen.getByText(/\$2\.32/)).toBeInTheDocument();
    });
  });

  it('shows correct component descriptions', async () => {
    const user = userEvent.setup();
    
    render(
      <PriceBreakdown 
        price={25.8}
        components={mockValuationComponents}
      />
    );
    
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      // Should include explanatory text
      expect(screen.getByText(/auction.*value/i)).toBeInTheDocument();
      expect(screen.getByText(/recent.*performance/i)).toBeInTheDocument();
      expect(screen.getByText(/replacement.*player/i)).toBeInTheDocument();
      expect(screen.getByText(/league.*adjustment/i)).toBeInTheDocument();
    });
  });

  it('handles zero or missing components gracefully', async () => {
    const user = userEvent.setup();
    const sparseComponents = {
      anchor: 20.0,
      deltaPerf: 0,
      vorp: 5.0,
      global: 0
    };
    
    render(
      <PriceBreakdown 
        price={25.0}
        components={sparseComponents}
      />
    );
    
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(screen.getAllByText(/\$0/)).toHaveLength(2); // deltaPerf and global both show $0
    });
  });
});