import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, HEAD } from '@/app/api/leagues/[id]/weakness/route';

// Mock the dependencies
vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn()
}));

vi.mock('@/lib/database', () => ({
  db: {
    league: {
      findUnique: vi.fn()
    },
    team: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock('@/lib/teams/weakness', () => ({
  calculateTeamWeakness: vi.fn()
}));

describe('Team Weakness API', async () => {
  const mockAuth = vi.mocked(await import('@/lib/auth'));
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockWeakness = vi.mocked(await import('@/lib/teams/weakness'));

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

  const mockTeam = {
    id: 'team-1',
    name: 'Test Team',
    espnTeamId: 1
  };

  const mockWeaknessResult = {
    needScore: 12.5,
    items: [
      {
        pos: 'QB',
        deficitPts: 5.5,
        deficitValue: 11.0,
        drivers: ['QB 5.5pts below baseline', 'Low projected output']
      },
      {
        pos: 'RB2',
        deficitPts: 7.0,
        deficitValue: 14.0,
        drivers: ['RB2 7.0pts below baseline']
      }
    ]
  };

  describe('GET /api/leagues/[id]/weakness', () => {
    it('returns weakness analysis for valid team', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.team.findUnique.mockResolvedValue(mockTeam);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness?teamId=team-1', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.teamId).toBe('team-1');
      expect(data.teamName).toBe('Test Team');
      expect(data.espnTeamId).toBe(1);
      expect(data.needScore).toBe(12.5);
      expect(data.items).toHaveLength(2);
      
      // Check weakness items
      expect(data.items[0]).toEqual({
        pos: 'QB',
        deficitPts: 5.5,
        deficitValue: 11.0,
        drivers: ['QB 5.5pts below baseline', 'Low projected output']
      });

      // Check metadata
      expect(data.meta.totalDeficits).toBe(2);
      expect(data.meta.avgDeficitPts).toBe(6.25); // (5.5 + 7.0) / 2
      expect(data.meta.avgDeficitValue).toBe(12.5); // (11.0 + 14.0) / 2

      expect(mockWeakness.calculateTeamWeakness).toHaveBeenCalledWith('league-1', 'team-1');
    });

    it('returns empty weakness for strong team', async () => {
      const strongTeamResult = {
        needScore: 0,
        items: []
      };

      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.team.findUnique.mockResolvedValue(mockTeam);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(strongTeamResult);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness?teamId=team-1', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.needScore).toBe(0);
      expect(data.items).toHaveLength(0);
      expect(data.meta.totalDeficits).toBe(0);
      expect(data.meta.avgDeficitPts).toBe(0);
      expect(data.meta.avgDeficitValue).toBe(0);
    });

    it('returns 401 for unauthenticated user', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness?teamId=team-1', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('returns 400 for missing teamId parameter', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
      expect(data.details).toBeDefined();
    });

    it('returns 404 for non-existent league', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/nonexistent/weakness?teamId=team-1', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'nonexistent' } });
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

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness?teamId=team-1', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You must claim a team in this league to view weakness analysis');
    });

    it('returns 404 for non-existent team', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.team.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness?teamId=nonexistent', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Team not found in this league');
    });

    it('returns 404 for team not in the specified league', async () => {
      const teamInDifferentLeague = {
        id: 'team-2',
        name: 'Other Team',
        espnTeamId: 2
      };

      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      // Team query should return null when team doesn't belong to league
      mockDb.team.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness?teamId=team-2', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Team not found in this league');
    });

    it('handles weakness calculation errors gracefully', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.team.findUnique.mockResolvedValue(mockTeam);
      mockWeakness.calculateTeamWeakness.mockRejectedValue(new Error('Calculation failed'));

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness?teamId=team-1', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze team weakness');
      expect(data.details).toBe('Calculation failed');
    });

    it('includes proper cache headers', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.team.findUnique.mockResolvedValue(mockTeam);
      mockWeakness.calculateTeamWeakness.mockResolvedValue(mockWeaknessResult);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness?teamId=team-1', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });

      expect(response.headers.get('Cache-Control')).toBe('s-maxage=120, stale-while-revalidate=240');
    });

    it('validates teamId parameter format', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness?teamId=', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid query parameters');
      expect(data.details[0].message).toContain('Team ID is required');
    });
  });

  describe('HEAD /api/leagues/[id]/weakness', () => {
    it('returns league summary for authenticated user with access', async () => {
      const mockLeagueWithTeams = {
        ...mockLeagueWithAccess,
        teams: [
          { id: 'team-1', name: 'Team A' },
          { id: 'team-2', name: 'Team B' },
          { id: 'team-3', name: 'Team C' }
        ]
      };

      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithTeams);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness', {
        method: 'HEAD'
      });

      const response = await HEAD(request, { params: { id: 'league-1' } });

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Total-Teams')).toBe('3');
      expect(response.headers.get('X-League-Name')).toBe('Test League');
      expect(response.headers.get('Cache-Control')).toBe('s-maxage=300, stale-while-revalidate=600');
    });

    it('returns 401 for unauthenticated user', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness', {
        method: 'HEAD'
      });

      const response = await HEAD(request, { params: { id: 'league-1' } });

      expect(response.status).toBe(401);
    });

    it('returns 404 for user without access', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue({
        ...mockLeagueWithAccess,
        TeamClaim: [] // No access
      });

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness', {
        method: 'HEAD'
      });

      const response = await HEAD(request, { params: { id: 'league-1' } });

      expect(response.status).toBe(404);
    });

    it('handles database errors gracefully', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/weakness', {
        method: 'HEAD'
      });

      const response = await HEAD(request, { params: { id: 'league-1' } });

      expect(response.status).toBe(500);
    });
  });
});