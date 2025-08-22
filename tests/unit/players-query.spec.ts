import { describe, it, expect, vi, beforeEach } from 'vitest';
import { queryPlayers, getAvailablePositions, getOwnershipStats } from '@/lib/players/query';

// Mock the database
vi.mock('@/lib/database', () => ({
  db: {
    player: {
      findMany: vi.fn(),
      groupBy: vi.fn()
    }
  }
}));

describe('Players Query', async () => {
  const mockDb = vi.mocked(await import('@/lib/database')).db;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('queryPlayers', () => {
    const mockPlayers = [
      {
        id: 'player-1',
        name: 'Josh Allen',
        posPrimary: 'QB',
        teamAbbr: 'BUF',
        Valuation: [
          {
            price: 45.2,
            ts: new Date('2025-01-22'),
            components: {
              anchor: 20.1,
              deltaPerf: 12.5,
              vorp: 8.9,
              global: 3.7
            }
          }
        ],
        RosterSlot: [
          {
            team: {
              id: 'team-1',
              name: 'Team Alpha'
            }
          }
        ]
      },
      {
        id: 'player-2',
        name: 'Christian McCaffrey',
        posPrimary: 'RB',
        teamAbbr: 'SF',
        Valuation: [
          {
            price: 52.8,
            ts: new Date('2025-01-22'),
            components: {
              anchor: 25.3,
              deltaPerf: 15.2,
              vorp: 9.1,
              global: 3.2
            }
          }
        ],
        RosterSlot: [] // Available player
      },
      {
        id: 'player-3',
        name: 'Cooper Kupp',
        posPrimary: 'WR',
        teamAbbr: 'LAR',
        Valuation: [],
        RosterSlot: []
      }
    ];

    it('returns players with valuations and ownership info', async () => {
      mockDb.player.findMany.mockResolvedValue(mockPlayers);

      const result = await queryPlayers('league-1', {});

      expect(result.items).toHaveLength(3);
      
      // Check first player (owned)
      expect(result.items[0]).toEqual({
        playerId: 'player-1',
        name: 'Josh Allen',
        pos: 'QB',
        team: 'BUF',
        ownedByTeamId: 'team-1',
        ownedByTeamName: 'Team Alpha',
        valuation: {
          price: 45.2,
          components: {
            anchor: 20.1,
            deltaPerf: 12.5,
            vorp: 8.9,
            global: 3.7
          }
        }
      });

      // Check second player (available)
      expect(result.items[1]).toEqual({
        playerId: 'player-2',
        name: 'Christian McCaffrey',
        pos: 'RB',
        team: 'SF',
        ownedByTeamId: null,
        ownedByTeamName: null,
        valuation: {
          price: 52.8,
          components: {
            anchor: 25.3,
            deltaPerf: 15.2,
            vorp: 9.1,
            global: 3.2
          }
        }
      });

      // Check third player (no valuation)
      expect(result.items[2]).toEqual({
        playerId: 'player-3',
        name: 'Cooper Kupp',
        pos: 'WR',
        team: 'LAR',
        ownedByTeamId: null,
        ownedByTeamName: null,
        valuation: null
      });
    });

    it('applies search filter', async () => {
      mockDb.player.findMany.mockResolvedValue([mockPlayers[0]]);

      await queryPlayers('league-1', { search: 'Josh' });

      expect(mockDb.player.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'Josh',
            mode: 'insensitive'
          }
        },
        orderBy: [
          {
            Valuation: {
              _count: 'desc'
            }
          },
          { id: 'asc' }
        ],
        take: 21,
        include: expect.any(Object)
      });
    });

    it('applies position filter', async () => {
      mockDb.player.findMany.mockResolvedValue([mockPlayers[0]]);

      await queryPlayers('league-1', { pos: 'QB' });

      expect(mockDb.player.findMany).toHaveBeenCalledWith({
        where: {
          posPrimary: 'QB'
        },
        orderBy: expect.any(Array),
        take: 21,
        include: expect.any(Object)
      });
    });

    it('applies ownership filter - owned only', async () => {
      mockDb.player.findMany.mockResolvedValue(mockPlayers);

      const result = await queryPlayers('league-1', { owned: 'owned' });

      // Should only return owned players (player-1)
      expect(result.items).toHaveLength(1);
      expect(result.items[0].playerId).toBe('player-1');
      expect(result.items[0].ownedByTeamId).not.toBe(null);
    });

    it('applies ownership filter - available only', async () => {
      mockDb.player.findMany.mockResolvedValue(mockPlayers);

      const result = await queryPlayers('league-1', { owned: 'available' });

      // Should only return available players (player-2, player-3)
      expect(result.items).toHaveLength(2);
      expect(result.items[0].playerId).toBe('player-2');
      expect(result.items[1].playerId).toBe('player-3');
      result.items.forEach(item => {
        expect(item.ownedByTeamId).toBe(null);
      });
    });

    it('applies different sort orders', async () => {
      mockDb.player.findMany.mockResolvedValue(mockPlayers);

      // Test name sort
      await queryPlayers('league-1', { sort: 'name' });
      expect(mockDb.player.findMany).toHaveBeenLastCalledWith({
        where: {},
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        take: 21,
        include: expect.any(Object)
      });

      // Test position sort
      await queryPlayers('league-1', { sort: 'position' });
      expect(mockDb.player.findMany).toHaveBeenLastCalledWith({
        where: {},
        orderBy: [{ posPrimary: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        take: 21,
        include: expect.any(Object)
      });

      // Test team sort
      await queryPlayers('league-1', { sort: 'team' });
      expect(mockDb.player.findMany).toHaveBeenLastCalledWith({
        where: {},
        orderBy: [{ teamAbbr: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        take: 21,
        include: expect.any(Object)
      });
    });

    it('handles pagination with cursor', async () => {
      mockDb.player.findMany.mockResolvedValue(mockPlayers);

      await queryPlayers('league-1', { cursor: 'player-5', limit: 10 });

      expect(mockDb.player.findMany).toHaveBeenCalledWith({
        where: {
          id: { gt: 'player-5' }
        },
        orderBy: expect.any(Array),
        take: 11, // limit + 1
        include: expect.any(Object)
      });
    });

    it('detects when there are more results', async () => {
      // Return 21 players when limit is 20
      const manyPlayers = Array.from({ length: 21 }, (_, i) => ({
        ...mockPlayers[0],
        id: `player-${i + 1}`,
        name: `Player ${i + 1}`,
        Valuation: [],
        RosterSlot: []
      }));
      
      mockDb.player.findMany.mockResolvedValue(manyPlayers);

      const result = await queryPlayers('league-1', { limit: 20 });

      expect(result.hasMore).toBe(true);
      expect(result.items).toHaveLength(20); // Should limit to requested amount
      expect(result.nextCursor).toBe('player-20');
    });

    it('handles players with null valuation components', async () => {
      const playerWithNullComponents = {
        ...mockPlayers[0],
        Valuation: [
          {
            price: 25.0,
            ts: new Date('2025-01-22'),
            components: null
          }
        ]
      };

      mockDb.player.findMany.mockResolvedValue([playerWithNullComponents]);

      const result = await queryPlayers('league-1', {});

      expect(result.items[0].valuation).toEqual({
        price: 25.0,
        components: {}
      });
    });
  });

  describe('getAvailablePositions', () => {
    it('returns unique positions from league players', async () => {
      mockDb.player.findMany.mockResolvedValue([
        { posPrimary: 'QB' },
        { posPrimary: 'RB' },
        { posPrimary: 'WR' },
        { posPrimary: 'TE' }
      ]);

      const positions = await getAvailablePositions('league-1');

      expect(positions).toEqual(['QB', 'RB', 'WR', 'TE']);
      expect(mockDb.player.findMany).toHaveBeenCalledWith({
        where: {
          RosterSlot: {
            some: {
              team: { leagueId: 'league-1' }
            }
          }
        },
        select: {
          posPrimary: true
        },
        distinct: ['posPrimary'],
        orderBy: {
          posPrimary: 'asc'
        }
      });
    });
  });

  describe('getOwnershipStats', () => {
    it('returns ownership statistics by position', async () => {
      mockDb.player.groupBy.mockResolvedValue([
        { posPrimary: 'QB', _count: { id: 2 } },
        { posPrimary: 'RB', _count: { id: 4 } },
        { posPrimary: 'WR', _count: { id: 6 } },
        { posPrimary: 'TE', _count: { id: 2 } }
      ]);

      const stats = await getOwnershipStats('league-1');

      expect(stats).toEqual({
        totalOwned: 14,
        byPosition: {
          'QB': 2,
          'RB': 4,
          'WR': 6,
          'TE': 2
        }
      });

      expect(mockDb.player.groupBy).toHaveBeenCalledWith({
        by: ['posPrimary'],
        where: {
          RosterSlot: {
            some: {
              team: { leagueId: 'league-1' }
            }
          }
        },
        _count: {
          id: true
        }
      });
    });

    it('handles empty ownership stats', async () => {
      mockDb.player.groupBy.mockResolvedValue([]);

      const stats = await getOwnershipStats('league-1');

      expect(stats).toEqual({
        totalOwned: 0,
        byPosition: {}
      });
    });
  });
});