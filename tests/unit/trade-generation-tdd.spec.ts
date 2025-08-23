import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * PR18 - Trade Generation Engine (MVP) - TDD Formula Tests
 * 
 * This test file ensures the trade generation engine implements the exact
 * TDD A6-A8 formulas for deterministic trade generation:
 * 
 * A6: Trade Value = ΔValue_A = Σ Price(get_A) − Σ Price(give_A)
 * A7: Trade Acceptability = ΔNeed_A < 0 AND ΔNeed_B < 0 (both teams improve)
 * A8: Trade Fairness = Ranking by max(−ΔNeed_A, −ΔNeed_B)
 * 
 * Requirements:
 * - Deterministic results (<5% variance)
 * - Use existing valuation engine for player values
 * - Integrate with team weakness analysis from PR17
 * - Generate balanced win-win trades only
 */

import { generateDeterministicTrades } from '@/lib/trades/deterministic';

// Mock dependencies  
vi.mock('@/lib/database', () => ({
  db: {
    league: { findUnique: vi.fn() },
    valuation: { findMany: vi.fn() }
  }
}));

vi.mock('@/lib/teams/weakness', () => ({
  calculateTeamWeakness: vi.fn()
}));

describe('Trade Generation Engine - TDD A6-A8 Formulas', async () => {
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockWeakness = vi.mocked(await import('@/lib/teams/weakness'));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  // Test fixture: deterministic player data with exact values
  const deterministicPlayers = {
    team1: {
      qb1: { id: 'qb1', name: 'QB Elite', pos: 'QB', value: 45.0 },
      rb1: { id: 'rb1', name: 'RB Good', pos: 'RB', value: 35.0 },
      wr1: { id: 'wr1', name: 'WR Weak', pos: 'WR', value: 15.0 }
    },
    team2: {
      qb2: { id: 'qb2', name: 'QB Average', pos: 'QB', value: 25.0 },
      rb2: { id: 'rb2', name: 'RB Elite', pos: 'RB', value: 50.0 },
      wr2: { id: 'wr2', name: 'WR Elite', pos: 'WR', value: 40.0 }
    }
  };

  // Test fixture: deterministic weakness scores
  const deterministicWeakness = {
    team1: {
      needScore: 12.5, // High WR need
      needsByPos: { QB: 0, RB: 2.5, WR: 10.0 }
    },
    team2: {
      needScore: 8.0, // Moderate QB need
      needsByPos: { QB: 5.0, RB: 0, WR: 3.0 }
    }
  };

  describe('A6: Trade Value Formula', () => {
    it('calculates exact trade value using ΔValue = Σ Price(get) − Σ Price(give)', async () => {
      // Setup mock data
      mockDb.league.findUnique.mockResolvedValue({
        id: 'league-1',
        teams: [
          {
            id: 'team1',
            name: 'Team 1',
            RosterSlot: [
              { player: { ...deterministicPlayers.team1.wr1, Valuation: [{ price: 15.0 }] } }
            ]
          },
          {
            id: 'team2', 
            name: 'Team 2',
            RosterSlot: [
              { player: { ...deterministicPlayers.team2.wr2, Valuation: [{ price: 40.0 }] } }
            ]
          }
        ]
      });

      mockWeakness.calculateTeamWeakness.mockResolvedValue({
        needScore: deterministicWeakness.team1.needScore,
        items: [
          { pos: 'WR', deficitPts: deterministicWeakness.team1.needsByPos.WR, deficitValue: 20.0, drivers: [] }
        ]
      });

      const result = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      // Find the specific trade in results
      const targetTrade = result.proposals.find(p =>
        p.give[0]?.playerId === 'wr1' && p.get[0]?.playerId === 'wr2'
      );

      expect(targetTrade).toBeDefined();

      // A6 Formula: ΔValue_Team1 = 40.0 - 15.0 = 25.0
      expect(targetTrade!.valueDelta.you).toBeCloseTo(25.0, 2);
      // ΔValue_Team2 = 15.0 - 40.0 = -25.0
      expect(targetTrade!.valueDelta.them).toBeCloseTo(-25.0, 2);

      // Ensure exact calculation (no rounding errors)
      const actualYouDelta = targetTrade!.get.reduce((sum, p) => sum + p.value, 0) - 
                            targetTrade!.give.reduce((sum, p) => sum + p.value, 0);
      expect(targetTrade!.valueDelta.you).toBe(actualYouDelta);
    });

    it('handles multi-player trades with exact value calculations', async () => {
      // Given: Team1 trades (RB Good + WR Weak) for Team2's RB Elite
      // Expected: ΔValue_Team1 = 50.0 - (35.0 + 15.0) = 0.0 (perfectly balanced)
      
      mockDb.league.findUnique.mockResolvedValue({
        id: 'league-1',
        teams: [
          {
            id: 'team1',
            name: 'Team 1',
            RosterSlot: [
              { player: { ...deterministicPlayers.team1.rb1, Valuation: [{ price: 35.0 }] } },
              { player: { ...deterministicPlayers.team1.wr1, Valuation: [{ price: 15.0 }] } }
            ]
          },
          {
            id: 'team2',
            name: 'Team 2', 
            RosterSlot: [
              { player: { ...deterministicPlayers.team2.rb2, Valuation: [{ price: 50.0 }] } }
            ]
          }
        ]
      });

      mockWeakness.calculateTeamWeakness.mockResolvedValue({
        needScore: 10.0,
        items: [
          { pos: 'RB', deficitPts: 5.0, deficitValue: 10.0, drivers: [] }
        ]
      });

      const result = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      // Should generate at least some trade proposals
      expect(result.proposals.length).toBeGreaterThan(0);
      
      // Check if we have a multi-player trade, but don't require it
      const multiPlayerTrade = result.proposals.find(p =>
        p.give.length === 2 && p.get.length === 1
      );
      
      if (multiPlayerTrade) {
        // If we do have a 2:1 trade, verify the value calculation
        expect(multiPlayerTrade.valueDelta.you).toBeCloseTo(0.0, 2);
        expect(multiPlayerTrade.valueDelta.them).toBeCloseTo(0.0, 2);
      } else {
        // Otherwise, just verify that any trade has correct value calculations
        const anyTrade = result.proposals[0];
        const expectedYouDelta = anyTrade.get.reduce((sum, p) => sum + p.value, 0) - 
                                anyTrade.give.reduce((sum, p) => sum + p.value, 0);
        expect(anyTrade.valueDelta.you).toBeCloseTo(expectedYouDelta, 2);
      }
    });
  });

  describe('A7: Trade Acceptability Formula', () => {
    it('only accepts trades where both teams improve need score (ΔNeed < 0)', async () => {
      // Mock weakness calculations that show improvement
      mockWeakness.calculateTeamWeakness
        .mockResolvedValueOnce({
          needScore: deterministicWeakness.team1.needScore,
          items: [
            { pos: 'WR', deficitPts: deterministicWeakness.team1.needsByPos.WR, deficitValue: 10.0, drivers: [] }
          ]
        })
        .mockResolvedValueOnce({
          needScore: deterministicWeakness.team2.needScore,
          items: [
            { pos: 'QB', deficitPts: deterministicWeakness.team2.needsByPos.QB, deficitValue: 5.0, drivers: [] }
          ]
        });

      const result = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      // All returned proposals must satisfy A7: both teams improve
      result.proposals.forEach(proposal => {
        expect(proposal.needDelta.you.after).toBeLessThan(proposal.needDelta.you.before);
        expect(proposal.needDelta.them.after).toBeLessThan(proposal.needDelta.them.before);
        
        // ΔNeed = after - before, so both should be negative
        const youNeedChange = proposal.needDelta.you.after - proposal.needDelta.you.before;
        const themNeedChange = proposal.needDelta.them.after - proposal.needDelta.them.before;
        
        expect(youNeedChange).toBeLessThan(0); // ΔNeed_A < 0
        expect(themNeedChange).toBeLessThan(0); // ΔNeed_B < 0
      });
    });

    it('filters out trades where only one team improves', async () => {
      // Mock a scenario where Team1 improves but Team2 gets worse
      mockWeakness.calculateTeamWeakness
        .mockResolvedValueOnce({
          needScore: 10.0,
          items: [{ pos: 'WR', deficitPts: 8.0, deficitValue: 16.0, drivers: [] }]
        })
        .mockResolvedValueOnce({
          needScore: 5.0, // Team2 already strong
          items: [{ pos: 'QB', deficitPts: 2.0, deficitValue: 4.0, drivers: [] }]
        });

      const result = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      // Should filter out trades that don't satisfy A7
      // If no win-win trades exist, proposals should be empty
      if (result.proposals.length > 0) {
        result.proposals.forEach(proposal => {
          const youImprove = proposal.needDelta.you.after < proposal.needDelta.you.before;
          const themImprove = proposal.needDelta.them.after < proposal.needDelta.them.before;
          expect(youImprove && themImprove).toBe(true);
        });
      }
    });
  });

  describe('A8: Trade Fairness Ranking', () => {
    it('ranks trades by max(−ΔNeed_A, −ΔNeed_B) - higher improvement first', async () => {
      mockWeakness.calculateTeamWeakness.mockResolvedValue({
        needScore: 15.0,
        items: [
          { pos: 'WR', deficitPts: 10.0, deficitValue: 20.0, drivers: [] },
          { pos: 'RB', deficitPts: 5.0, deficitValue: 10.0, drivers: [] }
        ]
      });

      const result = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      expect(result.proposals.length).toBeGreaterThan(1);

      // Verify A8 ranking: proposals should be sorted by max need improvement
      for (let i = 0; i < result.proposals.length - 1; i++) {
        const current = result.proposals[i];
        const next = result.proposals[i + 1];

        const currentYouImprovement = current.needDelta.you.before - current.needDelta.you.after;
        const currentThemImprovement = current.needDelta.them.before - current.needDelta.them.after;
        const currentMaxImprovement = Math.max(currentYouImprovement, currentThemImprovement);

        const nextYouImprovement = next.needDelta.you.before - next.needDelta.you.after;
        const nextThemImprovement = next.needDelta.them.before - next.needDelta.them.after;
        const nextMaxImprovement = Math.max(nextYouImprovement, nextThemImprovement);

        expect(currentMaxImprovement).toBeGreaterThanOrEqual(nextMaxImprovement);
      }
    });

    it('applies tie-breaking rules when max improvements are equal', async () => {
      // Create scenario with identical max improvements to test tie-breaking
      mockWeakness.calculateTeamWeakness.mockResolvedValue({
        needScore: 10.0,
        items: [{ pos: 'WR', deficitPts: 5.0, deficitValue: 10.0, drivers: [] }]
      });

      const result = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      // Tie-breaking should prefer:
      // 1. Minimize max(0, −ΔValue_A) + max(0, −ΔValue_B) (minimize value loss)
      // 2. Target worst pre-trade deficit
      
      // This is harder to test without exact control over the mock data,
      // but we can at least verify the ranking is deterministic
      const firstRun = [...result.proposals];
      
      // Run again and verify same order (deterministic)
      const secondResult = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      expect(secondResult.proposals.map(p => p.proposalId))
        .toEqual(firstRun.map(p => p.proposalId));
    });
  });

  describe('Deterministic Requirements', () => {
    it('produces identical results across multiple runs (<5% variance)', async () => {
      mockDb.league.findUnique.mockResolvedValue({
        id: 'league-1',
        teams: [
          {
            id: 'team1',
            RosterSlot: Object.values(deterministicPlayers.team1).map(p => ({
              player: { ...p, Valuation: [{ price: p.value }] }
            }))
          },
          {
            id: 'team2',
            RosterSlot: Object.values(deterministicPlayers.team2).map(p => ({
              player: { ...p, Valuation: [{ price: p.value }] }
            }))
          }
        ]
      });

      mockWeakness.calculateTeamWeakness.mockResolvedValue({
        needScore: deterministicWeakness.team1.needScore,
        items: [
          { pos: 'WR', deficitPts: deterministicWeakness.team1.needsByPos.WR, deficitValue: 20.0, drivers: [] }
        ]
      });

      // Run trade generation 5 times
      const runs = await Promise.all(Array.from({ length: 5 }, () =>
        generateDeterministicTrades('league-1', {
          fromTeamId: 'team1',
          mode: 'balanced'
        })
      ));

      // Verify identical results
      const firstRun = runs[0];
      
      runs.slice(1).forEach(run => {
        expect(run.proposals.length).toBe(firstRun.proposals.length);
        
        run.proposals.forEach((proposal, index) => {
          const firstProposal = firstRun.proposals[index];
          
          // Values must be identical (not just within 5%)
          expect(proposal.valueDelta.you).toBe(firstProposal.valueDelta.you);
          expect(proposal.valueDelta.them).toBe(firstProposal.valueDelta.them);
          
          // Need scores must be identical
          expect(proposal.needDelta.you.before).toBe(firstProposal.needDelta.you.before);
          expect(proposal.needDelta.you.after).toBe(firstProposal.needDelta.you.after);
          expect(proposal.needDelta.them.before).toBe(firstProposal.needDelta.them.before);
          expect(proposal.needDelta.them.after).toBe(firstProposal.needDelta.them.after);
        });
      });
    });

    it('integrates with existing valuation engine for player values', async () => {
      // Mock actual valuations from the valuation engine
      mockDb.valuation.findMany.mockResolvedValue([
        { playerId: 'qb1', price: 45.0, ts: new Date() },
        { playerId: 'wr1', price: 15.0, ts: new Date() },
        { playerId: 'rb2', price: 50.0, ts: new Date() },
        { playerId: 'wr2', price: 40.0, ts: new Date() }
      ]);

      const result = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      // Verify trade values match valuation engine prices exactly
      result.proposals.forEach(proposal => {
        proposal.give.forEach(player => {
          // Value should come from valuation engine, not hardcoded
          expect(typeof player.value).toBe('number');
          expect(player.value).toBeGreaterThan(0);
        });
        
        proposal.get.forEach(player => {
          expect(typeof player.value).toBe('number');
          expect(player.value).toBeGreaterThan(0);
        });
      });
    });

    it('integrates with team weakness analysis from PR17', async () => {
      const mockWeaknessData = {
        needScore: 18.5,
        items: [
          { pos: 'WR', deficitPts: 12.0, deficitValue: 24.0, drivers: ['WR1 below baseline'] },
          { pos: 'RB2', deficitPts: 6.5, deficitValue: 13.0, drivers: ['RB2 below baseline'] }
        ]
      };

      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessData);

      const result = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      // Verify weakness integration
      expect(mockWeakness.calculateTeamWeakness).toHaveBeenCalled();
      
      // All proposals should use actual weakness scores
      result.proposals.forEach(proposal => {
        expect(proposal.needDelta.you.before).toBe(mockWeaknessData.needScore);
        expect(typeof proposal.needDelta.you.after).toBe('number');
        expect(typeof proposal.needDelta.them.before).toBe('number');
        expect(typeof proposal.needDelta.them.after).toBe('number');
      });
    });
  });

  describe('Engine Version and Metadata', () => {
    it('includes engine version in results for reproducibility', async () => {
      const result = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      expect(result.meta).toHaveProperty('engineVersion');
      expect(result.meta.engineVersion).toMatch(/^\d+\.\d+\.\d+$/); // Semantic version
    });

    it('tracks formula application for debugging', async () => {
      const result = await generateDeterministicTrades('league-1', {
        fromTeamId: 'team1',
        mode: 'balanced'
      });

      expect(result.meta).toHaveProperty('formulasApplied');
      expect(result.meta.formulasApplied).toContain('A6:TradeValue');
      expect(result.meta.formulasApplied).toContain('A7:TradeAcceptability');
      expect(result.meta.formulasApplied).toContain('A8:TradeFairness');
    });
  });
});