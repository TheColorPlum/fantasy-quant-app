import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, HEAD } from '@/app/api/leagues/[id]/players/route';

// Mock dependencies
vi.mock('@/lib/database', () => ({
  db: {
    league: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn()
}));

vi.mock('@/lib/players/query', () => ({
  queryPlayers: vi.fn(),
  getAvailablePositions: vi.fn(),
  getOwnershipStats: vi.fn()
}));

describe('Players API', async () => {
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockAuth = vi.mocked(await import('@/lib/auth'));
  const mockQuery = vi.mocked(await import('@/lib/players/query'));

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default auth mock
    mockAuth.getSessionUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com'
    });

    // Default league mock with team claim
    mockDb.league.findUnique.mockResolvedValue({
      id: 'league-1',
      espnLeagueId: '12345',
      name: 'Test League',
      season: 2025,
      scoringJson: {},
      rosterRulesJson: {},
      auctionBudget: 200,
      firstLoadedAt: new Date(),
      createdBy: null,
      teams: [],
      TeamClaim: [
        {
          id: 'claim-1',
          leagueId: 'league-1',
          teamId: 'team-1',
          userId: 'user-1',
          claimedAt: new Date()
        }
      ]
    });

    // Default query mocks
    mockQuery.queryPlayers.mockResolvedValue({
      items: [
        {
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
        },
        {
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
        }
      ],
      nextCursor: 'player-2',
      hasMore: true
    });

    mockQuery.getAvailablePositions.mockResolvedValue(['QB', 'RB', 'WR', 'TE']);
    mockQuery.getOwnershipStats.mockResolvedValue({
      totalOwned: 150,
      byPosition: {
        'QB': 12,
        'RB': 48,
        'WR': 60,
        'TE': 24,
        'K': 6
      }
    });
  });

  const createRequest = (queryParams: Record<string, string> = {}) => {
    const url = new URL('http://localhost:3000/api/leagues/league-1/players');
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return new NextRequest(url.toString(), {
      method: 'GET'
    });
  };

  const createHeadRequest = () => {
    return new NextRequest('http://localhost:3000/api/leagues/league-1/players', {
      method: 'HEAD'
    });
  };

  describe('GET /api/leagues/[id]/players', () => {
    it('returns players data with default parameters', async () => {
      const request = createRequest();
      const params = { id: 'league-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        items: [
          {
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
          },
          {
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
          }
        ],
        nextCursor: 'player-2',
        hasMore: true,
        meta: {
          total: 2,
          positions: ['QB', 'RB', 'WR', 'TE'],
          ownership: {
            totalOwned: 150,
            byPosition: {
              'QB': 12,
              'RB': 48,
              'WR': 60,
              'TE': 24,
              'K': 6
            }
          },
          query: {
            owned: 'all',
            sort: 'price',
            limit: 20
          }
        }
      });

      expect(mockQuery.queryPlayers).toHaveBeenCalledWith('league-1', {
        owned: 'all',
        sort: 'price',
        limit: 20
      });
    });

    it('passes through query parameters correctly', async () => {
      const request = createRequest({
        search: 'Allen',
        pos: 'QB',
        owned: 'owned',
        sort: 'name',
        cursor: 'player-5',
        limit: '10'
      });
      const params = { id: 'league-1' };

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      expect(mockQuery.queryPlayers).toHaveBeenCalledWith('league-1', {
        search: 'Allen',
        pos: 'QB',
        owned: 'owned',
        sort: 'name',
        cursor: 'player-5',
        limit: 10
      });
    });

    it('returns 401 when user not authenticated', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = createRequest();
      const params = { id: 'league-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('returns 404 when league not found', async () => {
      mockDb.league.findUnique.mockResolvedValue(null);

      const request = createRequest();
      const params = { id: 'league-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('League not found');
    });

    it('returns 403 when user has not claimed a team', async () => {
      mockDb.league.findUnique.mockResolvedValue({
        id: 'league-1',
        espnLeagueId: '12345',
        name: 'Test League',
        season: 2025,
        scoringJson: {},
        rosterRulesJson: {},
        auctionBudget: 200,
        firstLoadedAt: new Date(),
        createdBy: null,
        teams: [],
        TeamClaim: [] // No team claims
      });

      const request = createRequest();
      const params = { id: 'league-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You must claim a team in this league to view players');
    });

    it('validates query parameters', async () => {
      const request = createRequest({
        owned: 'invalid-value',
        sort: 'invalid-sort',
        limit: 'not-a-number'
      });
      const params = { id: 'league-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
      expect(data.details).toBeDefined();
    });

    it('validates limit bounds', async () => {
      const request = createRequest({
        limit: '150' // Above max of 100
      });
      const params = { id: 'league-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
    });

    it('sets cache headers', async () => {
      const request = createRequest();
      const params = { id: 'league-1' };

      const response = await GET(request, { params });

      expect(response.headers.get('Cache-Control')).toBe('s-maxage=30, stale-while-revalidate=60');
    });

    it('handles database errors gracefully', async () => {
      mockQuery.queryPlayers.mockRejectedValue(new Error('Database connection failed'));

      const request = createRequest();
      const params = { id: 'league-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('HEAD /api/leagues/[id]/players', () => {
    it('returns ownership stats in headers', async () => {
      const request = createHeadRequest();
      const params = { id: 'league-1' };

      const response = await HEAD(request, { params });

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Total-Players')).toBe('150');
      expect(response.headers.get('X-Positions')).toBe('QB,RB,WR,TE,K');
      expect(response.headers.get('Cache-Control')).toBe('s-maxage=60, stale-while-revalidate=120');
    });

    it('returns 401 when user not authenticated', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = createHeadRequest();
      const params = { id: 'league-1' };

      const response = await HEAD(request, { params });

      expect(response.status).toBe(401);
    });

    it('returns 404 when league not found or no team claim', async () => {
      mockDb.league.findUnique.mockResolvedValue(null);

      const request = createHeadRequest();
      const params = { id: 'league-1' };

      const response = await HEAD(request, { params });

      expect(response.status).toBe(404);
    });

    it('handles database errors gracefully', async () => {
      mockQuery.getOwnershipStats.mockRejectedValue(new Error('Database error'));

      const request = createHeadRequest();
      const params = { id: 'league-1' };

      const response = await HEAD(request, { params });

      expect(response.status).toBe(500);
    });
  });

  describe('error handling', () => {
    it('handles missing search params gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/players', {
        method: 'GET'
      });
      const params = { id: 'league-1' };

      const response = await GET(request, { params });

      expect(response.status).toBe(200);
      // Should use default values
      expect(mockQuery.queryPlayers).toHaveBeenCalledWith('league-1', {
        owned: 'all',
        sort: 'price',
        limit: 20
      });
    });
  });
});