import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock toast function
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

import { CopyButton } from '@/components/ui/CopyButton';

// Mock clipboard API
const mockWriteText = vi.fn();

// Setup global navigator mock
Object.defineProperty(window, 'navigator', {
  value: {
    clipboard: {
      writeText: mockWriteText,
    },
  },
  writable: true,
});

describe('CopyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with default copy icon and text', () => {
    render(<CopyButton text="Hello World" />);
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    
    // Should have copy icon
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with custom children when provided', () => {
    render(
      <CopyButton text="Hello World">
        <span>Custom Copy Text</span>
      </CopyButton>
    );
    
    expect(screen.getByText('Custom Copy Text')).toBeInTheDocument();
    expect(screen.queryByText('Copy')).not.toBeInTheDocument();
  });

  it('copies text to clipboard when clicked', async () => {
    const user = userEvent.setup();
    mockWriteText.mockResolvedValueOnce(undefined);
    
    render(<CopyButton text="Hello World" />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(mockWriteText).toHaveBeenCalledWith('Hello World');
  });

  it('shows success toast after successful copy', async () => {
    const user = userEvent.setup();
    mockWriteText.mockResolvedValueOnce(undefined);
    
    render(<CopyButton text="Hello World" />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(async () => {
      const { toast } = await import('@/hooks/use-toast');
      expect(toast).toHaveBeenCalledWith({
        title: 'Copied!',
        description: 'Text copied to clipboard',
        duration: 2000,
      });
    });
  });

  it('shows custom success message when provided', async () => {
    const user = userEvent.setup();
    mockWriteText.mockResolvedValueOnce(undefined);
    
    render(
      <CopyButton 
        text="Hello World" 
        successMessage="Successfully copied the text!"
      />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(async () => {
      const { toast } = await import('@/hooks/use-toast');
      expect(toast).toHaveBeenCalledWith({
        title: 'Copied!',
        description: 'Successfully copied the text!',
        duration: 2000,
      });
    });
  });

  it('shows error toast when clipboard write fails', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockWriteText.mockRejectedValueOnce(new Error('Clipboard access denied'));
    
    render(<CopyButton text="Hello World" />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(async () => {
      const { toast } = await import('@/hooks/use-toast');
      expect(toast).toHaveBeenCalledWith({
        title: 'Copy failed',
        description: 'Failed to copy text to clipboard',
        variant: 'destructive',
        duration: 3000,
      });
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to copy text:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('temporarily changes icon to checkmark after successful copy', async () => {
    const user = userEvent.setup();
    mockWriteText.mockResolvedValueOnce(undefined);
    
    render(<CopyButton text="Hello World" />);
    
    const button = screen.getByRole('button');
    
    // Initially should have copy icon
    expect(button.querySelector('[data-testid="copy-icon"]')).toBeInTheDocument();
    expect(button.querySelector('[data-testid="check-icon"]')).not.toBeInTheDocument();
    
    await user.click(button);
    
    // Should temporarily show check icon
    await waitFor(() => {
      expect(button.querySelector('[data-testid="check-icon"]')).toBeInTheDocument();
      expect(button.querySelector('[data-testid="copy-icon"]')).not.toBeInTheDocument();
    });
    
    // Should return to copy icon after timeout
    await waitFor(
      () => {
        expect(button.querySelector('[data-testid="copy-icon"]')).toBeInTheDocument();
        expect(button.querySelector('[data-testid="check-icon"]')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('disables button during copy operation', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed clipboard write
    mockWriteText.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve(undefined), 100))
    );
    
    render(<CopyButton text="Hello World" />);
    
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    
    await user.click(button);
    
    // Should be disabled during operation
    expect(button).toBeDisabled();
    
    // Should be enabled again after operation
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('applies custom className', () => {
    render(
      <CopyButton 
        text="Hello World" 
        className="custom-copy-class"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-copy-class');
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(
      <CopyButton text="Hello World" variant="outline" />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
    
    rerender(<CopyButton text="Hello World" variant="ghost" />);
    expect(button).toHaveClass('hover:bg-accent');
  });

  it('calls onCopy callback when provided', async () => {
    const user = userEvent.setup();
    const onCopyCallback = vi.fn();
    
    mockWriteText.mockResolvedValueOnce(undefined);
    
    render(
      <CopyButton 
        text="Hello World" 
        onCopy={onCopyCallback}
      />
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      expect(onCopyCallback).toHaveBeenCalledWith('Hello World');
    });
  });
});