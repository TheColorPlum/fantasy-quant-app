import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { calculateTeamWeakness } from '@/lib/teams/weakness';
import { db } from '@/lib/database';

export const runtime = 'nodejs';

const WeaknessQuerySchema = z.object({
  teamId: z.string().min(1, 'Team ID is required')
});

/**
 * Get team weakness analysis - deficits by position and overall need score
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const leagueId = params.id;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const { teamId } = WeaknessQuerySchema.parse({
      teamId: searchParams.get('teamId')
    });

    // Verify league exists and user has access (via team claim)
    const league = await db.league.findUnique({
      where: { id: leagueId },
      include: {
        TeamClaim: {
          where: { userId: user.id },
          take: 1
        }
      }
    });

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Check if user has claimed a team in this league
    if (league.TeamClaim.length === 0) {
      return NextResponse.json(
        { error: 'You must claim a team in this league to view weakness analysis' },
        { status: 403 }
      );
    }

    // Verify the requested team exists in this league
    const team = await db.team.findUnique({
      where: { 
        id: teamId,
        leagueId: leagueId
      },
      select: {
        id: true,
        name: true,
        espnTeamId: true
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found in this league' },
        { status: 404 }
      );
    }

    console.log(`Computing weakness analysis for team ${teamId} (${team.name}) in league ${leagueId}`);

    // Calculate team weakness
    const result = await calculateTeamWeakness(leagueId, teamId);

    return NextResponse.json({
      teamId: team.id,
      teamName: team.name,
      espnTeamId: team.espnTeamId,
      needScore: result.needScore,
      items: result.items,
      meta: {
        totalDeficits: result.items.length,
        avgDeficitPts: result.items.length > 0 
          ? Math.round((result.items.reduce((sum, item) => sum + item.deficitPts, 0) / result.items.length) * 100) / 100
          : 0,
        avgDeficitValue: result.items.length > 0
          ? Math.round((result.items.reduce((sum, item) => sum + item.deficitValue, 0) / result.items.length) * 100) / 100
          : 0
      }
    }, {
      headers: {
        // Cache for 2 minutes since team composition might change
        'Cache-Control': 's-maxage=120, stale-while-revalidate=240'
      }
    });

  } catch (error) {
    console.error('Weakness analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to analyze team weakness',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get weakness summary for all teams in the league (lightweight endpoint)
 */
export async function HEAD(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const user = await getSessionUser();
    if (!user) {
      return new NextResponse(null, { status: 401 });
    }

    const leagueId = params.id;

    // Verify league exists and user has access
    const league = await db.league.findUnique({
      where: { id: leagueId },
      include: {
        TeamClaim: {
          where: { userId: user.id },
          take: 1
        },
        teams: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!league || league.TeamClaim.length === 0) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Teams': league.teams.length.toString(),
        'X-League-Name': league.name,
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('Weakness HEAD error:', error);
    return new NextResponse(null, { status: 500 });
  }
}