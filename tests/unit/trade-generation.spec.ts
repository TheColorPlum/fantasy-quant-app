import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateTradeProposals } from '@/lib/trades/generate';

// Mock the dependencies
vi.mock('@/lib/database', () => ({
  db: {
    league: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock('@/lib/teams/weakness', () => ({
  calculateTeamWeakness: vi.fn()
}));

describe('Trade Generation', async () => {
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockWeakness = vi.mocked(await import('@/lib/teams/weakness'));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  const mockLeague = {
    id: 'league-1',
    name: 'Test League',
    teams: [
      {
        id: 'team-1',
        name: 'Team A',
        RosterSlot: [
          {
            player: {
              id: 'qb1',
              name: 'Elite QB',
              posPrimary: 'QB',
              Valuation: [{ price: 45.0 }]
            }
          },
          {
            player: {
              id: 'rb1',
              name: 'Good RB',
              posPrimary: 'RB',
              Valuation: [{ price: 35.0 }]
            }
          },
          {
            player: {
              id: 'wr1',
              name: 'Average WR',
              posPrimary: 'WR',
              Valuation: [{ price: 20.0 }]
            }
          }
        ]
      },
      {
        id: 'team-2',
        name: 'Team B',
        RosterSlot: [
          {
            player: {
              id: 'qb2',
              name: 'Average QB',
              posPrimary: 'QB',
              Valuation: [{ price: 25.0 }]
            }
          },
          {
            player: {
              id: 'rb2',
              name: 'Elite RB',
              posPrimary: 'RB',
              Valuation: [{ price: 50.0 }]
            }
          },
          {
            player: {
              id: 'wr2',
              name: 'Elite WR',
              posPrimary: 'WR',
              Valuation: [{ price: 40.0 }]
            }
          }
        ]
      },
      {
        id: 'team-3',
        name: 'Team C',
        RosterSlot: [
          {
            player: {
              id: 'qb3',
              name: 'Backup QB',
              posPrimary: 'QB',
              Valuation: [{ price: 15.0 }]
            }
          },
          {
            player: {
              id: 'rb3',
              name: 'Backup RB',
              posPrimary: 'RB',
              Valuation: [{ price: 18.0 }]
            }
          },
          {
            player: {
              id: 'wr3',
              name: 'Solid WR',
              posPrimary: 'WR',
              Valuation: [{ price: 25.0 }]
            }
          }
        ]
      }
    ]
  };

  const mockWeaknessResult = {
    needScore: 8.5,
    items: [
      {
        pos: 'WR',
        deficitPts: 5.0,
        deficitValue: 10.0,
        drivers: ['WR below baseline']
      },
      {
        pos: 'RB2',
        deficitPts: 3.5,
        deficitValue: 7.0,
        drivers: ['RB2 below baseline']
      }
    ]
  };

  describe('generateTradeProposals', () => {
    it('generates balanced trade proposals for all teams', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const result = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        mode: 'balanced'
      });

      expect(result.proposals).toBeDefined();
      expect(result.proposals.length).toBeGreaterThan(0);
      expect(result.proposals.length).toBeLessThanOrEqual(5);

      // Check proposal structure
      const proposal = result.proposals[0];
      expect(proposal.proposalId).toMatch(/temp-\d+/);
      expect(proposal.give).toBeDefined();
      expect(proposal.get).toBeDefined();
      expect(proposal.valueDelta).toHaveProperty('you');
      expect(proposal.valueDelta).toHaveProperty('them');
      expect(proposal.needDelta).toHaveProperty('you');
      expect(proposal.needDelta).toHaveProperty('them');
      expect(proposal.rationale).toBeDefined();

      // Check metadata
      expect(result.meta.mode).toBe('balanced');
      expect(result.meta.fromTeamId).toBe('team-1');
      expect(result.meta.targetTeamIds).toEqual(['team-2', 'team-3']);
      expect(result.meta.totalCandidates).toBeGreaterThan(0);
    });

    it('generates strict trade proposals with higher value requirements', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const result = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        mode: 'strict'
      });

      expect(result.meta.mode).toBe('strict');
      expect(result.meta.filteredCandidates).toBeLessThanOrEqual(result.meta.totalCandidates);

      // Strict mode should have fewer or equal proposals than balanced
      const balancedResult = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        mode: 'balanced'
      });

      expect(result.proposals.length).toBeLessThanOrEqual(balancedResult.proposals.length);
    });

    it('respects toTeamId parameter when specified', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const result = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        toTeamId: 'team-2',
        mode: 'balanced'
      });

      expect(result.meta.targetTeamIds).toEqual(['team-2']);
      
      // All proposals should involve team-2
      result.proposals.forEach(proposal => {
        // Check that all received players are from team-2
        proposal.get.forEach(player => {
          const playerInTeam2 = mockLeague.teams[1].RosterSlot.some(
            slot => slot.player.id === player.playerId
          );
          expect(playerInTeam2).toBe(true);
        });
      });
    });

    it('filters by targets parameter when specified', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const result = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        targets: ['rb2'], // Only interested in Elite RB from team-2
        mode: 'balanced'
      });

      // All proposals should include rb2 in the get side
      result.proposals.forEach(proposal => {
        const hasTarget = proposal.get.some(player => player.playerId === 'rb2');
        expect(hasTarget).toBe(true);
      });
    });

    it('filters by sendables parameter when specified', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const result = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        sendables: ['wr1'], // Only willing to trade Average WR
        mode: 'balanced'
      });

      // All proposals should include wr1 in the give side
      result.proposals.forEach(proposal => {
        const hasSendable = proposal.give.some(player => player.playerId === 'wr1');
        expect(hasSendable).toBe(true);
      });
    });

    it('generates different types of trades (1:1, 2:1, 1:2)', async () => {
      // Create a league with more players to enable multi-player trades
      const richLeague = {
        ...mockLeague,
        teams: [
          {
            id: 'team-1',
            name: 'Team A',
            RosterSlot: [
              { player: { id: 'qb1', name: 'Elite QB', posPrimary: 'QB', Valuation: [{ price: 45.0 }] } },
              { player: { id: 'rb1', name: 'Good RB1', posPrimary: 'RB', Valuation: [{ price: 35.0 }] } },
              { player: { id: 'rb1b', name: 'Good RB2', posPrimary: 'RB', Valuation: [{ price: 30.0 }] } },
              { player: { id: 'wr1', name: 'Average WR1', posPrimary: 'WR', Valuation: [{ price: 20.0 }] } },
              { player: { id: 'wr1b', name: 'Average WR2', posPrimary: 'WR', Valuation: [{ price: 18.0 }] } }
            ]
          },
          {
            id: 'team-2',
            name: 'Team B',
            RosterSlot: [
              { player: { id: 'qb2', name: 'Average QB', posPrimary: 'QB', Valuation: [{ price: 25.0 }] } },
              { player: { id: 'rb2', name: 'Elite RB', posPrimary: 'RB', Valuation: [{ price: 70.0 }] } },
              { player: { id: 'wr2', name: 'Decent WR1', posPrimary: 'WR', Valuation: [{ price: 25.0 }] } },
              { player: { id: 'wr2b', name: 'Decent WR2', posPrimary: 'WR', Valuation: [{ price: 22.0 }] } }
            ]
          }
        ]
      };

      mockDb.league.findUnique.mockResolvedValue(richLeague);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const result = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        mode: 'balanced'
      });

      // Should have a mix of trade types
      const tradeTypes = new Set();
      result.proposals.forEach(proposal => {
        const giveCount = proposal.give.length;
        const getCount = proposal.get.length;
        tradeTypes.add(`${giveCount}:${getCount}`);
      });

      expect(tradeTypes.size).toBeGreaterThan(1); // Should have multiple trade types
    });

    it('throws error for non-existent league', async () => {
      mockDb.league.findUnique.mockResolvedValue(null);

      await expect(generateTradeProposals('nonexistent', {
        fromTeamId: 'team-1'
      })).rejects.toThrow('League nonexistent not found');
    });

    it('throws error for non-existent from team', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);

      await expect(generateTradeProposals('league-1', {
        fromTeamId: 'nonexistent'
      })).rejects.toThrow('Team nonexistent not found in league league-1');
    });

    it('throws error for non-existent target team', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);

      await expect(generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        toTeamId: 'nonexistent'
      })).rejects.toThrow('Target team nonexistent not found in league league-1');
    });

    it('handles empty roster gracefully', async () => {
      const emptyLeague = {
        ...mockLeague,
        teams: [
          {
            id: 'team-1',
            name: 'Empty Team',
            RosterSlot: []
          },
          {
            id: 'team-2',
            name: 'Team B',
            RosterSlot: [
              {
                player: {
                  id: 'rb2',
                  name: 'Elite RB',
                  posPrimary: 'RB',
                  Valuation: [{ price: 50.0 }]
                }
              }
            ]
          }
        ]
      };

      mockDb.league.findUnique.mockResolvedValue(emptyLeague);
      mockWeakness.calculateTeamWeakness.mockResolvedValue({ needScore: 0, items: [] });

      const result = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        mode: 'balanced'
      });

      expect(result.proposals).toHaveLength(0);
      expect(result.meta.totalCandidates).toBe(0);
    });

    it('defaults to balanced mode when mode not specified', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const result = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1'
        // mode not specified
      });

      expect(result.meta.mode).toBe('balanced');
    });

    it('generates reasonable rationales for trades', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const result = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        mode: 'balanced'
      });

      result.proposals.forEach(proposal => {
        expect(proposal.rationale).toBeDefined();
        expect(proposal.rationale.length).toBeGreaterThan(10);
        
        // Should mention player names
        proposal.give.forEach(player => {
          expect(proposal.rationale).toContain(player.playerName);
        });
        
        proposal.get.forEach(player => {
          expect(proposal.rationale).toContain(player.playerName);
        });
      });
    });

    it('calculates value deltas correctly', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const result = await generateTradeProposals('league-1', {
        fromTeamId: 'team-1',
        mode: 'balanced'
      });

      result.proposals.forEach(proposal => {
        const giveValue = proposal.give.reduce((sum, player) => sum + player.value, 0);
        const getValue = proposal.get.reduce((sum, player) => sum + player.value, 0);
        
        const expectedYouDelta = getValue - giveValue;
        const expectedThemDelta = giveValue - getValue;
        
        expect(proposal.valueDelta.you).toBeCloseTo(expectedYouDelta, 2);
        expect(proposal.valueDelta.them).toBeCloseTo(expectedThemDelta, 2);
      });
    });
  });
});