import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the proposals page component for testing trade explainability features
const TradeExplainabilityTest = () => {
  const [expandedRationales, setExpandedRationales] = React.useState<Set<string>>(new Set());

  const toggleRationale = (proposalId: string) => {
    setExpandedRationales(prev => {
      const newSet = new Set(prev);
      if (newSet.has(proposalId)) {
        newSet.delete(proposalId);
      } else {
        newSet.add(proposalId);
      }
      return newSet;
    });
  };

  const mockProposal = {
    id: 'test-proposal-1',
    valueDelta: { you: 5.2, them: -3.1 },
    rationale: 'Trade improves your RB depth significantly.\nGives opponent needed WR help.\nValue exchange favors you by 8.3 points.'
  };

  return (
    <div>
      {/* Aggressiveness Label Test */}
      <div data-testid="aggressiveness-section">
        <AggressivenessLabel 
          deltaYou={mockProposal.valueDelta.you} 
          deltaOpp={mockProposal.valueDelta.them} 
        />
      </div>

      {/* Rationale Disclosure Test */}
      {mockProposal.rationale && (
        <div data-testid="rationale-section">
          <button
            data-testid="rationale-toggle"
            onClick={() => toggleRationale(mockProposal.id)}
          >
            {expandedRationales.has(mockProposal.id) ? '▼' : '▶'} Trade Analysis
          </button>
          {expandedRationales.has(mockProposal.id) && (
            <div data-testid="rationale-content">
              {mockProposal.rationale.split('\n').map((line, i) => (
                <div key={i} data-testid={`rationale-line-${i}`}>
                  {line.startsWith('•') || line.startsWith('-') ? line : `• ${line}`}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { AggressivenessLabel } from '@/components/ui/AggressivenessLabel';

describe('Trade Explainability Components', () => {
  beforeEach(() => {
    // Reset any global state
  });

  describe('AggressivenessLabel in Trade Context', () => {
    it('shows Moderate label for balanced favorable trade', () => {
      render(
        <AggressivenessLabel deltaYou={4.0} deltaOpp={-1.5} />
      );
      
      expect(screen.getByText('Moderate')).toBeInTheDocument();
      expect(screen.getByText(/good value.*acceptable/i)).toBeInTheDocument();
    });

    it('shows Aggressive label for highly favorable trade', () => {
      render(
        <AggressivenessLabel deltaYou={8.0} deltaOpp={-2.0} />
      );
      
      expect(screen.getByText('Aggressive')).toBeInTheDocument();
      expect(screen.getByText(/high-reward.*heavily favoring/i)).toBeInTheDocument();
    });

    it('shows Risky label for unfavorable trade', () => {
      render(
        <AggressivenessLabel deltaYou={-1.0} deltaOpp={3.0} />
      );
      
      expect(screen.getByText('Risky')).toBeInTheDocument();
      expect(screen.getByText(/may not be favorable/i)).toBeInTheDocument();
    });

    it('shows Balanced label for even trade', () => {
      render(
        <AggressivenessLabel deltaYou={2.0} deltaOpp={-0.5} />
      );
      
      expect(screen.getByText('Balanced')).toBeInTheDocument();
      expect(screen.getByText(/fair trade.*mutual/i)).toBeInTheDocument();
    });

    it('applies correct styling classes for each level', () => {
      const { rerender } = render(
        <AggressivenessLabel deltaYou={8.0} deltaOpp={-2.0} />
      );
      
      expect(screen.getByText('Aggressive')).toHaveClass('text-red-600', 'bg-red-50');
      
      rerender(<AggressivenessLabel deltaYou={4.0} deltaOpp={-1.5} />);
      expect(screen.getByText('Moderate')).toHaveClass('text-orange-600', 'bg-orange-50');
      
      rerender(<AggressivenessLabel deltaYou={2.0} deltaOpp={-0.5} />);
      expect(screen.getByText('Balanced')).toHaveClass('text-green-600', 'bg-green-50');
      
      rerender(<AggressivenessLabel deltaYou={-1.0} deltaOpp={3.0} />);
      expect(screen.getByText('Risky')).toHaveClass('text-yellow-600', 'bg-yellow-50');
    });
  });

  describe('Rationale Disclosure Toggle', () => {
    it('initially shows collapsed state', () => {
      render(<TradeExplainabilityTest />);
      
      expect(screen.getByTestId('rationale-toggle')).toBeInTheDocument();
      expect(screen.getByText(/▶.*trade analysis/i)).toBeInTheDocument();
      expect(screen.queryByTestId('rationale-content')).not.toBeInTheDocument();
    });

    it('expands rationale content when clicked', async () => {
      const user = userEvent.setup();
      render(<TradeExplainabilityTest />);
      
      const toggleButton = screen.getByTestId('rationale-toggle');
      await user.click(toggleButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('rationale-content')).toBeInTheDocument();
        expect(screen.getByText(/▼.*trade analysis/i)).toBeInTheDocument();
      });
    });

    it('displays rationale lines as bullet points', async () => {
      const user = userEvent.setup();
      render(<TradeExplainabilityTest />);
      
      await user.click(screen.getByTestId('rationale-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('rationale-line-0')).toHaveTextContent('• Trade improves your RB depth significantly.');
        expect(screen.getByTestId('rationale-line-1')).toHaveTextContent('• Gives opponent needed WR help.');
        expect(screen.getByTestId('rationale-line-2')).toHaveTextContent('• Value exchange favors you by 8.3 points.');
      });
    });

    it('collapses rationale content when clicked again', async () => {
      const user = userEvent.setup();
      render(<TradeExplainabilityTest />);
      
      const toggleButton = screen.getByTestId('rationale-toggle');
      
      // Expand
      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.getByTestId('rationale-content')).toBeInTheDocument();
      });
      
      // Collapse
      await user.click(toggleButton);
      await waitFor(() => {
        expect(screen.queryByTestId('rationale-content')).not.toBeInTheDocument();
        expect(screen.getByText(/▶.*trade analysis/i)).toBeInTheDocument();
      });
    });

    it('handles rationale lines that already have bullet points', async () => {
      const CustomTradeTest = () => {
        const [expanded, setExpanded] = React.useState(false);
        const rationale = '• Already has bullet\n- Dash prefix\nPlain text line';
        
        return (
          <div>
            <button 
              data-testid="custom-toggle"
              onClick={() => setExpanded(!expanded)}
            >
              Toggle
            </button>
            {expanded && (
              <div data-testid="custom-rationale">
                {rationale.split('\n').map((line, i) => (
                  <div key={i} data-testid={`custom-line-${i}`}>
                    {line.startsWith('•') || line.startsWith('-') ? line : `• ${line}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      };

      const user = userEvent.setup();
      render(<CustomTradeTest />);
      
      await user.click(screen.getByTestId('custom-toggle'));
      
      await waitFor(() => {
        expect(screen.getByTestId('custom-line-0')).toHaveTextContent('• Already has bullet');
        expect(screen.getByTestId('custom-line-1')).toHaveTextContent('- Dash prefix');
        expect(screen.getByTestId('custom-line-2')).toHaveTextContent('• Plain text line');
      });
    });
  });

  describe('Integration with Trade Cards', () => {
    it('shows both aggressiveness label and rationale disclosure together', async () => {
      const user = userEvent.setup();
      render(<TradeExplainabilityTest />);
      
      // Both components should be present
      expect(screen.getByTestId('aggressiveness-section')).toBeInTheDocument();
      expect(screen.getByTestId('rationale-section')).toBeInTheDocument();
      
      // Aggressiveness label should show correct level
      expect(screen.getByText('Aggressive')).toBeInTheDocument(); // deltaYou=5.2, deltaOpp=-3.1 -> tradeBalance=8.3 -> Aggressive
      
      // Rationale should be collapsed initially
      expect(screen.queryByTestId('rationale-content')).not.toBeInTheDocument();
      
      // Expand rationale
      await user.click(screen.getByTestId('rationale-toggle'));
      await waitFor(() => {
        expect(screen.getByTestId('rationale-content')).toBeInTheDocument();
      });
    });

    it('maintains independent state for multiple trade cards', async () => {
      const MultipleTradesTest = () => {
        const [expandedRationales, setExpandedRationales] = React.useState<Set<string>>(new Set());
        
        const toggleRationale = (id: string) => {
          setExpandedRationales(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
              newSet.delete(id);
            } else {
              newSet.add(id);
            }
            return newSet;
          });
        };
        
        const trades = [
          { id: 'trade-1', rationale: 'First trade rationale' },
          { id: 'trade-2', rationale: 'Second trade rationale' }
        ];
        
        return (
          <div>
            {trades.map(trade => (
              <div key={trade.id} data-testid={`trade-card-${trade.id}`}>
                <button
                  data-testid={`toggle-${trade.id}`}
                  onClick={() => toggleRationale(trade.id)}
                >
                  Toggle {trade.id}
                </button>
                {expandedRationales.has(trade.id) && (
                  <div data-testid={`content-${trade.id}`}>
                    {trade.rationale}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      };

      const user = userEvent.setup();
      render(<MultipleTradesTest />);
      
      // Expand first trade
      await user.click(screen.getByTestId('toggle-trade-1'));
      await waitFor(() => {
        expect(screen.getByTestId('content-trade-1')).toBeInTheDocument();
        expect(screen.queryByTestId('content-trade-2')).not.toBeInTheDocument();
      });
      
      // Expand second trade
      await user.click(screen.getByTestId('toggle-trade-2'));
      await waitFor(() => {
        expect(screen.getByTestId('content-trade-1')).toBeInTheDocument();
        expect(screen.getByTestId('content-trade-2')).toBeInTheDocument();
      });
      
      // Collapse first trade
      await user.click(screen.getByTestId('toggle-trade-1'));
      await waitFor(() => {
        expect(screen.queryByTestId('content-trade-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('content-trade-2')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides appropriate button role and text for rationale toggle', () => {
      render(<TradeExplainabilityTest />);
      
      const toggle = screen.getByTestId('rationale-toggle');
      expect(toggle.tagName).toBe('BUTTON');
      expect(toggle).toHaveTextContent('Trade Analysis');
    });

    it('uses semantic icons for expand/collapse state', async () => {
      const user = userEvent.setup();
      render(<TradeExplainabilityTest />);
      
      const toggle = screen.getByTestId('rationale-toggle');
      
      // Initially collapsed (right arrow)
      expect(toggle).toHaveTextContent('▶');
      
      // Expand (down arrow)
      await user.click(toggle);
      await waitFor(() => {
        expect(toggle).toHaveTextContent('▼');
      });
    });
  });
});