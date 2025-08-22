import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performBulkIngest } from '@/lib/ingest/bulk';

// Mock the database
vi.mock('@/lib/database', () => ({
  db: {
    $executeRawUnsafe: vi.fn(),
    league: {
      upsert: vi.fn()
    },
    team: {
      upsert: vi.fn()
    },
    player: {
      upsert: vi.fn(),
      findUnique: vi.fn()
    },
    rosterSlot: {
      create: vi.fn()
    },
    auctionPrice: {
      create: vi.fn()
    },
    gameLog: {
      upsert: vi.fn()
    },
    replacementBaseline: {
      upsert: vi.fn()
    }
  }
}));

// Mock ESPN client
vi.mock('@/lib/espn/client', () => ({
  fetchLeagueInfo: vi.fn(),
  fetchTeamsAtWeek: vi.fn(),
  fetchBoxscores: vi.fn(),
  fetchDraftInfo: vi.fn(),
  fetchFreeAgents: vi.fn()
}));

// Import fixtures
import leagueInfoFixture from '../fixtures/espn/league-info.json';
import teamsFixture from '../fixtures/espn/teams-week4.json';
import draftInfoFixture from '../fixtures/espn/draft-info.json';

describe('Bulk Ingest', async () => {
  const mockDb = vi.mocked(await import('@/lib/database')).db;
  const mockEspnClient = vi.mocked(await import('@/lib/espn/client'));

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    mockDb.$executeRawUnsafe.mockResolvedValue(undefined);
    mockDb.league.upsert.mockResolvedValue({
      id: 'league-1',
      espnLeagueId: '12345',
      season: 2025,
      name: 'Test League',
      scoringJson: {},
      rosterRulesJson: {},
      auctionBudget: 200,
      firstLoadedAt: new Date(),
      createdBy: null,
      teams: []
    });
  });

  it('successfully ingests league data', async () => {
    // Setup ESPN client mocks
    mockEspnClient.fetchLeagueInfo.mockResolvedValue(leagueInfoFixture);
    mockEspnClient.fetchTeamsAtWeek.mockResolvedValue(teamsFixture);
    mockEspnClient.fetchDraftInfo.mockResolvedValue(draftInfoFixture);
    mockEspnClient.fetchBoxscores.mockResolvedValue([]);

    // Setup database mocks
    mockDb.team.upsert.mockResolvedValue({
      id: 'team-1',
      leagueId: 'league-1',
      espnTeamId: 1,
      name: 'Team Alpha',
      ownerUserId: 'user123'
    });

    mockDb.player.upsert.mockResolvedValue({
      id: 'player-1',
      espnPlayerId: 4046533,
      name: 'Josh Allen',
      posPrimary: 'QB',
      posEligibility: ['QB'],
      teamAbbr: 'BUF'
    });

    mockDb.player.findUnique.mockResolvedValue({
      id: 'player-1',
      espnPlayerId: 4046533,
      name: 'Josh Allen',
      posPrimary: 'QB',
      posEligibility: ['QB'],
      teamAbbr: 'BUF'
    });

    const result = await performBulkIngest({
      leagueId: 12345,
      seasonId: 2025
    });

    expect(result.success).toBe(true);
    expect(result.leagueDbId).toBe('league-1');
    expect(result.teamsCreated).toBeGreaterThan(0);
    expect(result.playersCreated).toBeGreaterThan(0);

    // Verify advisory lock was acquired
    expect(mockDb.$executeRawUnsafe).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock($1, $2)',
      12345,
      2025
    );

    // Verify league was created
    expect(mockDb.league.upsert).toHaveBeenCalledWith({
      where: { espnLeagueId: '12345' },
      update: expect.any(Object),
      create: expect.objectContaining({
        espnLeagueId: '12345',
        season: 2025,
        name: 'Test Fantasy League'
      })
    });
  });

  it('handles ESPN API errors gracefully', async () => {
    mockEspnClient.fetchLeagueInfo.mockRejectedValue(new Error('ESPN API timeout'));

    const result = await performBulkIngest({
      leagueId: 12345,
      seasonId: 2025
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('ESPN API timeout');
  });

  it('handles database errors gracefully', async () => {
    mockEspnClient.fetchLeagueInfo.mockResolvedValue(leagueInfoFixture);
    mockDb.league.upsert.mockRejectedValue(new Error('Database connection failed'));

    const result = await performBulkIngest({
      leagueId: 12345,
      seasonId: 2025
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Database connection failed');
  });

  it('processes auction prices when available', async () => {
    mockEspnClient.fetchLeagueInfo.mockResolvedValue(leagueInfoFixture);
    mockEspnClient.fetchTeamsAtWeek.mockResolvedValue(teamsFixture);
    mockEspnClient.fetchDraftInfo.mockResolvedValue(draftInfoFixture);
    mockEspnClient.fetchBoxscores.mockResolvedValue([]);

    mockDb.team.upsert.mockResolvedValue({
      id: 'team-1',
      leagueId: 'league-1',
      espnTeamId: 1,
      name: 'Team Alpha',
      ownerUserId: 'user123'
    });

    mockDb.player.upsert.mockResolvedValue({
      id: 'player-1',
      espnPlayerId: 4046533,
      name: 'Josh Allen',
      posPrimary: 'QB',
      posEligibility: ['QB'],
      teamAbbr: 'BUF'
    });

    mockDb.player.findUnique.mockResolvedValue({
      id: 'player-1',
      espnPlayerId: 4046533,
      name: 'Josh Allen',
      posPrimary: 'QB',
      posEligibility: ['QB'],
      teamAbbr: 'BUF'
    });

    const result = await performBulkIngest({
      leagueId: 12345,
      seasonId: 2025
    });

    expect(result.success).toBe(true);
    expect(result.auctionPricesCreated).toBeGreaterThan(0);

    // Verify auction price was created
    expect(mockDb.auctionPrice.create).toHaveBeenCalledWith({
      data: {
        leagueId: 'league-1',
        playerId: 'player-1',
        amount: 65,
        source: 'ESPN_DRAFT'
      }
    });
  });

  it('skips auction prices when draft info fails', async () => {
    mockEspnClient.fetchLeagueInfo.mockResolvedValue(leagueInfoFixture);
    mockEspnClient.fetchTeamsAtWeek.mockResolvedValue(teamsFixture);
    mockEspnClient.fetchDraftInfo.mockRejectedValue(new Error('Draft not available'));
    mockEspnClient.fetchBoxscores.mockResolvedValue([]);

    mockDb.team.upsert.mockResolvedValue({
      id: 'team-1',
      leagueId: 'league-1',
      espnTeamId: 1,
      name: 'Team Alpha',
      ownerUserId: 'user123'
    });

    mockDb.player.upsert.mockResolvedValue({
      id: 'player-1',
      espnPlayerId: 4046533,
      name: 'Josh Allen',
      posPrimary: 'QB',
      posEligibility: ['QB'],
      teamAbbr: 'BUF'
    });

    const result = await performBulkIngest({
      leagueId: 12345,
      seasonId: 2025
    });

    expect(result.success).toBe(true);
    expect(result.auctionPricesCreated).toBe(0);
    expect(mockDb.auctionPrice.create).not.toHaveBeenCalled();
  });

  it('creates replacement baselines for all positions', async () => {
    mockEspnClient.fetchLeagueInfo.mockResolvedValue(leagueInfoFixture);
    mockEspnClient.fetchTeamsAtWeek.mockResolvedValue([]);
    mockEspnClient.fetchDraftInfo.mockResolvedValue([]);
    mockEspnClient.fetchBoxscores.mockResolvedValue([]);

    const result = await performBulkIngest({
      leagueId: 12345,
      seasonId: 2025
    });

    expect(result.success).toBe(true);

    // Verify baseline was created for each position
    const expectedPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'D/ST'];
    for (const pos of expectedPositions) {
      expect(mockDb.replacementBaseline.upsert).toHaveBeenCalledWith({
        where: {
          season_pos: {
            season: 2025,
            pos
          }
        },
        update: expect.any(Object),
        create: expect.objectContaining({
          season: 2025,
          pos,
          source: 'BULK_INGEST'
        })
      });
    }
  });
});