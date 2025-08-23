import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as CreateProposal, GET as GetProposals } from '@/app/api/proposals/route';
import { GET as GetProposal, PATCH as UpdateProposal, DELETE as DeleteProposal } from '@/app/api/proposals/[id]/route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn()
}));

vi.mock('@/lib/database', () => ({
  db: {
    $transaction: vi.fn(),
    tradeProposal: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    tradeItem: {
      create: vi.fn()
    },
    teamClaim: {
      findFirst: vi.fn(),
      findMany: vi.fn()
    },
    team: {
      findUnique: vi.fn()
    }
  }
}));

describe('Proposals API', async () => {
  const mockAuth = vi.mocked(await import('@/lib/auth'));
  const mockDb = vi.mocked(await import('@/lib/database')).db;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com'
  };

  const mockProposalData = {
    leagueId: 'league-1',
    fromTeamId: 'team-1',
    toTeamId: 'team-2',
    items: [
      {
        playerId: 'player-1',
        playerName: 'Test Player 1',
        position: 'QB',
        value: 45.0,
        direction: 'give' as const
      },
      {
        playerId: 'player-2',
        playerName: 'Test Player 2',
        position: 'RB',
        value: 35.0,
        direction: 'get' as const
      }
    ],
    valueDelta: {
      you: -10.0,
      them: 10.0
    },
    needDelta: {
      you: {
        byPos: { QB: -2.0, RB: 3.0 },
        before: 8.5,
        after: 6.5
      },
      them: {
        byPos: { QB: 2.0, RB: -3.0 },
        before: 7.0,
        after: 6.0
      }
    },
    rationale: 'Test trade rationale',
    generationMode: 'balanced' as const
  };

  const mockUserTeamClaim = {
    userId: 'user-1',
    teamId: 'team-1',
    team: {
      id: 'team-1',
      name: 'User Team',
      leagueId: 'league-1'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockAuth.getSessionUser.mockResolvedValue(mockUser);
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/proposals', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };

  describe('POST /api/proposals', () => {
    it('creates a new trade proposal successfully', async () => {
      // Mock team claim verification
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      
      // Mock target team verification
      mockDb.team.findUnique.mockResolvedValue({
        id: 'team-2',
        name: 'Target Team',
        leagueId: 'league-1'
      });

      // Mock transaction
      const mockProposal = {
        id: 'proposal-1',
        leagueId: 'league-1',
        fromTeamId: 'team-1',
        toTeamId: 'team-2',
        status: 'draft',
        valueDeltaFrom: -10.0,
        valueDeltaTo: 10.0,
        needDeltaFromBefore: 8.5,
        needDeltaFromAfter: 6.5,
        needDeltaToBefore: 7.0,
        needDeltaToAfter: 6.0,
        needDeltaFromByPos: { QB: -2.0, RB: 3.0 },
        needDeltaToByPos: { QB: 2.0, RB: -3.0 },
        rationale: 'Test trade rationale',
        generationMode: 'balanced',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      const mockItems = [
        {
          id: 'item-1',
          proposalId: 'proposal-1',
          playerId: 'player-1',
          playerName: 'Test Player 1',
          position: 'QB',
          value: 45.0,
          direction: 'give'
        },
        {
          id: 'item-2',
          proposalId: 'proposal-1',
          playerId: 'player-2',
          playerName: 'Test Player 2',
          position: 'RB',
          value: 35.0,
          direction: 'get'
        }
      ];

      mockDb.$transaction.mockImplementation(async (callback) => {
        return await callback({
          tradeProposal: {
            create: vi.fn().mockResolvedValue(mockProposal)
          },
          tradeItem: {
            create: vi.fn().mockResolvedValue(mockItems[0])
          }
        });
      });

      const request = createRequest(mockProposalData);
      const response = await CreateProposal(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.proposal.id).toBe('proposal-1');
      expect(data.proposal.status).toBe('draft');
      expect(data.proposal.valueDelta.you).toBe(-10.0);
      expect(data.proposal.valueDelta.them).toBe(10.0);
    });

    it('returns 401 when user not authenticated', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = createRequest(mockProposalData);
      const response = await CreateProposal(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('returns 403 when user does not have team claim', async () => {
      mockDb.teamClaim.findFirst.mockResolvedValue(null);

      const request = createRequest(mockProposalData);
      const response = await CreateProposal(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You can only create proposals for teams you have claimed');
    });

    it('returns 404 when target team not found', async () => {
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockDb.team.findUnique.mockResolvedValue(null);

      const request = createRequest(mockProposalData);
      const response = await CreateProposal(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Target team not found in this league');
    });

    it('returns 400 when trying to trade with yourself', async () => {
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockDb.team.findUnique.mockResolvedValue({
        id: 'team-1', // Same as from team
        name: 'User Team',
        leagueId: 'league-1'
      });

      const request = createRequest(mockProposalData);
      const response = await CreateProposal(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cannot create proposals with yourself');
    });

    it('validates request body with Zod', async () => {
      const invalidData = {
        leagueId: 'league-1',
        fromTeamId: 'team-1',
        // Missing required fields
      };

      const request = createRequest(invalidData);
      const response = await CreateProposal(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request parameters');
      expect(data.details).toBeDefined();
    });
  });

  describe('GET /api/proposals', () => {
    it('returns user proposals successfully', async () => {
      const mockProposals = [
        {
          id: 'proposal-1',
          leagueId: 'league-1',
          fromTeamId: 'team-1',
          toTeamId: 'team-2',
          status: 'draft',
          valueDeltaFrom: -10.0,
          valueDeltaTo: 10.0,
          needDeltaFromBefore: 8.5,
          needDeltaFromAfter: 6.5,
          needDeltaToBefore: 7.0,
          needDeltaToAfter: 6.0,
          needDeltaFromByPos: { QB: -2.0 },
          needDeltaToByPos: { QB: 2.0 },
          rationale: 'Test rationale',
          generationMode: 'balanced',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
          fromTeam: { id: 'team-1', name: 'Team 1', espnTeamId: 1 },
          toTeam: { id: 'team-2', name: 'Team 2', espnTeamId: 2 },
          league: { id: 'league-1', name: 'Test League', season: 2025 }
        }
      ];

      mockDb.teamClaim.findMany.mockResolvedValue([
        { teamId: 'team-1' }
      ]);
      
      mockDb.tradeProposal.findMany.mockResolvedValue(mockProposals);

      const request = new NextRequest('http://localhost:3000/api/proposals');
      const response = await GetProposals(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.proposals).toHaveLength(1);
      expect(data.proposals[0].id).toBe('proposal-1');
      expect(data.meta.total).toBe(1);
    });

    it('filters proposals by league ID', async () => {
      mockDb.teamClaim.findMany.mockResolvedValue([
        { teamId: 'team-1' }
      ]);
      
      mockDb.tradeProposal.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/proposals?leagueId=league-1');
      const response = await GetProposals(request);

      expect(mockDb.tradeProposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            leagueId: 'league-1'
          })
        })
      );
    });

    it('returns empty list when user has no team claims', async () => {
      mockDb.teamClaim.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/proposals');
      const response = await GetProposals(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.proposals).toHaveLength(0);
      expect(data.meta.total).toBe(0);
    });
  });

  describe('PATCH /api/proposals/[id]', () => {
    const mockProposal = {
      id: 'proposal-1',
      status: 'draft',
      leagueId: 'league-1',
      fromTeamId: 'team-1',
      toTeamId: 'team-2',
      valueDeltaFrom: -10.0,
      valueDeltaTo: 10.0,
      needDeltaFromBefore: 8.5,
      needDeltaFromAfter: 6.5,
      needDeltaToBefore: 7.0,
      needDeltaToAfter: 6.0,
      needDeltaFromByPos: { QB: -2.0 },
      needDeltaToByPos: { QB: 2.0 },
      rationale: 'Test rationale',
      generationMode: 'balanced',
      createdAt: new Date(),
      updatedAt: new Date(),
      fromTeam: {
        id: 'team-1',
        TeamClaim: [{ userId: 'user-1' }]
      },
      toTeam: {
        id: 'team-2',
        TeamClaim: []
      },
      items: []
    };

    it('updates proposal status successfully', async () => {
      mockDb.tradeProposal.findUnique.mockResolvedValue(mockProposal);
      
      const updatedProposal = {
        ...mockProposal,
        status: 'sent',
        updatedAt: new Date(),
        league: { id: 'league-1', name: 'Test League', season: 2025 },
        fromTeam: { id: 'team-1', name: 'Team 1', espnTeamId: 1 },
        toTeam: { id: 'team-2', name: 'Team 2', espnTeamId: 2 }
      };
      
      mockDb.tradeProposal.update.mockResolvedValue(updatedProposal);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'sent' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await UpdateProposal(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.proposal.status).toBe('sent');
    });

    it('returns 404 when proposal not found', async () => {
      mockDb.tradeProposal.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/proposals/nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'sent' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await UpdateProposal(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Proposal not found');
    });

    it('returns 403 when user has no access to proposal', async () => {
      const noAccessProposal = {
        ...mockProposal,
        fromTeam: {
          id: 'team-1',
          TeamClaim: [] // No access
        },
        toTeam: {
          id: 'team-2',
          TeamClaim: [] // No access
        }
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(noAccessProposal);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'sent' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await UpdateProposal(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You do not have access to this proposal');
    });

    it('validates status transitions', async () => {
      const sentProposal = {
        ...mockProposal,
        status: 'sent',
        toTeam: {
          id: 'team-2',
          TeamClaim: [{ userId: 'user-1' }] // User has access to target team
        }
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(sentProposal);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'draft' }), // Invalid transition
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await UpdateProposal(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid status transition from sent to draft');
    });

    it('enforces role-based status changes', async () => {
      // User has access to "from" team but trying to accept (which requires "to" team access)
      mockDb.tradeProposal.findUnique.mockResolvedValue({
        ...mockProposal,
        status: 'sent'
      });

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'accepted' }),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await UpdateProposal(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Only the target team can accept or reject proposals');
    });
  });

  describe('DELETE /api/proposals/[id]', () => {
    it('deletes draft proposal successfully', async () => {
      const draftProposal = {
        id: 'proposal-1',
        status: 'draft',
        fromTeam: {
          TeamClaim: [{ userId: 'user-1' }]
        }
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(draftProposal);
      mockDb.tradeProposal.delete.mockResolvedValue(draftProposal);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1', {
        method: 'DELETE'
      });

      const response = await DeleteProposal(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Proposal deleted successfully');
      expect(mockDb.tradeProposal.delete).toHaveBeenCalledWith({
        where: { id: 'proposal-1' }
      });
    });

    it('returns 400 when trying to delete non-draft proposal', async () => {
      const sentProposal = {
        id: 'proposal-1',
        status: 'sent',
        fromTeam: {
          TeamClaim: [{ userId: 'user-1' }]
        }
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(sentProposal);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1', {
        method: 'DELETE'
      });

      const response = await DeleteProposal(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Only draft proposals can be deleted');
    });
  });

  describe('GET /api/proposals/[id]', () => {
    it('returns proposal with user access info', async () => {
      const mockProposal = {
        id: 'proposal-1',
        status: 'sent',
        fromTeam: {
          id: 'team-1',
          name: 'Team 1',
          espnTeamId: 1,
          TeamClaim: [{ userId: 'user-1' }]
        },
        toTeam: {
          id: 'team-2',
          name: 'Team 2',
          espnTeamId: 2,
          TeamClaim: []
        },
        league: { id: 'league-1', name: 'Test League', season: 2025 },
        items: [],
        valueDeltaFrom: -10.0,
        valueDeltaTo: 10.0,
        needDeltaFromBefore: 8.5,
        needDeltaFromAfter: 6.5,
        needDeltaToBefore: 7.0,
        needDeltaToAfter: 6.0,
        needDeltaFromByPos: { QB: -2.0 },
        needDeltaToByPos: { QB: 2.0 },
        rationale: 'Test rationale',
        generationMode: 'balanced',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(mockProposal);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1');
      const response = await GetProposal(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.proposal.id).toBe('proposal-1');
      expect(data.proposal.userAccess.canSend).toBe(false); // Already sent
      expect(data.proposal.userAccess.canAcceptReject).toBe(false); // User is from team, not to team
      expect(data.proposal.userAccess.canExpire).toBe(true); // User can expire own proposals
    });
  });
});