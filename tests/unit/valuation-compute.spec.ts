import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeLeagueValuations, saveValuations } from '@/lib/valuation/compute';

// Mock the database
vi.mock('@/lib/database', () => ({
  db: {
    league: {
      findUnique: vi.fn()
    },
    player: {
      findMany: vi.fn()
    },
    replacementBaseline: {
      findMany: vi.fn()
    },
    valuation: {
      deleteMany: vi.fn(),
      createMany: vi.fn()
    }
  }
}));

describe('Valuation Engine', async () => {
  const mockDb = vi.mocked(await import('@/lib/database')).db;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  const mockLeague = {
    id: 'league-1',
    espnLeagueId: '12345',
    season: 2025,
    name: 'Test League',
    scoringJson: {},
    rosterRulesJson: {},
    auctionBudget: 200,
    firstLoadedAt: new Date(),
    createdBy: null,
    teams: [
      {
        id: 'team-1',
        RosterSlot: [
          { playerId: 'player-1' },
          { playerId: 'player-2' }
        ]
      },
      {
        id: 'team-2',
        RosterSlot: [
          { playerId: 'player-3' }
        ]
      }
    ]
  };

  const mockPlayers = [
    {
      id: 'player-1',
      name: 'Josh Allen',
      posPrimary: 'QB',
      AuctionPrice: [
        {
          amount: 45.0,
          createdAt: new Date('2025-01-20')
        }
      ],
      GameLog: [
        { week: 4, ptsActual: 28.5 },
        { week: 3, ptsActual: 22.1 },
        { week: 2, ptsActual: 31.4 },
        { week: 1, ptsActual: 19.8 }
      ],
      Projection: [
        { week: 5, ptsMean: 24.2 },
        { week: 6, ptsMean: 26.1 }
      ]
    },
    {
      id: 'player-2', 
      name: 'Christian McCaffrey',
      posPrimary: 'RB',
      AuctionPrice: [],
      GameLog: [
        { week: 4, ptsActual: 35.2 },
        { week: 3, ptsActual: 18.7 },
        { week: 2, ptsActual: 42.1 }
      ],
      Projection: []
    },
    {
      id: 'player-3',
      name: 'Cooper Kupp',
      posPrimary: 'WR', 
      AuctionPrice: [
        {
          amount: 38.5,
          createdAt: new Date('2025-01-20')
        }
      ],
      GameLog: [],
      Projection: [
        { week: 4, ptsMean: 18.5 },
        { week: 5, ptsMean: 20.1 }
      ]
    }
  ];

  const mockBaselines = [
    { pos: 'QB', ptsPerGame: 15.5, season: 2025 },
    { pos: 'RB', ptsPerGame: 12.8, season: 2025 },
    { pos: 'WR', ptsPerGame: 11.2, season: 2025 },
    { pos: 'TE', ptsPerGame: 8.9, season: 2025 }
  ];

  describe('computeLeagueValuations', () => {
    it('computes valuations for all league players', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockDb.player.findMany.mockResolvedValue(mockPlayers);
      mockDb.replacementBaseline.findMany.mockResolvedValue(mockBaselines);

      const result = await computeLeagueValuations('league-1');

      expect(result.leagueId).toBe('league-1');
      expect(result.engineVersion).toBe('0.1.0');
      expect(result.valuations).toHaveLength(3);
      expect(result.computedAt).toBeInstanceOf(Date);
      
      // Check first player (Josh Allen with auction price)
      const allenValuation = result.valuations.find(v => v.playerName === 'Josh Allen');
      expect(allenValuation).toBeDefined();
      expect(allenValuation?.position).toBe('QB');
      expect(allenValuation?.price).toBeGreaterThan(0);
      expect(allenValuation?.components.anchor).toBe(45.0); // Should use auction price
      
      // Check second player (CMC without auction price)
      const cmcValuation = result.valuations.find(v => v.playerName === 'Christian McCaffrey');
      expect(cmcValuation).toBeDefined();
      expect(cmcValuation?.position).toBe('RB');
      expect(cmcValuation?.components.anchor).toBe(20.0); // Should use RB baseline
      
      // Check metadata
      expect(result.metadata.totalPlayers).toBe(3);
      expect(result.metadata.avgPrice).toBeGreaterThan(0);
      expect(result.metadata.priceRange.min).toBeGreaterThan(0);
      expect(result.metadata.priceRange.max).toBeGreaterThan(result.metadata.priceRange.min);
    });

    it('handles league with no players', async () => {
      const emptyLeague = {
        ...mockLeague,
        teams: [
          {
            id: 'team-1',
            RosterSlot: []
          }
        ]
      };

      mockDb.league.findUnique.mockResolvedValue(emptyLeague);

      const result = await computeLeagueValuations('league-1');

      expect(result.valuations).toHaveLength(0);
      expect(result.metadata.totalPlayers).toBe(0);
      expect(result.metadata.avgPrice).toBe(0);
      expect(result.metadata.priceRange).toEqual({ min: 0, max: 0 });
    });

    it('throws error for non-existent league', async () => {
      mockDb.league.findUnique.mockResolvedValue(null);

      await expect(computeLeagueValuations('nonexistent')).rejects.toThrow('League nonexistent not found');
    });

    it('handles players with missing data gracefully', async () => {
      const playersWithMissingData = [
        {
          id: 'player-1',
          name: 'Unknown Player',
          posPrimary: 'UNKNOWN_POS', // Invalid position
          AuctionPrice: [],
          GameLog: [],
          Projection: []
        }
      ];

      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockDb.player.findMany.mockResolvedValue(playersWithMissingData);
      mockDb.replacementBaseline.findMany.mockResolvedValue(mockBaselines);

      const result = await computeLeagueValuations('league-1');

      // Should skip players with invalid positions
      expect(result.valuations).toHaveLength(0);
    });

    it('calculates delta performance correctly', async () => {
      // Player with consistent upward trend
      const trendingPlayer = {
        id: 'player-trend',
        name: 'Trending Player',
        posPrimary: 'WR',
        AuctionPrice: [{ amount: 25.0, createdAt: new Date() }],
        GameLog: [
          { week: 6, ptsActual: 30.0 }, // Recent 4 weeks: (30+30+20+20)/4 = 25.0 avg
          { week: 5, ptsActual: 30.0 },
          { week: 4, ptsActual: 20.0 }, 
          { week: 3, ptsActual: 20.0 },
          { week: 2, ptsActual: 10.0 }, // Season (6 weeks): (30+30+20+20+10+10)/6 = 20.0 avg
          { week: 1, ptsActual: 10.0 }
        ],
        Projection: []
      };

      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockDb.player.findMany.mockResolvedValue([trendingPlayer]);
      mockDb.replacementBaseline.findMany.mockResolvedValue(mockBaselines);

      const result = await computeLeagueValuations('league-1');

      const valuation = result.valuations[0];
      // Recent avg: 25.0, Season avg: 20.0, Delta: (25-20) * 2 = 10.0
      expect(valuation.components.deltaPerf).toBeCloseTo(10.0, 1);
    });

    it('calculates VORP correctly', async () => {
      // Elite QB significantly above replacement level
      const eliteQB = {
        id: 'elite-qb',
        name: 'Elite QB',
        posPrimary: 'QB',
        AuctionPrice: [{ amount: 50.0, createdAt: new Date() }],
        GameLog: [
          { week: 4, ptsActual: 25.5 }, // Avg: 25.5 points
          { week: 3, ptsActual: 25.5 }
        ],
        Projection: []
      };

      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockDb.player.findMany.mockResolvedValue([eliteQB]);
      mockDb.replacementBaseline.findMany.mockResolvedValue(mockBaselines);

      const result = await computeLeagueValuations('league-1');

      const valuation = result.valuations[0];
      // VORP should be (25.5 - 15.5) * 1.5 = 15.0
      expect(valuation.components.vorp).toBeCloseTo(15.0, 1);
    });

    it('applies position-specific clamps', async () => {
      // Player with calculated price that should be clamped
      const extremePlayer = {
        id: 'extreme-player',
        name: 'Extreme Player',
        posPrimary: 'K', // Kicker with low max clamp (15.0)
        AuctionPrice: [{ amount: 100.0, createdAt: new Date() }], // Very high auction price
        GameLog: [],
        Projection: []
      };

      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockDb.player.findMany.mockResolvedValue([extremePlayer]);
      mockDb.replacementBaseline.findMany.mockResolvedValue(mockBaselines);

      const result = await computeLeagueValuations('league-1');

      const valuation = result.valuations[0];
      // Price should be clamped to kicker maximum
      expect(valuation.price).toBeLessThanOrEqual(15.0);
      expect(valuation.price).toBeGreaterThanOrEqual(0.5); // Above minimum
    });

    it('rounds prices and components to 2 decimal places', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockDb.player.findMany.mockResolvedValue([mockPlayers[0]]);
      mockDb.replacementBaseline.findMany.mockResolvedValue(mockBaselines);

      const result = await computeLeagueValuations('league-1');

      const valuation = result.valuations[0];
      
      // Check price rounding
      expect(valuation.price).toBe(Math.round(valuation.price * 100) / 100);
      
      // Check component rounding
      expect(valuation.components.anchor).toBe(Math.round(valuation.components.anchor * 100) / 100);
      expect(valuation.components.deltaPerf).toBe(Math.round(valuation.components.deltaPerf * 100) / 100);
      expect(valuation.components.vorp).toBe(Math.round(valuation.components.vorp * 100) / 100);
      expect(valuation.components.global).toBe(Math.round(valuation.components.global * 100) / 100);
    });

    it('component weights sum correctly', async () => {
      mockDb.league.findUnique.mockResolvedValue(mockLeague);
      mockDb.player.findMany.mockResolvedValue([mockPlayers[0]]);
      mockDb.replacementBaseline.findMany.mockResolvedValue(mockBaselines);

      const result = await computeLeagueValuations('league-1');

      const valuation = result.valuations[0];
      const { anchor, deltaPerf, vorp, global } = valuation.components;
      
      // Manually calculate using component weights
      const expectedPrice = 
        0.45 * anchor +                    // 45% of anchor
        0.20 * (anchor + deltaPerf) +      // 20% of (anchor + deltaPerf) 
        0.25 * vorp +                      // 25% of vorp
        0.10 * global;                     // 10% of global
      
      // Should match calculated price (before clamping)
      const clampedExpected = Math.max(1.0, Math.min(80.0, expectedPrice)); // QB clamps
      expect(valuation.price).toBeCloseTo(clampedExpected, 2);
    });
  });

  describe('saveValuations', () => {
    it('saves valuations to database', async () => {
      const mockResult = {
        leagueId: 'league-1',
        engineVersion: '0.1.0',
        computedAt: new Date(),
        valuations: [
          {
            playerId: 'player-1',
            playerName: 'Test Player',
            position: 'QB',
            price: 25.5,
            components: {
              anchor: 20.0,
              deltaPerf: 2.5,
              vorp: 8.0,
              global: 2.0
            }
          }
        ],
        metadata: {
          totalPlayers: 1,
          avgPrice: 25.5,
          priceRange: { min: 25.5, max: 25.5 }
        }
      };

      mockDb.valuation.deleteMany.mockResolvedValue({ count: 0 });
      mockDb.valuation.createMany.mockResolvedValue({ count: 1 });

      await saveValuations(mockResult);

      expect(mockDb.valuation.deleteMany).toHaveBeenCalledWith({
        where: {
          leagueId: 'league-1',
          engineVersion: '0.1.0'
        }
      });

      expect(mockDb.valuation.createMany).toHaveBeenCalledWith({
        data: [
          {
            leagueId: 'league-1',
            playerId: 'player-1',
            price: 25.5,
            components: {
              anchor: 20.0,
              deltaPerf: 2.5,
              vorp: 8.0,
              global: 2.0
            },
            ts: mockResult.computedAt,
            engineVersion: '0.1.0'
          }
        ],
        skipDuplicates: true
      });
    });

    it('handles large valuation sets with batching', async () => {
      // Create a large set of valuations (200 players)
      const largeMockResult = {
        leagueId: 'league-1',
        engineVersion: '0.1.0',
        computedAt: new Date(),
        valuations: Array.from({ length: 200 }, (_, i) => ({
          playerId: `player-${i}`,
          playerName: `Player ${i}`,
          position: 'WR',
          price: 10.0 + i,
          components: {
            anchor: 10.0,
            deltaPerf: 0.0,
            vorp: 5.0,
            global: 2.0
          }
        })),
        metadata: {
          totalPlayers: 200,
          avgPrice: 100.0,
          priceRange: { min: 10.0, max: 209.0 }
        }
      };

      mockDb.valuation.deleteMany.mockResolvedValue({ count: 0 });
      mockDb.valuation.createMany.mockResolvedValue({ count: 100 });

      await saveValuations(largeMockResult);

      // Should call createMany twice (2 batches of 100)
      expect(mockDb.valuation.createMany).toHaveBeenCalledTimes(2);
    });
  });
});