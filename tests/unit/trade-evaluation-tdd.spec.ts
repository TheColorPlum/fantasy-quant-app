import { describe, it, expect } from 'vitest';

/**
 * PR19 - Trade Evaluation (fairness + rationale) - TDD Formula Tests
 * 
 * This test file ensures the trade evaluation engine implements precise
 * fairness scoring and human-readable rationale for arbitrary trade proposals.
 * 
 * Key Requirements:
 * - evaluateTrade function returns fairness score ∈ [0,1] 
 * - Symmetric evaluation: Team A vs Team B gives inverse fairness scores
 * - Human-readable rationale explaining why trades are fair/unfair
 * - Use TDD A10 formulas for ΔValue and ΔNeed calculations
 * - Bounded fairness scoring with mathematical soundness
 */

import { evaluateTrade } from '@/lib/trade-engine';

describe('Trade Evaluation Engine - TDD Fairness & Rationale', () => {
  // Test fixture: deterministic player data with exact values
  const deterministicPlayers = {
    qb1: { id: 'qb1', name: 'QB Elite', position: 'QB', value: 45.0 },
    rb1: { id: 'rb1', name: 'RB Good', position: 'RB', value: 35.0 },
    wr1: { id: 'wr1', name: 'WR Weak', position: 'WR', value: 15.0 },
    qb2: { id: 'qb2', name: 'QB Average', position: 'QB', value: 25.0 },
    rb2: { id: 'rb2', name: 'RB Average', position: 'RB', value: 20.0 },
    wr2: { id: 'wr2', name: 'WR Good', position: 'WR', value: 30.0 },
  };

  const mockTeamData = {
    teamA: {
      id: 'team1',
      players: [deterministicPlayers.qb1, deterministicPlayers.rb1, deterministicPlayers.wr1],
      needScore: 15.5,
      totalValue: 95.0
    },
    teamB: {  
      id: 'team2',
      players: [deterministicPlayers.qb2, deterministicPlayers.rb2, deterministicPlayers.wr2],
      needScore: 22.3,
      totalValue: 75.0
    }
  };

  describe('Fairness Score Calculation', () => {
    it('should return fairness score between 0 and 1 for any trade', () => {
      const trade = {
        teamA: { gives: [deterministicPlayers.qb1], gets: [deterministicPlayers.qb2] },
        teamB: { gives: [deterministicPlayers.qb2], gets: [deterministicPlayers.qb1] }
      };

      const result = evaluateTrade(trade, mockTeamData);

      expect(result.fairnessScore).toBeGreaterThanOrEqual(0);
      expect(result.fairnessScore).toBeLessThanOrEqual(1);
      expect(typeof result.fairnessScore).toBe('number');
      expect(Number.isFinite(result.fairnessScore)).toBe(true);
    });

    it('should return symmetric fairness scores for inverse trades', () => {
      const tradeAB = {
        teamA: { gives: [deterministicPlayers.qb1], gets: [deterministicPlayers.rb2, deterministicPlayers.wr2] },
        teamB: { gives: [deterministicPlayers.rb2, deterministicPlayers.wr2], gets: [deterministicPlayers.qb1] }
      };

      const tradeBA = {
        teamA: { gives: [deterministicPlayers.rb2, deterministicPlayers.wr2], gets: [deterministicPlayers.qb1] },
        teamB: { gives: [deterministicPlayers.qb1], gets: [deterministicPlayers.rb2, deterministicPlayers.wr2] }
      };

      const resultAB = evaluateTrade(tradeAB, mockTeamData);
      const resultBA = evaluateTrade(tradeBA, mockTeamData);

      // Fairness should be symmetric within small tolerance
      expect(Math.abs(resultAB.fairnessScore - (1 - resultBA.fairnessScore))).toBeLessThan(0.05);
    });

    it('should return different fairness scores for balanced vs unbalanced value trades', () => {
      const balancedTrade = {
        teamA: { gives: [deterministicPlayers.rb1], gets: [deterministicPlayers.wr2] },
        teamB: { gives: [deterministicPlayers.wr2], gets: [deterministicPlayers.rb1] }
      };

      const unbalancedTrade = {
        teamA: { gives: [deterministicPlayers.qb1], gets: [deterministicPlayers.wr1] },
        teamB: { gives: [deterministicPlayers.wr1], gets: [deterministicPlayers.qb1] }
      };

      const balancedResult = evaluateTrade(balancedTrade, mockTeamData);
      const unbalancedResult = evaluateTrade(unbalancedTrade, mockTeamData);

      // Balanced trade (35 vs 30 = 5 point diff) should be closer to 0.5 than unbalanced (45 vs 15 = 30 point diff)
      expect(Math.abs(balancedResult.fairnessScore - 0.5)).toBeLessThan(Math.abs(unbalancedResult.fairnessScore - 0.5));
    });

    it('should return 0.5 fairness for perfectly equal value trades', () => {
      // Create players with exactly equal values
      const equalPlayer1 = { id: 'eq1', name: 'Equal Player 1', position: 'RB', value: 30.0 };
      const equalPlayer2 = { id: 'eq2', name: 'Equal Player 2', position: 'WR', value: 30.0 };

      const equalTrade = {
        teamA: { gives: [equalPlayer1], gets: [equalPlayer2] },
        teamB: { gives: [equalPlayer2], gets: [equalPlayer1] }
      };

      const result = evaluateTrade(equalTrade, mockTeamData);

      expect(result.fairnessScore).toBeCloseTo(0.5, 2);
    });
  });

  describe('Rationale Generation', () => {
    it('should provide human-readable rationale for trade evaluation', () => {
      const trade = {
        teamA: { gives: [deterministicPlayers.qb1], gets: [deterministicPlayers.rb2, deterministicPlayers.wr2] },
        teamB: { gives: [deterministicPlayers.rb2, deterministicPlayers.wr2], gets: [deterministicPlayers.qb1] }
      };

      const result = evaluateTrade(trade, mockTeamData);

      expect(result.rationale).toBeTruthy();
      expect(typeof result.rationale).toBe('string');
      expect(result.rationale.length).toBeGreaterThan(10);
      expect(result.rationale).toMatch(/\b(value|fair|unfair|advantage|balanced)\b/i);
    });

    it('should mention value differential in rationale for unbalanced trades', () => {
      const unbalancedTrade = {
        teamA: { gives: [deterministicPlayers.wr1], gets: [deterministicPlayers.qb1] },
        teamB: { gives: [deterministicPlayers.qb1], gets: [deterministicPlayers.wr1] }
      };

      const result = evaluateTrade(unbalancedTrade, mockTeamData);

      expect(result.rationale.toLowerCase()).toMatch(/value|advantage|differential/);
    });

    it('should mention position balance in rationale', () => {
      const positionTrade = {
        teamA: { gives: [deterministicPlayers.qb1], gets: [deterministicPlayers.rb2] },
        teamB: { gives: [deterministicPlayers.rb2], gets: [deterministicPlayers.qb1] }
      };

      const result = evaluateTrade(positionTrade, mockTeamData);

      expect(result.rationale.toLowerCase()).toMatch(/position|qb|rb/);
    });
  });

  describe('TDD A10 Formula Implementation', () => {
    it('should calculate ΔValue using TDD A10 formula: ΔValue_A = Σ Price(get_A) − Σ Price(give_A)', () => {
      const trade = {
        teamA: { gives: [deterministicPlayers.rb1], gets: [deterministicPlayers.rb2, deterministicPlayers.wr1] },
        teamB: { gives: [deterministicPlayers.rb2, deterministicPlayers.wr1], gets: [deterministicPlayers.rb1] }
      };

      const result = evaluateTrade(trade, mockTeamData);

      // ΔValue_A = (20 + 15) - 35 = 0
      // ΔValue_B = 35 - (20 + 15) = 0
      expect(result.valueDeltas.teamA).toBeCloseTo(0, 1);
      expect(result.valueDeltas.teamB).toBeCloseTo(0, 1);
    });

    it('should handle asymmetric value trades correctly', () => {
      const trade = {
        teamA: { gives: [deterministicPlayers.wr1], gets: [deterministicPlayers.wr2] },
        teamB: { gives: [deterministicPlayers.wr2], gets: [deterministicPlayers.wr1] }
      };

      const result = evaluateTrade(trade, mockTeamData);

      // ΔValue_A = 30 - 15 = 15
      // ΔValue_B = 15 - 30 = -15
      expect(result.valueDeltas.teamA).toBeCloseTo(15, 1);
      expect(result.valueDeltas.teamB).toBeCloseTo(-15, 1);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle empty trade gracefully', () => {
      const emptyTrade = {
        teamA: { gives: [], gets: [] },
        teamB: { gives: [], gets: [] }
      };

      expect(() => evaluateTrade(emptyTrade, mockTeamData)).not.toThrow();
    });

    it('should handle single-sided trades', () => {
      const onesidedTrade = {
        teamA: { gives: [deterministicPlayers.qb1], gets: [] },
        teamB: { gives: [], gets: [deterministicPlayers.qb1] }
      };

      const result = evaluateTrade(onesidedTrade, mockTeamData);

      expect(result.fairnessScore).toBeGreaterThanOrEqual(0);
      expect(result.fairnessScore).toBeLessThanOrEqual(1);
    });

    it('should handle missing player values', () => {
      const playerWithoutValue = { id: 'missing', name: 'No Value', position: 'QB' }; // Missing 'value' property

      const trade = {
        teamA: { gives: [playerWithoutValue], gets: [deterministicPlayers.qb1] },
        teamB: { gives: [deterministicPlayers.qb1], gets: [playerWithoutValue] }
      };

      expect(() => evaluateTrade(trade, mockTeamData)).not.toThrow();
    });
  });
});