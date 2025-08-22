import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as LeagueJoinPOST } from '@/app/api/leagues/join/route';
import { POST as TradeGeneratePOST } from '@/app/api/leagues/[id]/trades/generate/route';

// Mock dependencies
vi.mock('@/lib/database', () => ({
  db: {
    league: {
      findUnique: vi.fn()
    },
    teamClaim: {
      findFirst: vi.fn()
    },
    syncJob: {
      create: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn()
}));

vi.mock('@/lib/rate-limit', () => ({
  checkAndIncrement: vi.fn()
}));

vi.mock('@/lib/ingest/bulk', () => ({
  performBulkIngest: vi.fn()
}));

vi.mock('@/lib/trades/generate', () => ({
  generateTradeProposals: vi.fn()
}));

describe('Rate Limiting Integration', async () => {
  const mockAuth = vi.mocked(await import('@/lib/auth'));
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockRateLimit = vi.mocked(await import('@/lib/rate-limit'));
  const mockBulkIngest = vi.mocked(await import('@/lib/ingest/bulk'));
  const mockTradeGen = vi.mocked(await import('@/lib/trades/generate'));

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Default auth mock
    mockAuth.getSessionUser.mockResolvedValue(mockUser);
    
    // Default rate limit mock
    mockRateLimit.checkAndIncrement.mockResolvedValue('ok');
  });

  describe('League Join Rate Limiting', () => {
    it('applies rate limiting before any business logic', async () => {
      // Mock rate limit to return limited
      mockRateLimit.checkAndIncrement.mockResolvedValue('limited');

      const request = new NextRequest('http://localhost:3000/api/leagues/join', {
        method: 'POST',
        body: JSON.stringify({
          leagueId: '12345',
          season: 2025
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await LeagueJoinPOST(request);
      const data = await response.json();

      // Should return 429 immediately
      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded. Maximum 3 league joins per hour.');

      // Rate limit should be checked with correct parameters
      expect(mockRateLimit.checkAndIncrement).toHaveBeenCalledWith(
        'user-1',
        'leagues:join',
        3,
        60 * 60 * 1000
      );

      // Business logic should not be executed
      expect(mockDb.league.findUnique).not.toHaveBeenCalled();
      expect(mockBulkIngest.performBulkIngest).not.toHaveBeenCalled();
    });

    it('proceeds with business logic when rate limit is ok', async () => {
      // Mock existing league to avoid bulk ingest
      mockDb.league.findUnique.mockResolvedValue({
        id: 'league-1',
        name: 'Test League',
        season: 2025,
        teams: []
      });

      const request = new NextRequest('http://localhost:3000/api/leagues/join', {
        method: 'POST',
        body: JSON.stringify({
          leagueId: '12345',
          season: 2025
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await LeagueJoinPOST(request);

      // Should proceed normally
      expect(response.status).toBe(200);

      // Rate limit should be checked first
      expect(mockRateLimit.checkAndIncrement).toHaveBeenCalledWith(
        'user-1',
        'leagues:join',
        3,
        60 * 60 * 1000
      );

      // Business logic should be executed
      expect(mockDb.league.findUnique).toHaveBeenCalled();
    });
  });

  describe('Trade Generation Rate Limiting', () => {
    const mockLeagueWithAccess = {
      id: 'league-1',
      name: 'Test League',
      TeamClaim: [
        { userId: 'user-1', teamId: 'team-1' }
      ]
    };

    const mockUserTeamClaim = {
      userId: 'user-1',
      teamId: 'team-1',
      team: {
        id: 'team-1',
        name: 'My Team',
        leagueId: 'league-1'
      }
    };

    it('applies rate limiting before any business logic', async () => {
      // Mock rate limit to return limited
      mockRateLimit.checkAndIncrement.mockResolvedValue('limited');

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await TradeGeneratePOST(request, { params: { id: 'league-1' } });
      const data = await response.json();

      // Should return 429 immediately
      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded. Maximum 20 trade generations per hour.');

      // Rate limit should be checked with correct parameters
      expect(mockRateLimit.checkAndIncrement).toHaveBeenCalledWith(
        'user-1',
        'trades:generate',
        20,
        60 * 60 * 1000
      );

      // Business logic should not be executed
      expect(mockDb.league.findUnique).not.toHaveBeenCalled();
      expect(mockTradeGen.generateTradeProposals).not.toHaveBeenCalled();
    });

    it('proceeds with business logic when rate limit is ok', async () => {
      // Setup successful trade generation
      mockDb.league.findUnique.mockResolvedValue(mockLeagueWithAccess);
      mockDb.teamClaim.findFirst.mockResolvedValue(mockUserTeamClaim);
      mockTradeGen.generateTradeProposals.mockResolvedValue({
        proposals: [],
        meta: {
          totalCandidates: 0,
          filteredCandidates: 0,
          mode: 'balanced' as const,
          fromTeamId: 'team-1',
          targetTeamIds: ['team-2']
        }
      });

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await TradeGeneratePOST(request, { params: { id: 'league-1' } });

      // Should proceed normally
      expect(response.status).toBe(200);

      // Rate limit should be checked first
      expect(mockRateLimit.checkAndIncrement).toHaveBeenCalledWith(
        'user-1',
        'trades:generate',
        20,
        60 * 60 * 1000
      );

      // Business logic should be executed
      expect(mockDb.league.findUnique).toHaveBeenCalled();
      expect(mockTradeGen.generateTradeProposals).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting Error Handling', () => {
    it('handles rate limit check errors gracefully in league join', async () => {
      mockRateLimit.checkAndIncrement.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/leagues/join', {
        method: 'POST',
        body: JSON.stringify({
          leagueId: '12345',
          season: 2025
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await LeagueJoinPOST(request);

      // Should return 500 due to error
      expect(response.status).toBe(500);
    });

    it('handles rate limit check errors gracefully in trade generation', async () => {
      mockRateLimit.checkAndIncrement.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({
          fromTeamId: 'team-1'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await TradeGeneratePOST(request, { params: { id: 'league-1' } });

      // Should return 500 due to error
      expect(response.status).toBe(500);
    });
  });

  describe('Rate Limiting Configuration Verification', () => {
    it('uses different rate limits for different endpoints', async () => {
      // Mock existing league
      mockDb.league.findUnique.mockResolvedValue({
        id: 'league-1',
        name: 'Test League',
        season: 2025,
        teams: [],
        TeamClaim: [{ userId: 'user-1', teamId: 'team-1' }]
      });

      mockDb.teamClaim.findFirst.mockResolvedValue({
        userId: 'user-1',
        teamId: 'team-1',
        team: { id: 'team-1', name: 'My Team', leagueId: 'league-1' }
      });

      mockTradeGen.generateTradeProposals.mockResolvedValue({
        proposals: [],
        meta: {
          totalCandidates: 0,
          filteredCandidates: 0,
          mode: 'balanced' as const,
          fromTeamId: 'team-1',
          targetTeamIds: []
        }
      });

      // Test league join rate limiting
      const leagueJoinRequest = new NextRequest('http://localhost:3000/api/leagues/join', {
        method: 'POST',
        body: JSON.stringify({ leagueId: '12345', season: 2025 }),
        headers: { 'Content-Type': 'application/json' }
      });

      await LeagueJoinPOST(leagueJoinRequest);

      expect(mockRateLimit.checkAndIncrement).toHaveBeenCalledWith(
        'user-1',
        'leagues:join',
        3, // 3 per hour
        60 * 60 * 1000
      );

      // Reset mock to test trade generation
      vi.clearAllMocks();
      mockAuth.getSessionUser.mockResolvedValue(mockUser);
      mockRateLimit.checkAndIncrement.mockResolvedValue('ok');
      mockDb.league.findUnique.mockResolvedValue({
        id: 'league-1',
        TeamClaim: [{ userId: 'user-1', teamId: 'team-1' }]
      });
      mockDb.teamClaim.findFirst.mockResolvedValue({
        userId: 'user-1',
        teamId: 'team-1',
        team: { id: 'team-1', name: 'My Team', leagueId: 'league-1' }
      });
      mockTradeGen.generateTradeProposals.mockResolvedValue({
        proposals: [],
        meta: {
          totalCandidates: 0,
          filteredCandidates: 0,
          mode: 'balanced' as const,
          fromTeamId: 'team-1',
          targetTeamIds: []
        }
      });

      // Test trade generation rate limiting
      const tradeGenRequest = new NextRequest('http://localhost:3000/api/leagues/league-1/trades/generate', {
        method: 'POST',
        body: JSON.stringify({ fromTeamId: 'team-1' }),
        headers: { 'Content-Type': 'application/json' }
      });

      await TradeGeneratePOST(tradeGenRequest, { params: { id: 'league-1' } });

      expect(mockRateLimit.checkAndIncrement).toHaveBeenCalledWith(
        'user-1',
        'trades:generate',
        20, // 20 per hour
        60 * 60 * 1000
      );
    });
  });
});