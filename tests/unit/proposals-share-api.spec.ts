import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as CreateShareLink, DELETE as RevokeShareLink, GET as GetShareLink } from '@/app/api/proposals/[id]/share-link/route';
import { GET as GetTokenProposal } from '@/app/api/proposals/token/[token]/route';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn()
}));

vi.mock('@/lib/database', () => ({
  db: {
    tradeProposal: {
      findUnique: vi.fn()
    },
    proposalShare: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn()
    }
  }
}));

vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn()
  }
}));

describe('Proposal Share API', async () => {
  const mockAuth = vi.mocked(await import('@/lib/auth'));
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockCrypto = vi.mocked(await import('crypto')).default;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com'
  };

  const mockProposal = {
    id: 'proposal-1',
    fromTeam: {
      id: 'team-1',
      TeamClaim: [{ userId: 'user-1' }]
    },
    toTeam: {
      id: 'team-2',
      TeamClaim: []
    },
    shares: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    mockAuth.getSessionUser.mockResolvedValue(mockUser);
    // Mock randomBytes to return a buffer that when converted to hex gives us our expected token
    const expectedToken = '6d6f636b6564746f6b656e313233343536373839303132333435363738393031323334353637383930';
    mockCrypto.randomBytes.mockReturnValue(Buffer.from(expectedToken, 'hex'));
  });

  describe('POST /api/proposals/[id]/share-link', () => {
    it('creates a new share link successfully', async () => {
      mockDb.tradeProposal.findUnique.mockResolvedValue(mockProposal);
      
      const expectedToken = '6d6f636b6564746f6b656e313233343536373839303132333435363738393031323334353637383930';
      const mockShareLink = {
        id: 'share-1',
        proposalId: 'proposal-1',
        token: expectedToken,
        createdAt: new Date()
      };
      
      mockDb.proposalShare.create.mockResolvedValue(mockShareLink);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link', {
        method: 'POST'
      });

      const response = await CreateShareLink(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.shareLink.token).toBe(expectedToken);
      expect(data.shareLink.url).toContain('/proposals?token=');
      expect(data.shareLink.isNew).toBe(true);
      
      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
      expect(mockDb.proposalShare.create).toHaveBeenCalledWith({
        data: {
          proposalId: 'proposal-1',
          token: expectedToken
        }
      });
    });

    it('returns existing share link if already exists', async () => {
      const existingShare = {
        id: 'share-1',
        token: 'existing-token',
        createdAt: new Date()
      };

      const proposalWithShare = {
        ...mockProposal,
        shares: [existingShare]
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(proposalWithShare);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link', {
        method: 'POST'
      });

      const response = await CreateShareLink(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.shareLink.token).toBe('existing-token');
      expect(data.shareLink.isNew).toBe(false);
      
      expect(mockDb.proposalShare.create).not.toHaveBeenCalled();
    });

    it('returns 401 when user not authenticated', async () => {
      mockAuth.getSessionUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link', {
        method: 'POST'
      });

      const response = await CreateShareLink(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('returns 404 when proposal not found', async () => {
      mockDb.tradeProposal.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/proposals/nonexistent/share-link', {
        method: 'POST'
      });

      const response = await CreateShareLink(request, { params: { id: 'nonexistent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Proposal not found');
    });

    it('returns 403 when user has no access to proposal', async () => {
      const noAccessProposal = {
        ...mockProposal,
        fromTeam: {
          id: 'team-1',
          TeamClaim: []
        },
        toTeam: {
          id: 'team-2',
          TeamClaim: []
        }
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(noAccessProposal);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link', {
        method: 'POST'
      });

      const response = await CreateShareLink(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('You do not have access to this proposal');
    });
  });

  describe('DELETE /api/proposals/[id]/share-link', () => {
    it('revokes share links successfully', async () => {
      mockDb.tradeProposal.findUnique.mockResolvedValue(mockProposal);
      mockDb.proposalShare.updateMany.mockResolvedValue({ count: 1 });

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link', {
        method: 'DELETE'
      });

      const response = await RevokeShareLink(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.revokedCount).toBe(1);
      
      expect(mockDb.proposalShare.updateMany).toHaveBeenCalledWith({
        where: {
          proposalId: 'proposal-1',
          revokedAt: null
        },
        data: {
          revokedAt: expect.any(Date)
        }
      });
    });

    it('returns message when no active links to revoke', async () => {
      mockDb.tradeProposal.findUnique.mockResolvedValue(mockProposal);
      mockDb.proposalShare.updateMany.mockResolvedValue({ count: 0 });

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link', {
        method: 'DELETE'
      });

      const response = await RevokeShareLink(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.revokedCount).toBe(0);
      expect(data.message).toBe('Revoked 0 share link(s)');
    });
  });

  describe('GET /api/proposals/[id]/share-link', () => {
    it('returns share link information', async () => {
      const activeShare = {
        id: 'share-1',
        token: 'active-token',
        createdAt: new Date(),
        revokedAt: null
      };

      const revokedShare = {
        id: 'share-2',
        token: 'revoked-token',
        createdAt: new Date(),
        revokedAt: new Date()
      };

      const proposalWithShares = {
        ...mockProposal,
        shares: [activeShare, revokedShare]
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(proposalWithShares);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link');
      const response = await GetShareLink(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasActiveLink).toBe(true);
      expect(data.activeLink.token).toBe('active-token');
      expect(data.activeLink.url).toContain('/proposals?token=active-token');
      expect(data.allLinks).toHaveLength(2);
      expect(data.allLinks[0].isActive).toBe(true);
      expect(data.allLinks[1].isActive).toBe(false);
    });

    it('returns no active link when all are revoked', async () => {
      const revokedShare = {
        id: 'share-1',
        token: 'revoked-token',
        createdAt: new Date(),
        revokedAt: new Date()
      };

      const proposalWithRevokedShares = {
        ...mockProposal,
        shares: [revokedShare]
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(proposalWithRevokedShares);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link');
      const response = await GetShareLink(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasActiveLink).toBe(false);
      expect(data.activeLink).toBe(null);
      expect(data.allLinks).toHaveLength(1);
      expect(data.allLinks[0].isActive).toBe(false);
    });
  });

  describe('GET /api/proposals/token/[token]', () => {
    it('returns proposal for valid token', async () => {
      const mockShareLink = {
        id: 'share-1',
        token: 'valid-token',
        createdAt: new Date(),
        revokedAt: null,
        proposal: {
          id: 'proposal-1',
          leagueId: 'league-1',
          status: 'sent',
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
          expiresAt: new Date(),
          items: [
            {
              id: 'item-1',
              playerId: 'player-1',
              playerName: 'Test Player',
              position: 'QB',
              value: 45.0,
              direction: 'give'
            }
          ],
          fromTeam: { id: 'team-1', name: 'Team 1', espnTeamId: 1 },
          toTeam: { id: 'team-2', name: 'Team 2', espnTeamId: 2 },
          league: { id: 'league-1', name: 'Test League', season: 2025 }
        }
      };

      mockDb.proposalShare.findUnique.mockResolvedValue(mockShareLink);

      const request = new NextRequest('http://localhost:3000/api/proposals/token/valid-token');
      const response = await GetTokenProposal(request, { params: { token: 'valid-token' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.proposal.id).toBe('proposal-1');
      expect(data.proposal.isReadOnly).toBe(true);
      expect(data.shareInfo.token).toBe('valid-token');
      expect(data.shareInfo.isActive).toBe(true);
      
      expect(mockDb.proposalShare.findUnique).toHaveBeenCalledWith({
        where: {
          token: 'valid-token',
          revokedAt: null
        },
        include: expect.any(Object)
      });
    });

    it('returns 404 for invalid token', async () => {
      mockDb.proposalShare.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/proposals/token/invalid-token');
      const response = await GetTokenProposal(request, { params: { token: 'invalid-token' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Share link not found or has been revoked');
    });

    it('returns 404 for revoked token', async () => {
      // Mock should return null for revoked tokens due to WHERE clause
      mockDb.proposalShare.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/proposals/token/revoked-token');
      const response = await GetTokenProposal(request, { params: { token: 'revoked-token' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Share link not found or has been revoked');
    });

    it('includes proper cache headers', async () => {
      const mockShareLink = {
        id: 'share-1',
        token: 'valid-token',
        createdAt: new Date(),
        revokedAt: null,
        proposal: {
          id: 'proposal-1',
          leagueId: 'league-1',
          status: 'sent',
          valueDeltaFrom: -10.0,
          valueDeltaTo: 10.0,
          needDeltaFromBefore: 8.5,
          needDeltaFromAfter: 6.5,
          needDeltaToBefore: 7.0,
          needDeltaToAfter: 6.0,
          needDeltaFromByPos: {},
          needDeltaToByPos: {},
          rationale: 'Test rationale',
          generationMode: 'balanced',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
          fromTeam: { id: 'team-1', name: 'Team 1', espnTeamId: 1 },
          toTeam: { id: 'team-2', name: 'Team 2', espnTeamId: 2 },
          league: { id: 'league-1', name: 'Test League', season: 2025 }
        }
      };

      mockDb.proposalShare.findUnique.mockResolvedValue(mockShareLink);

      const request = new NextRequest('http://localhost:3000/api/proposals/token/valid-token');
      const response = await GetTokenProposal(request, { params: { token: 'valid-token' } });

      expect(response.headers.get('Cache-Control')).toBe('s-maxage=300, stale-while-revalidate=600');
    });
  });

  describe('Share Link Security', () => {
    it('generates cryptographically secure tokens', async () => {
      mockDb.tradeProposal.findUnique.mockResolvedValue(mockProposal);
      mockDb.proposalShare.create.mockResolvedValue({
        id: 'share-1',
        proposalId: 'proposal-1',
        token: 'secure-random-token',
        createdAt: new Date()
      });

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link', {
        method: 'POST'
      });

      await CreateShareLink(request, { params: { id: 'proposal-1' } });

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(32);
    });

    it('does not expose sensitive data in token view', async () => {
      const mockShareLink = {
        id: 'share-1',
        token: 'valid-token',
        createdAt: new Date(),
        revokedAt: null,
        proposal: {
          id: 'proposal-1',
          leagueId: 'league-1',
          status: 'sent',
          valueDeltaFrom: -10.0,
          valueDeltaTo: 10.0,
          needDeltaFromBefore: 8.5,
          needDeltaFromAfter: 6.5,
          needDeltaToBefore: 7.0,
          needDeltaToAfter: 6.0,
          needDeltaFromByPos: {},
          needDeltaToByPos: {},
          rationale: 'Test rationale',
          generationMode: 'balanced',
          createdAt: new Date(),
          updatedAt: new Date(),
          items: [],
          fromTeam: { id: 'team-1', name: 'Team 1', espnTeamId: 1 },
          toTeam: { id: 'team-2', name: 'Team 2', espnTeamId: 2 },
          league: { id: 'league-1', name: 'Test League', season: 2025 }
        }
      };

      mockDb.proposalShare.findUnique.mockResolvedValue(mockShareLink);

      const request = new NextRequest('http://localhost:3000/api/proposals/token/valid-token');
      const response = await GetTokenProposal(request, { params: { token: 'valid-token' } });
      const data = await response.json();

      expect(data.proposal.isReadOnly).toBe(true);
      expect(data.proposal.userAccess).toBeUndefined(); // No user access info for token view
    });
  });
});