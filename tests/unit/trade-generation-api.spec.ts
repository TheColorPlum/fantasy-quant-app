import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/leagues/[id]/trades/generate/route';

// Mock the dependencies
vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn()
}));

vi.mock('@/lib/database', () => ({
  db: {
    league: {
      findUnique: vi.fn()
    },
    teamClaim: {
      findFirst: vi.fn()
    },
    team: {
      findUnique: vi.fn(),
      findFirst: vi.fn()
    }
  }
}));

vi.mock('@/lib/trades/generate', () => ({
  generateTradeProposals: vi.fn()
}));

describe('Trade Generation API', async () => {
  const mockAuth = vi.mocked(await import('@/lib/auth'));
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockTradeGen = vi.mocked(await import('@/lib/trades/generate'));

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

  const mockUserTeamClaim = {
    userId: 'user-1',
    team: {
      id: 'team-1',
      name: 'My Team',
      leagueId: 'league-1'
    }
  };

  const mockTargetTeam = {
    id: 'team-2',
    name: 'Target Team',
    leagueId: 'league-1'
  };

  const mockTradeResult = {
    proposals: [
      {
        proposalId: 'temp-1',
        give: [
          {
            playerId: 'player1',
            playerName: 'My Player',
            position: 'RB',
            value: 30.0
          }
        ],
        get: [
          {
            playerId: 'player2',
            playerName: 'Their Player',
            position: 'WR',
            value: 32.0
          }
        ],
        valueDelta: {
          you: 2.0,
          them: -2.0
        },
        needDelta: {
          you: {
            byPos: { WR: -3.0 },
            before: 8.5,
            after: 5.5
          },
          them: {
            byPos: { RB: -2.0 },
            before: 6.0,
            after: 4.0
          }
        },
        rationale: 'Trade My Player for Their Player. You gain slight value (+$2.0). Addresses positional needs by trading RB depth for WR upgrade.'
      }
    ],
    meta: {
      totalCandidates: 15,
      filteredCandidates: 3,
      mode: 'balanced',
      fromTeamId: 'team-1',
      targetTeamIds: ['team-2']
    }
  };

  describe('POST /api/leagues/[id]/trades/generate', () => {
    it('generates trade proposals for authenticated user with valid team', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockTradeGen.generateTradeProposals.mockResolvedValue(mockTradeResult);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1',
          mode: 'balanced'
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.proposals).toHaveLength(1);
      expect(data.proposals[0]).toEqual(mockTradeResult.proposals[0]);

      expect(data.meta.fromTeamName).toBe('My Team');
      expect(data.meta.requestedBy).toBe('user-1');
      expect(data.meta.requestedAt).toBeDefined();

      expect(mockTradeGen.generateTradeProposals).toHaveBeenCalledWith('league-1', {
        fromTeamId: 'team-1',
        mode: 'balanced'
      });
    });

    it('generates trade proposals with specific target team', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockDb.team.findUnique.mockResolvedValue(mockTargetTeam);
      mockTradeGen.generateTradeProposals.mockResolvedValue(mockTradeResult);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1',
          toTeamId: 'team-2',
          mode: 'strict'
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockTradeGen.generateTradeProposals).toHaveBeenCalledWith('league-1', {
        fromTeamId: 'team-1',
        toTeamId: 'team-2',
        mode: 'strict'
      });
    });

    it('generates trade proposals with targets and sendables filters', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockTradeGen.generateTradeProposals.mockResolvedValue(mockTradeResult);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1',
          targets: ['player-a', 'player-b'],
          sendables: ['player-x', 'player-y'],
          mode: 'balanced'
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      expect(mockTradeGen.generateTradeProposals).toHaveBeenCalledWith('league-1', {
        fromTeamId: 'team-1',
        targets: ['player-a', 'player-b'],
        sendables: ['player-x', 'player-y'],
        mode: 'balanced'
      });
    });

    it('defaults to balanced mode when not specified', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockTradeGen.generateTradeProposals.mockResolvedValue(mockTradeResult);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1'
          // mode not specified
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockTradeGen.generateTradeProposals).toHaveBeenCalledWith('league-1', {
        fromTeamId: 'team-1',
        mode: 'balanced'
      });
    });

    it('returns 401 for unauthenticated user', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1'
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('returns 400 for missing fromTeamId', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'balanced'
          // fromTeamId missing
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request parameters');
      expect(data.details[0].message).toContain('Required');
    });

    it('returns 400 for invalid mode', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1',
          mode: 'invalid-mode'
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request parameters');
    });

    it('returns 404 for non-existent league', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/nonexistent/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1'
        })
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

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1'
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You must claim a team in this league to generate trade proposals');
    });

    it('returns 403 for user trying to trade from unclaimed team', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.teamClaim.findFirst.mockResolvedValue(null); // No claim for this specific team

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-2' // Different team
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You can only generate trades for teams you have claimed');
    });

    it('returns 404 for non-existent target team', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockDb.team.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1',
          toTeamId: 'nonexistent'
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Target team not found in this league');
    });

    it('returns 400 for trading with yourself', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockDb.team.findUnique.mockResolvedValue({
        id: 'team-1', // Same as fromTeamId
        name: 'My Team',
        leagueId: 'league-1'
      });

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1',
          toTeamId: 'team-1' // Same team
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot generate trades with yourself');
    });

    it('handles trade generation errors gracefully', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockTradeGen.generateTradeProposals.mockRejectedValue(new Error('Trade generation failed'));

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1'
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate trade proposals');
      expect(data.details).toBe('Trade generation failed');
    });

    it('includes proper cache headers', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockTradeGen.generateTradeProposals.mockResolvedValue(mockTradeResult);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1'
        })
      });

      const response = await POST(request, { params: { id: 'league-1' } });

      expect(response.headers.get('Cache-Control')).toBe('s-maxage=300, stale-while-revalidate=600');
    });
  });

  describe('GET /api/leagues/[id]/trades/generate', () => {
    const mockUserTeamWithRoster = {
      id: 'team-1',
      name: 'My Team',
      RosterSlot: [
        {
          player: {
            id: 'player1',
            name: 'My Player 1',
            posPrimary: 'QB'
          }
        },
        {
          player: {
            id: 'player2',
            name: 'My Player 2',
            posPrimary: 'RB'
          }
        }
      ]
    };

    const mockLeagueWithTeams = {
      ...mockLeagueWithAccess,
      teams: [
        { id: 'team-1', name: 'My Team', espnTeamId: 1 },
        { id: 'team-2', name: 'Team B', espnTeamId: 2 },
        { id: 'team-3', name: 'Team C', espnTeamId: 3 }
      ]
    };

    it('returns trade generation capabilities and constraints', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithTeams);
      mockDb.team.findFirst.mockResolvedValue(mockUserTeamWithRoster);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leagueId).toBe('league-1');
      expect(data.leagueName).toBe('Test League');
      
      expect(data.userTeam.id).toBe('team-1');
      expect(data.userTeam.name).toBe('My Team');
      expect(data.userTeam.players).toHaveLength(2);
      expect(data.userTeam.players[0]).toEqual({
        id: 'player1',
        name: 'My Player 1',
        position: 'QB'
      });

      expect(data.availableTeams).toHaveLength(2); // Excludes user's team
      expect(data.availableTeams.map((t: any) => t.id)).toEqual(['team-2', 'team-3']);

      expect(data.tradeGeneration.supportedModes).toEqual(['balanced', 'strict']);
      expect(data.tradeGeneration.defaultMode).toBe('balanced');
      expect(data.tradeGeneration.maxProposals).toBe(5);
      expect(data.tradeGeneration.supportedTradeTypes).toEqual(['1:1', '2:1', '1:2']);
      
      expect(data.tradeGeneration.constraints.balanced.valueTolerance).toBe(0.03);
      expect(data.tradeGeneration.constraints.strict.valueTolerance).toBe(0.0);
    });

    it('returns 401 for unauthenticated user', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('returns 404 for non-existent league', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/nonexistent/trades/generate', {
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
        ...mockLeagueWithTeams,
        TeamClaim: [] // No team claim
      });

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You must claim a team in this league to access trade generation');
    });

    it('returns 404 for user team not found', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithTeams);
      mockDb.team.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Your team not found in this league');
    });

    it('includes proper cache headers', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithTeams);
      mockDb.team.findFirst.mockResolvedValue(mockUserTeamWithRoster);

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });

      expect(response.headers.get('Cache-Control')).toBe('s-maxage=900, stale-while-revalidate=1800');
    });

    it('handles database errors gracefully', async () => {
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockDb.league.findUnique.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'GET'
      });

      const response = await GET(request, { params: { id: 'league-1' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});