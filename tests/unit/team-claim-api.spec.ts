import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET, DELETE } from '@/app/api/leagues/[id]/claim/route';
import { Prisma } from '@prisma/client';

// Mock dependencies
vi.mock('@/lib/database', () => ({
  db: {
    league: {
      findUnique: vi.fn()
    },
    team: {
      findUnique: vi.fn()
    },
    teamClaim: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn()
    }
  }
}));

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn()
}));

describe('Team Claim API', async () => {
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockAuth = vi.mocked(await import('@/lib/auth'));

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default auth mock
    mockAuth.getSessionUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com'
    });

    // Default league mock
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
      teams: []
    });

    // Default team mock
    mockDb.team.findUnique.mockResolvedValue({
      id: 'team-1',
      leagueId: 'league-1',
      espnTeamId: 3,
      name: 'Team Alpha',
      ownerUserId: null
    });
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/leagues/league-1/claim', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };

  const createGetRequest = () => {
    return new NextRequest('http://localhost:3000/api/leagues/league-1/claim', {
      method: 'GET'
    });
  };

  const createDeleteRequest = () => {
    return new NextRequest('http://localhost:3000/api/leagues/league-1/claim', {
      method: 'DELETE'
    });
  };

  describe('POST /api/leagues/[id]/claim', () => {
    it('successfully claims an available team', async () => {
      mockDb.teamClaim.create.mockResolvedValue({
        id: 'claim-1',
        leagueId: 'league-1',
        teamId: 'team-1',
        userId: 'user-1',
        claimedAt: new Date('2025-01-01T00:00:00Z'),
        team: {
          id: 'team-1',
          name: 'Team Alpha',
          espnTeamId: 3
        }
      });

      const request = createRequest({ espnTeamId: 3 });
      const params = { id: 'league-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        ok: true,
        teamId: 'team-1',
        espnTeamId: 3,
        teamName: 'Team Alpha',
        claimedAt: '2025-01-01T00:00:00.000Z'
      });

      expect(mockDb.teamClaim.create).toHaveBeenCalledWith({
        data: {
          leagueId: 'league-1',
          teamId: 'team-1',
          userId: 'user-1'
        }
      });
    });

    it('returns 401 when user not authenticated', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = createRequest({ espnTeamId: 3 });
      const params = { id: 'league-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('returns 404 when league not found', async () => {
      mockDb.league.findUnique.mockResolvedValue(null);

      const request = createRequest({ espnTeamId: 3 });
      const params = { id: 'league-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('League not found');
    });

    it('returns 404 when team not found', async () => {
      mockDb.team.findUnique.mockResolvedValue(null);

      const request = createRequest({ espnTeamId: 999 });
      const params = { id: 'league-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Team not found in this league');
    });

    it('returns 409 when team already claimed by another user', async () => {
      // Mock unique constraint violation for team already claimed
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {
            target: ['leagueId', 'teamId']
          }
        }
      );

      mockDb.teamClaim.create.mockRejectedValue(prismaError);

      const request = createRequest({ espnTeamId: 3 });
      const params = { id: 'league-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Team already claimed by another user');
    });

    it('returns 409 when user already claimed a team in this league', async () => {
      // Mock unique constraint violation for user already has claim
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {
            target: ['leagueId', 'userId']
          }
        }
      );

      mockDb.teamClaim.create.mockRejectedValue(prismaError);

      // Mock existing claim lookup
      mockDb.teamClaim.findUnique.mockResolvedValue({
        id: 'existing-claim',
        leagueId: 'league-1',
        teamId: 'team-2',
        userId: 'user-1',
        claimedAt: new Date(),
        team: {
          id: 'team-2',
          leagueId: 'league-1',
          espnTeamId: 5,
          name: 'Team Beta',
          ownerUserId: null
        }
      });

      const request = createRequest({ espnTeamId: 3 });
      const params = { id: 'league-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('You have already claimed a team in this league');
      expect(data.existingTeam).toEqual({
        teamId: 'team-2',
        espnTeamId: 5,
        teamName: 'Team Beta'
      });
    });

    it('validates request body', async () => {
      const request = createRequest({ espnTeamId: 'invalid' });
      const params = { id: 'league-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('handles malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/claim', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const params = { id: 'league-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });
  });

  describe('GET /api/leagues/[id]/claim', () => {
    it('returns current team claim', async () => {
      mockDb.teamClaim.findUnique.mockResolvedValue({
        id: 'claim-1',
        leagueId: 'league-1',
        teamId: 'team-1',
        userId: 'user-1',
        claimedAt: new Date('2025-01-01T00:00:00Z'),
        team: {
          id: 'team-1',
          leagueId: 'league-1',
          espnTeamId: 3,
          name: 'Team Alpha',
          ownerUserId: null
        }
      });

      const request = createGetRequest();
      const params = { id: 'league-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        claimed: true,
        teamId: 'team-1',
        espnTeamId: 3,
        teamName: 'Team Alpha',
        claimedAt: '2025-01-01T00:00:00.000Z'
      });

      expect(mockDb.teamClaim.findUnique).toHaveBeenCalledWith({
        where: {
          leagueId_userId: {
            leagueId: 'league-1',
            userId: 'user-1'
          }
        },
        include: {
          team: true
        }
      });
    });

    it('returns unclaimed status when no claim exists', async () => {
      mockDb.teamClaim.findUnique.mockResolvedValue(null);

      const request = createGetRequest();
      const params = { id: 'league-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        claimed: false
      });
    });

    it('returns 401 when user not authenticated', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = createGetRequest();
      const params = { id: 'league-1' };

      const response = await GET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('DELETE /api/leagues/[id]/claim', () => {
    it('successfully releases team claim', async () => {
      mockDb.teamClaim.deleteMany.mockResolvedValue({ count: 1 });

      const request = createDeleteRequest();
      const params = { id: 'league-1' };

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        ok: true,
        message: 'Team claim released successfully'
      });

      expect(mockDb.teamClaim.deleteMany).toHaveBeenCalledWith({
        where: {
          leagueId: 'league-1',
          userId: 'user-1'
        }
      });
    });

    it('returns 404 when no claim exists to release', async () => {
      mockDb.teamClaim.deleteMany.mockResolvedValue({ count: 0 });

      const request = createDeleteRequest();
      const params = { id: 'league-1' };

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No team claim found to release');
    });

    it('returns 401 when user not authenticated', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = createDeleteRequest();
      const params = { id: 'league-1' };

      const response = await DELETE(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });
  });

  describe('error handling', () => {
    it('handles unexpected database errors', async () => {
      mockDb.teamClaim.create.mockRejectedValue(new Error('Database connection failed'));

      const request = createRequest({ espnTeamId: 3 });
      const params = { id: 'league-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('handles unknown Prisma errors', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unknown constraint',
        {
          code: 'P2003',
          clientVersion: '5.0.0'
        }
      );

      mockDb.teamClaim.create.mockRejectedValue(prismaError);

      const request = createRequest({ espnTeamId: 3 });
      const params = { id: 'league-1' };

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});