import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as CreateShareLink, DELETE as RevokeShareLink, GET as GetShareLink } from '@/app/api/proposals/[id]/share-link/route';
import { GET as GetTokenProposal } from '@/app/api/proposals/token/[token]/route';
import { generateSecureToken, hashToken, createExpirationDate, isExpired, SHARE_LINK_TTL_MS } from '@/lib/share-tokens';

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

vi.mock('@/lib/share-tokens', () => ({
  generateSecureToken: vi.fn(),
  hashToken: vi.fn(),
  createExpirationDate: vi.fn(),
  isExpired: vi.fn(),
  SHARE_LINK_TTL_MS: 7 * 24 * 60 * 60 * 1000
}));

describe('Proposal Share API', async () => {
  const mockAuth = vi.mocked(await import('@/lib/auth'));
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockShareTokens = vi.mocked(await import('@/lib/share-tokens'));

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
    
    // Mock secure token generation
    const expectedToken = 'abc123XYZ789secure';
    const expectedHash = 'sha256hash123';
    const expectedExpiration = new Date(Date.now() + SHARE_LINK_TTL_MS);
    
    mockShareTokens.generateSecureToken.mockReturnValue(expectedToken);
    mockShareTokens.hashToken.mockReturnValue(expectedHash);
    mockShareTokens.createExpirationDate.mockReturnValue(expectedExpiration);
    mockShareTokens.isExpired.mockReturnValue(false);
  });

  describe('POST /api/proposals/[id]/share-link', () => {
    it('creates a new share link successfully with secure token and TTL', async () => {
      mockDb.tradeProposal.findUnique.mockResolvedValue(mockProposal);
      
      const expectedToken = 'abc123XYZ789secure';
      const expectedHash = 'sha256hash123';
      const expectedExpiration = new Date(Date.now() + SHARE_LINK_TTL_MS);
      
      const mockShareLink = {
        id: 'share-1',
        proposalId: 'proposal-1',
        tokenHash: expectedHash,
        expiresAt: expectedExpiration,
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
      expect(data.shareLink.token).toBe(expectedToken); // Raw token returned for immediate use
      expect(data.shareLink.url).toContain('/proposals?token=');
      expect(data.shareLink.isNew).toBe(true);
      expect(data.shareLink.expiresAt).toBe(expectedExpiration.toISOString());
      
      expect(mockShareTokens.generateSecureToken).toHaveBeenCalledWith(32);
      expect(mockShareTokens.hashToken).toHaveBeenCalledWith(expectedToken);
      expect(mockShareTokens.createExpirationDate).toHaveBeenCalled();
      expect(mockDb.proposalShare.create).toHaveBeenCalledWith({
        data: {
          proposalId: 'proposal-1',
          tokenHash: expectedHash,
          expiresAt: expectedExpiration
        }
      });
    });

    it('creates new share link when existing one is expired', async () => {
      const expiredShare = {
        id: 'share-1',
        tokenHash: 'old-hash',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        createdAt: new Date(Date.now() - SHARE_LINK_TTL_MS - 1000)
      };

      const proposalWithExpiredShare = {
        ...mockProposal,
        shares: [expiredShare]
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(proposalWithExpiredShare);
      mockShareTokens.isExpired.mockReturnValue(true); // Existing share is expired
      
      const expectedToken = 'abc123XYZ789secure';
      const expectedHash = 'sha256hash123';
      const expectedExpiration = new Date(Date.now() + SHARE_LINK_TTL_MS);
      
      const mockNewShareLink = {
        id: 'share-2',
        proposalId: 'proposal-1',
        tokenHash: expectedHash,
        expiresAt: expectedExpiration,
        createdAt: new Date()
      };
      
      mockDb.proposalShare.create.mockResolvedValue(mockNewShareLink);

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link', {
        method: 'POST'
      });

      const response = await CreateShareLink(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.shareLink.token).toBe(expectedToken);
      expect(data.shareLink.isNew).toBe(true);
      
      expect(mockDb.proposalShare.create).toHaveBeenCalled();
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
    it('revokes active share links successfully', async () => {
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
      
      // Should update expiresAt instead of revokedAt for new schema
      expect(mockDb.proposalShare.updateMany).toHaveBeenCalledWith({
        where: {
          proposalId: 'proposal-1',
          expiresAt: {
            gt: expect.any(Date)
          }
        },
        data: {
          expiresAt: expect.any(Date) // Set to current time to expire immediately
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
      expect(data.message).toBe('Expired 0 share link(s)');
    });
  });

  describe('GET /api/proposals/[id]/share-link', () => {
    it('returns share link information without exposing token hashes', async () => {
      const activeShare = {
        id: 'share-1',
        tokenHash: 'hash1',
        expiresAt: new Date(Date.now() + SHARE_LINK_TTL_MS),
        createdAt: new Date()
      };

      const expiredShare = {
        id: 'share-2',
        tokenHash: 'hash2',
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(Date.now() - SHARE_LINK_TTL_MS - 1000)
      };

      const proposalWithShares = {
        ...mockProposal,
        shares: [activeShare, expiredShare]
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(proposalWithShares);
      mockShareTokens.isExpired
        .mockReturnValueOnce(false) // Active share
        .mockReturnValueOnce(true); // Expired share

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link');
      const response = await GetShareLink(request, { params: { id: 'proposal-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasActiveLink).toBe(true);
      expect(data.activeLink.tokenHash).toBeUndefined(); // Never expose hash
      expect(data.activeLink.expiresAt).toBeDefined();
      expect(data.allLinks).toHaveLength(2);
      expect(data.allLinks[0].isActive).toBe(true);
      expect(data.allLinks[1].isActive).toBe(false);
      
      // Ensure no token hashes are exposed
      data.allLinks.forEach(link => {
        expect(link.tokenHash).toBeUndefined();
      });
    });

    it('returns no active link when all are expired', async () => {
      const expiredShare = {
        id: 'share-1',
        tokenHash: 'hash1',
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(Date.now() - SHARE_LINK_TTL_MS - 1000)
      };

      const proposalWithExpiredShares = {
        ...mockProposal,
        shares: [expiredShare]
      };

      mockDb.tradeProposal.findUnique.mockResolvedValue(proposalWithExpiredShares);
      mockShareTokens.isExpired.mockReturnValue(true); // All shares expired

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
    it('returns proposal for valid, non-expired token', async () => {
      const mockShareLink = {
        id: 'share-1',
        tokenHash: 'sha256hash123',
        expiresAt: new Date(Date.now() + SHARE_LINK_TTL_MS),
        createdAt: new Date(),
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
      mockShareTokens.hashToken.mockReturnValue('sha256hash123');
      mockShareTokens.isExpired.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/proposals/token/valid-token');
      const response = await GetTokenProposal(request, { params: { token: 'valid-token' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.proposal.id).toBe('proposal-1');
      expect(data.proposal.isReadOnly).toBe(true);
      expect(data.shareInfo.isActive).toBe(true);
      
      // Verify token was hashed before DB lookup
      expect(mockShareTokens.hashToken).toHaveBeenCalledWith('valid-token');
      expect(mockDb.proposalShare.findUnique).toHaveBeenCalledWith({
        where: {
          tokenHash: 'sha256hash123'
        },
        include: expect.any(Object)
      });
    });

    it('returns 404 for invalid token', async () => {
      mockDb.proposalShare.findUnique.mockResolvedValue(null);
      mockShareTokens.hashToken.mockReturnValue('invalid-hash');

      const request = new NextRequest('http://localhost:3000/api/proposals/token/invalid-token');
      const response = await GetTokenProposal(request, { params: { token: 'invalid-token' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Share link not found or has expired');
      
      expect(mockShareTokens.hashToken).toHaveBeenCalledWith('invalid-token');
      expect(mockDb.proposalShare.findUnique).toHaveBeenCalledWith({
        where: {
          tokenHash: 'invalid-hash'
        },
        include: expect.any(Object)
      });
    });

    it('returns 404 for expired token', async () => {
      const expiredShareLink = {
        id: 'share-1',
        tokenHash: 'sha256hash123',
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(Date.now() - SHARE_LINK_TTL_MS - 1000),
        proposal: {
          id: 'proposal-1'
        }
      };
      
      mockDb.proposalShare.findUnique.mockResolvedValue(expiredShareLink);
      mockShareTokens.hashToken.mockReturnValue('sha256hash123');
      mockShareTokens.isExpired.mockReturnValue(true); // Token is expired

      const request = new NextRequest('http://localhost:3000/api/proposals/token/expired-token');
      const response = await GetTokenProposal(request, { params: { token: 'expired-token' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Share link not found or has expired');
      
      expect(mockShareTokens.isExpired).toHaveBeenCalledWith(expiredShareLink.expiresAt);
    });

    it('includes proper cache headers', async () => {
      const mockShareLink = {
        id: 'share-1',
        tokenHash: 'sha256hash123',
        expiresAt: new Date(Date.now() + SHARE_LINK_TTL_MS),
        createdAt: new Date(),
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
      mockShareTokens.hashToken.mockReturnValue('sha256hash123');
      mockShareTokens.isExpired.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/proposals/token/valid-token');
      const response = await GetTokenProposal(request, { params: { token: 'valid-token' } });

      expect(response.headers.get('Cache-Control')).toBe('s-maxage=300, stale-while-revalidate=600');
    });
  });

  describe('Share Link Security', () => {
    it('generates base62 tokens with SHA256 hashing and TTL', async () => {
      mockDb.tradeProposal.findUnique.mockResolvedValue(mockProposal);
      const expectedExpiration = new Date(Date.now() + SHARE_LINK_TTL_MS);
      
      mockDb.proposalShare.create.mockResolvedValue({
        id: 'share-1',
        proposalId: 'proposal-1',
        tokenHash: 'sha256hash123',
        expiresAt: expectedExpiration,
        createdAt: new Date()
      });

      const request = new NextRequest('http://localhost:3000/api/proposals/proposal-1/share-link', {
        method: 'POST'
      });

      await CreateShareLink(request, { params: { id: 'proposal-1' } });

      expect(mockShareTokens.generateSecureToken).toHaveBeenCalledWith(32);
      expect(mockShareTokens.hashToken).toHaveBeenCalled();
      expect(mockShareTokens.createExpirationDate).toHaveBeenCalled();
    });

    it('does not expose token hashes or sensitive data in shared proposals', async () => {
      const mockShareLink = {
        id: 'share-1',
        tokenHash: 'sha256hash123',
        expiresAt: new Date(Date.now() + SHARE_LINK_TTL_MS),
        createdAt: new Date(),
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
      expect(data.shareInfo.tokenHash).toBeUndefined(); // Never expose hash
      expect(data.shareInfo.isActive).toBe(true);
    });
    it('enforces TTL - expired tokens return 404', async () => {
      const expiredShareLink = {
        id: 'share-1',
        tokenHash: 'sha256hash123',
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        createdAt: new Date(Date.now() - SHARE_LINK_TTL_MS - 1000),
        proposal: { id: 'proposal-1' }
      };
      
      mockDb.proposalShare.findUnique.mockResolvedValue(expiredShareLink);
      mockShareTokens.hashToken.mockReturnValue('sha256hash123');
      mockShareTokens.isExpired.mockReturnValue(true);

      const request = new NextRequest('http://localhost:3000/api/proposals/token/expired-token');
      const response = await GetTokenProposal(request, { params: { token: 'expired-token' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Share link not found or has expired');
      expect(mockShareTokens.isExpired).toHaveBeenCalledWith(expiredShareLink.expiresAt);
    });

    it('hashes tokens before database lookup for security', async () => {
      mockDb.proposalShare.findUnique.mockResolvedValue(null);
      mockShareTokens.hashToken.mockReturnValue('computed-hash');

      const request = new NextRequest('http://localhost:3000/api/proposals/token/test-token');
      await GetTokenProposal(request, { params: { token: 'test-token' } });

      expect(mockShareTokens.hashToken).toHaveBeenCalledWith('test-token');
      expect(mockDb.proposalShare.findUnique).toHaveBeenCalledWith({
        where: {
          tokenHash: 'computed-hash'
        },
        include: expect.any(Object)
      });
    });
  });
});