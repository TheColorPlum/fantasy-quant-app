import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/leagues/join/route';

// Mock dependencies
vi.mock('@/lib/database', () => ({
  db: {
    league: {
      findUnique: vi.fn(),
      findUnique: vi.fn()
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

describe('League Join API', async () => {
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockAuth = vi.mocked(await import('@/lib/auth'));
  const mockRateLimit = vi.mocked(await import('@/lib/rate-limit'));
  const mockBulkIngest = vi.mocked(await import('@/lib/ingest/bulk'));

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default auth mock
    mockAuth.getSessionUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com'
    });
    
    // Default rate limit mock
    mockRateLimit.checkAndIncrement.mockResolvedValue('ok');
  });

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3000/api/leagues/join', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  };

  it('returns existing league without bulk load', async () => {
    const existingLeague = {
      id: 'league-1',
      espnLeagueId: '12345',
      name: 'Existing League',
      season: 2025,
      teams: [
        {
          espnTeamId: 1,
          name: 'Team Alpha',
          _count: { TeamClaim: 0 } // Claimable
        },
        {
          espnTeamId: 2,
          name: 'Team Beta',
          _count: { TeamClaim: 1 } // Already claimed
        }
      ]
    };

    mockDb.league.findUnique.mockResolvedValue(existingLeague);

    const request = createRequest({
      leagueId: '12345',
      season: 2025
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      leagueId: 'league-1',
      name: 'Existing League',
      season: 2025,
      wasBulkLoaded: false,
      teams: [
        {
          espnTeamId: 1,
          name: 'Team Alpha',
          claimable: true
        },
        {
          espnTeamId: 2,
          name: 'Team Beta',
          claimable: false
        }
      ]
    });

    expect(mockBulkIngest.performBulkIngest).not.toHaveBeenCalled();
  });

  it('triggers bulk load for new league', async () => {
    // No existing league
    mockDb.league.findUnique.mockResolvedValueOnce(null);

    // Mock sync job creation
    mockDb.syncJob.create.mockResolvedValue({
      id: 'sync-job-1',
      leagueId: '12345',
      jobType: 'BULK_INGEST',
      status: 'RUNNING',
      startedAt: new Date(),
      scheduledFor: null,
      finishedAt: null,
      error: null
    });

    // Mock successful bulk ingest
    mockBulkIngest.performBulkIngest.mockResolvedValue({
      success: true,
      leagueDbId: 'league-1',
      teamsCreated: 10,
      playersCreated: 150,
      auctionPricesCreated: 120,
      gameLogsCreated: 50
    });

    // Mock newly created league
    const newLeague = {
      id: 'league-1',
      name: 'New League',
      season: 2025,
      teams: [
        { espnTeamId: 1, name: 'Team One' },
        { espnTeamId: 2, name: 'Team Two' }
      ]
    };

    mockDb.league.findUnique.mockResolvedValueOnce(newLeague);

    const request = createRequest({
      leagueId: '12345',
      season: 2025,
      espnS2: 'session123',
      SWID: 'swid456'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      leagueId: 'league-1',
      name: 'New League',
      season: 2025,
      wasBulkLoaded: true,
      teams: [
        { espnTeamId: 1, name: 'Team One', claimable: true },
        { espnTeamId: 2, name: 'Team Two', claimable: true }
      ]
    });

    expect(mockBulkIngest.performBulkIngest).toHaveBeenCalledWith({
      leagueId: 12345,
      seasonId: 2025,
      cookies: { espnS2: 'session123', SWID: 'swid456' }
    });

    expect(mockDb.syncJob.update).toHaveBeenCalledWith({
      where: { id: 'sync-job-1' },
      data: {
        status: 'COMPLETED',
        finishedAt: expect.any(Date),
        error: null
      }
    });
  });

  it('returns 401 when user not authenticated', async () => {
    mockAuth.getSessionUser.mockResolvedValue(null);

    const request = createRequest({
      leagueId: '12345',
      season: 2025
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('returns 429 when rate limited', async () => {
    mockRateLimit.checkAndIncrement.mockResolvedValue('limited');

    const request = createRequest({
      leagueId: '12345',
      season: 2025
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Rate limit exceeded. Maximum 3 league joins per hour.');
  });

  it('validates request body', async () => {
    const request = createRequest({
      leagueId: 'not-a-number',
      season: 'invalid'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
    expect(data.details).toBeDefined();
  });

  it('handles bulk ingest failure', async () => {
    mockDb.league.findUnique.mockResolvedValueOnce(null);
    
    mockDb.syncJob.create.mockResolvedValue({
      id: 'sync-job-1',
      leagueId: '12345',
      jobType: 'BULK_INGEST',
      status: 'RUNNING',
      startedAt: new Date(),
      scheduledFor: null,
      finishedAt: null,
      error: null
    });

    mockBulkIngest.performBulkIngest.mockResolvedValue({
      success: false,
      leagueDbId: '',
      teamsCreated: 0,
      playersCreated: 0,
      auctionPricesCreated: 0,
      gameLogsCreated: 0,
      error: 'ESPN API returned 404'
    });

    const request = createRequest({
      leagueId: '12345',
      season: 2025
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to load league data: ESPN API returned 404');

    expect(mockDb.syncJob.update).toHaveBeenCalledWith({
      where: { id: 'sync-job-1' },
      data: {
        status: 'FAILED',
        finishedAt: expect.any(Date),
        error: 'ESPN API returned 404'
      }
    });
  });

  it('enforces rate limiting with correct parameters', async () => {
    mockDb.league.findUnique.mockResolvedValue({
      id: 'league-1',
      teams: []
    });

    const request = createRequest({
      leagueId: '12345',
      season: 2025
    });

    await POST(request);

    expect(mockRateLimit.checkAndIncrement).toHaveBeenCalledWith(
      'user-1',
      'leagues:join',
      3,
      60 * 60 * 1000
    );
  });

  it('handles malformed JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/leagues/join', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
  });
});