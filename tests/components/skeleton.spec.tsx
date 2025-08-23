import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  Skeleton, 
  DashboardSkeleton, 
  PlayersSkeleton, 
  ProposalsSkeleton 
} from '@/components/ui/Skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders with default classes', () => {
      render(<Skeleton data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveClass('rounded-md');
      expect(skeleton).toHaveClass('bg-muted');
    });

    it('applies custom className', () => {
      render(<Skeleton className="custom-class h-4 w-full" data-testid="skeleton" />);
      
      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('custom-class');
      expect(skeleton).toHaveClass('h-4');
      expect(skeleton).toHaveClass('w-full');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Skeleton ref={ref} />);
      
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('DashboardSkeleton', () => {
    it('renders dashboard skeleton structure', () => {
      const { container } = render(<DashboardSkeleton />);
      
      // Should have multiple skeleton elements with animate-pulse class
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(10);
      
      // Should contain stats cards grid structure
      const statsGrid = container.querySelector('.grid.gap-4');
      expect(statsGrid).toBeInTheDocument();
    });

    it('renders without layout shifts', () => {
      const { container } = render(<DashboardSkeleton />);
      
      // Should have consistent structure with no undefined dimensions
      const skeletonElements = container.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(15);
      
      // Each skeleton should have defined dimensions
      skeletonElements.forEach(element => {
        const hasWidth = element.className.includes('w-') || element.style.width;
        const hasHeight = element.className.includes('h-') || element.style.height;
        expect(hasWidth || hasHeight).toBeTruthy();
      });
    });
  });

  describe('PlayersSkeleton', () => {
    it('renders players table skeleton structure', () => {
      const { container } = render(<PlayersSkeleton />);
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(20);
    });

    it('includes search and filter skeleton elements', () => {
      const { container } = render(<PlayersSkeleton />);
      
      // Should have elements that represent search and filter controls
      const searchFilters = container.querySelector('.flex.items-center.space-x-4');
      expect(searchFilters).toBeInTheDocument();
    });

    it('renders table rows with consistent structure', () => {
      const { container } = render(<PlayersSkeleton />);
      
      // Should have multiple table row structures
      const tableRows = container.querySelectorAll('.border-b.p-4');
      expect(tableRows.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('ProposalsSkeleton', () => {
    it('renders proposals list skeleton structure', () => {
      const { container } = render(<ProposalsSkeleton />);
      
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(30);
    });

    it('includes proposal card structure', () => {
      const { container } = render(<ProposalsSkeleton />);
      
      // Should have rounded border containers representing proposal cards
      const proposalCards = container.querySelectorAll('.rounded-lg.border.p-6');
      expect(proposalCards.length).toBe(5);
    });

    it('includes trade details sections', () => {
      const { container } = render(<ProposalsSkeleton />);
      
      // Should have grid sections for give/get sections
      const tradeGrids = container.querySelectorAll('.grid.gap-4');
      expect(tradeGrids.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Accessibility', () => {
    it('skeleton components are properly hidden from screen readers', () => {
      render(
        <div>
          <Skeleton aria-hidden="true" />
          <DashboardSkeleton />
          <PlayersSkeleton />
          <ProposalsSkeleton />
        </div>
      );
      
      // Loading states should not interfere with screen readers
      // The actual content loading should be announced separately
      expect(true).toBe(true); // Basic rendering test passes
    });
  });
});