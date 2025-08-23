import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SyncChip } from '@/components/ui/SyncChip';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SyncChip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with "Synced Xm ago" text', () => {
    const lastSyncedAt = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    
    render(
      <SyncChip 
        leagueId="test-league-123" 
        lastSyncedAt={lastSyncedAt}
      />
    );
    
    expect(screen.getByText(/Synced \d+m ago/)).toBeInTheDocument();
  });

  it('displays correct time intervals', () => {
    const testCases = [
      { minutesAgo: 1, expected: 'Synced 1m ago' },
      { minutesAgo: 5, expected: 'Synced 5m ago' },
      { minutesAgo: 30, expected: 'Synced 30m ago' },
      { minutesAgo: 60, expected: 'Synced 1h ago' },
      { minutesAgo: 90, expected: 'Synced 1h ago' },
      { minutesAgo: 120, expected: 'Synced 2h ago' },
    ];

    testCases.forEach(({ minutesAgo, expected }) => {
      const lastSyncedAt = new Date(Date.now() - minutesAgo * 60 * 1000);
      
      const { rerender } = render(
        <SyncChip 
          leagueId="test-league-123" 
          lastSyncedAt={lastSyncedAt}
        />
      );
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      
      // Clean up for next test
      rerender(<div />);
    });
  });

  it('shows "Never synced" when lastSyncedAt is null', () => {
    render(
      <SyncChip 
        leagueId="test-league-123" 
        lastSyncedAt={null}
      />
    );
    
    expect(screen.getByText('Never synced')).toBeInTheDocument();
  });

  it('calls sync API when clicked', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    const lastSyncedAt = new Date(Date.now() - 5 * 60 * 1000);
    
    render(
      <SyncChip 
        leagueId="test-league-123" 
        lastSyncedAt={lastSyncedAt}
      />
    );
    
    const chip = screen.getByRole('button');
    await user.click(chip);
    
    expect(mockFetch).toHaveBeenCalledWith('/api/leagues/test-league-123/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  it('shows loading state during sync', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed response
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      }), 100))
    );

    const lastSyncedAt = new Date(Date.now() - 5 * 60 * 1000);
    
    render(
      <SyncChip 
        leagueId="test-league-123" 
        lastSyncedAt={lastSyncedAt}
      />
    );
    
    const chip = screen.getByRole('button');
    await user.click(chip);
    
    // Should show loading state
    expect(screen.getByText('Syncing...')).toBeInTheDocument();
    expect(chip).toBeDisabled();
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Syncing...')).not.toBeInTheDocument();
    });
  });

  it('handles sync errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const lastSyncedAt = new Date(Date.now() - 5 * 60 * 1000);
    
    render(
      <SyncChip 
        leagueId="test-league-123" 
        lastSyncedAt={lastSyncedAt}
      />
    );
    
    const chip = screen.getByRole('button');
    await user.click(chip);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to sync league:', expect.any(Error));
    });
    
    // Should return to normal state after error
    expect(screen.getByText(/Synced \d+m ago/)).toBeInTheDocument();
    expect(chip).not.toBeDisabled();
    
    consoleErrorSpy.mockRestore();
  });

  it('applies correct CSS classes', () => {
    const lastSyncedAt = new Date(Date.now() - 5 * 60 * 1000);
    
    render(
      <SyncChip 
        leagueId="test-league-123" 
        lastSyncedAt={lastSyncedAt}
        className="custom-class"
      />
    );
    
    const chip = screen.getByRole('button');
    expect(chip).toHaveClass('custom-class');
    
    // Should have base styling classes
    expect(chip).toHaveClass('inline-flex');
    expect(chip).toHaveClass('items-center');
  });

  it('accepts custom onSync callback', async () => {
    const user = userEvent.setup();
    const onSyncCallback = vi.fn();
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    const lastSyncedAt = new Date(Date.now() - 5 * 60 * 1000);
    
    render(
      <SyncChip 
        leagueId="test-league-123" 
        lastSyncedAt={lastSyncedAt}
        onSync={onSyncCallback}
      />
    );
    
    const chip = screen.getByRole('button');
    await user.click(chip);
    
    await waitFor(() => {
      expect(onSyncCallback).toHaveBeenCalledWith({ success: true });
    });
  });
});