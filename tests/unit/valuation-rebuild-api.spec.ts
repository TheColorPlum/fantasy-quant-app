import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/leagues/[id]/valuations/rebuild/route';

// Mock the dependencies
vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn()
}));

vi.mock('@/lib/database', () => ({
  db: {
    league: {
      findUnique: vi.fn()
    },
    valuation: {
      findFirst: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn()
    }
  }
}));

vi.mock('@/lib/valuation/compute', () => ({
  computeLeagueValuations: vi.fn(),
  saveValuations: vi.fn()
}));

describe('Valuation Rebuild API', async () => {
  const mockAuth = vi.mocked(await import('@/lib/auth'));
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockCompute = vi.mocked(await import('@/lib/valuation/compute'));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com'
  };

  const mockLeagueWithAccess = {
    id: 'league-1',
    name: 'Test League',
    TeamClaim: [
      { userId: 'user-1', teamId: 'team-1' }
    ]
  };

  const mockValuationResult = {
    leagueId: 'league-1',
    engineVersion: '0.1.0',
    computedAt: new Date('2025-01-20T10:00:00Z'),
    valuations: [
      {
        playerId: 'player-1',
        playerName: 'Test Player',
        position: 'QB',
        price: 25.50,
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
      avgPrice: 25.50,
      priceRange: { min: 25.50, max: 25.50 }
    }
  };

  describe('POST /api/leagues/[id]/valuations/rebuild', () => {
    it('successfully rebuilds valuations for authenticated user with team claim', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockCompute.computeLeagueValuations.mockResolvedValue(mockValuationResult);
      mockCompute.saveValuations.mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/valuations/rebuild', {
        method: 'POST'
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.leagueId).toBe('league-1');
      expect(data.engineVersion).toBe('0.1.0');
      expect(data.totalPlayers).toBe(1);
      expect(data.avgPrice).toBe(25.50);
      expect(data.message).toContain('Successfully computed valuations for 1 players');

      expect(mockCompute.computeLeagueValuations).toHaveBeenCalledWith('league-1');
      expect(mockCompute.saveValuations).toHaveBeenCalledWith(mockValuationResult);
    });

    it('returns 401 for unauthenticated user', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/valuations/rebuild', {
        method: 'POST'
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('returns 404 for non-existent league', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/nonexistent/valuations/rebuild', {
        method: 'POST'
      });

      const response = await POST(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('League not found');
    });

    it('returns 403 for user without team claim', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue({
        ...mockLeagueWithAccess,
        TeamClaim: [] // No team claim
      });

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/valuations/rebuild', {
        method: 'POST'
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You must claim a team in this league to rebuild valuations');
    });

    it('handles computation errors gracefully', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockCompute.computeLeagueValuations.mockRejectedValue(new Error('Computation failed'));

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/valuations/rebuild', {
        method: 'POST'
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to rebuild valuations');
      expect(data.details).toBe('Computation failed');
    });
  });

  describe('GET /api/leagues/[id]/valuations/rebuild', () => {
    it('returns valuation status for league with existing valuations', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      
      const mockLatestValuation = {
        ts: new Date('2025-01-20T10:00:00Z'),
        engineVersion: '0.1.0'
      };
      
      mockDb.valuation.findFirst.mockResolvedValue(mockLatestValuation);
      mockDb.valuation.count.mockResolvedValue(5);
      mockDb.valuation.aggregate
        .mockResolvedValueOnce({ _avg: { price: 23.45 } }) // avgPrice
        .mockResolvedValueOnce({ _min: { price: 5.0 }, _max: { price: 50.0 } }); // priceRange

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/valuations/rebuild', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leagueId).toBe('league-1');
      expect(data.hasValuations).toBe(true);
      expect(data.lastComputed).toBe('2025-01-20T10:00:00.000Z');
      expect(data.engineVersion).toBe('0.1.0');
      expect(data.totalPlayers).toBe(5);
      expect(data.avgPrice).toBe(23.45);
      expect(data.priceRange).toEqual({ min: 5.0, max: 50.0 });
    });

    it('returns status for league with no valuations', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      
      mockDb.valuation.findFirst.mockResolvedValue(null);
      mockDb.valuation.count.mockResolvedValue(0);
      mockDb.valuation.aggregate
        .mockResolvedValueOnce({ _avg: { price: null } })
        .mockResolvedValueOnce({ _min: { price: null }, _max: { price: null } });

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/valuations/rebuild', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leagueId).toBe('league-1');
      expect(data.hasValuations).toBe(false);
      expect(data.lastComputed).toBe(null);
      expect(data.engineVersion).toBe(null);
      expect(data.totalPlayers).toBe(0);
      expect(data.avgPrice).toBe(0);
      expect(data.priceRange).toEqual({ min: 0, max: 0 });
    });

    it('returns 401 for unauthenticated user', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/valuations/rebuild', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('returns 404 for user without access or non-existent league', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue({
        ...mockLeagueWithAccess,
        TeamClaim: [] // No team claim = no access
      });

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/valuations/rebuild', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('League not found or access denied');
    });

    it('handles database errors gracefully', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.valuation.findFirst.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/valuations/rebuild', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});