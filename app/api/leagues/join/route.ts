import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/database';
import { getSessionUser } from '@/lib/auth';
import { checkAndIncrement } from '@/lib/rate-limit';
import { performBulkIngest } from '@/lib/ingest/bulk';

export const runtime = 'nodejs';

const JoinLeagueSchema = z.object({
  leagueId: z.string().transform(Number),
  season: z.number().int().min(2020).max(2030),
  espnS2: z.string().optional(),
  SWID: z.string().optional()
});

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const { leagueId, season, espnS2, SWID } = JoinLeagueSchema.parse(body);

    // Rate limiting: 3 league joins per hour per user
    const rateLimit = await checkAndIncrement(
      user.id,
      'leagues:join',
      3,
      60 * 60 * 1000 // 1 hour
    );

    if (rateLimit === 'limited') {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 3 league joins per hour.' },
        { status: 429 }
      );
    }

    // Check if league already exists
    const existingLeague = await db.league.findUnique({
      where: { espnLeagueId: leagueId.toString() },
      include: {
        teams: {
          include: {
            _count: {
              select: { TeamClaim: true }
            }
          }
        }
      }
    });

    if (existingLeague) {
      // League already exists, return teams with claim status
      const teams = existingLeague.teams.map(team => ({
        espnTeamId: team.espnTeamId,
        name: team.name,
        claimable: team._count.TeamClaim === 0 // No claims = claimable
      }));

      return NextResponse.json({
        leagueId: existingLeague.id,
        name: existingLeague.name,
        season: existingLeague.season,
        wasBulkLoaded: false,
        teams
      });
    }

    // League doesn't exist, trigger bulk load
    console.log(`Triggering bulk load for new league ${leagueId}, season ${season}`);

    // Create sync job record
    const syncJob = await db.syncJob.create({
      data: {
        leagueId: leagueId.toString(),
        jobType: 'BULK_INGEST',
        status: 'RUNNING',
        startedAt: new Date()
      }
    });

    // Prepare ESPN cookies if provided
    const cookies = (espnS2 && SWID) ? { espnS2, SWID } : undefined;

    // Perform bulk ingestion
    const result = await performBulkIngest({
      leagueId,
      seasonId: season,
      cookies
    });

    // Update sync job with results
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: result.success ? 'COMPLETED' : 'FAILED',
        finishedAt: new Date(),
        error: result.error || null
      }
    });

    if (!result.success) {
      return NextResponse.json(
        { error: `Failed to load league data: ${result.error}` },
        { status: 500 }
      );
    }

    // Fetch the newly created league with teams
    const newLeague = await db.league.findUnique({
      where: { id: result.leagueDbId },
      include: {
        teams: true
      }
    });

    if (!newLeague) {
      return NextResponse.json(
        { error: 'League created but not found' },
        { status: 500 }
      );
    }

    const teams = newLeague.teams.map(team => ({
      espnTeamId: team.espnTeamId,
      name: team.name,
      claimable: true // All teams are claimable in a newly loaded league
    }));

    return NextResponse.json({
      leagueId: newLeague.id,
      name: newLeague.name,
      season: newLeague.season,
      wasBulkLoaded: true,
      teams
    });

  } catch (error) {
    console.error('League join error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}