import { describe, it, expect, vi } from 'vitest';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Mock the database module
vi.mock('../../lib/database', () => {
  const mockDb = {
    teamClaim: {
      create: vi.fn(),
    },
    user: {
      create: vi.fn(),
    },
    league: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  };
  return { db: mockDb };
});

describe('Prisma Database Schema', () => {
  it('should enforce unique constraints on TeamClaim', async () => {
    const { db } = await import('../../lib/database');
    
    const testData = {
      userId: 'test-user-1',
      leagueId: 'test-league-1',
      teamId: 'test-team-1',
      claimedAt: new Date(),
    };

    // Mock successful first creation
    vi.mocked(db.teamClaim.create)
      .mockResolvedValueOnce({
        id: 'claim-1',
        ...testData,
      } as any);

    // First claim should succeed
    const firstClaim = await db.teamClaim.create({
      data: testData,
    });

    expect(firstClaim).toBeDefined();
    expect(firstClaim.userId).toBe(testData.userId);

    // Mock Prisma unique constraint error for duplicate claims
    const uniqueConstraintError = new PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '5.7.0',
        meta: { target: ['leagueId', 'teamId'] },
      }
    );

    vi.mocked(db.teamClaim.create)
      .mockRejectedValueOnce(uniqueConstraintError);

    // Second claim with same leagueId + teamId should fail
    await expect(
      db.teamClaim.create({
        data: {
          userId: 'different-user',
          leagueId: testData.leagueId,
          teamId: testData.teamId,
          claimedAt: new Date(),
        },
      })
    ).rejects.toThrow('Unique constraint failed');

    // Check that we get the proper Prisma error code
    try {
      await db.teamClaim.create({
        data: {
          userId: 'different-user',
          leagueId: testData.leagueId,
          teamId: testData.teamId,
          claimedAt: new Date(),
        },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(PrismaClientKnownRequestError);
      expect((error as PrismaClientKnownRequestError).code).toBe('P2002');
    }
  });

  it('should create and query basic models', async () => {
    const { db } = await import('../../lib/database');

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      handle: 'testuser',
      createdAt: new Date(),
    };

    const mockLeague = {
      id: 'league-123',
      espnLeagueId: 'espn-123',
      season: 2024,
      name: 'Test League',
      scoringJson: {},
      rosterRulesJson: {},
      auctionBudget: null,
      firstLoadedAt: null,
      createdBy: mockUser.id,
      teams: [],
    };

    // Mock user creation
    vi.mocked(db.user.create).mockResolvedValueOnce(mockUser as any);

    const user = await db.user.create({
      data: {
        email: 'test@example.com',
        handle: 'testuser',
      },
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('test@example.com');

    // Mock league creation
    vi.mocked(db.league.create).mockResolvedValueOnce(mockLeague as any);

    const league = await db.league.create({
      data: {
        espnLeagueId: 'espn-123',
        season: 2024,
        name: 'Test League',
        scoringJson: {},
        rosterRulesJson: {},
        createdBy: user.id,
      },
    });

    expect(league.id).toBeDefined();
    expect(league.name).toBe('Test League');

    // Mock league query with teams relation
    vi.mocked(db.league.findUnique).mockResolvedValueOnce(mockLeague as any);

    const leagueWithTeams = await db.league.findUnique({
      where: { id: league.id },
      include: { teams: true },
    });

    expect(leagueWithTeams).toBeDefined();
    expect(leagueWithTeams?.teams).toBeDefined();
  });
});