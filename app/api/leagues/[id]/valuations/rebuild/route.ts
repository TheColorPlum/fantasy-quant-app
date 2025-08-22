import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { computeLeagueValuations, saveValuations } from '@/lib/valuation/compute';
import { db } from '@/lib/database';

export const runtime = 'nodejs';

export async function POST(
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

    // Verify league exists and user has access (admin guard - for now just require team claim)
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

    // Check if user has claimed a team in this league (admin check)
    if (league.TeamClaim.length === 0) {
      return NextResponse.json(
        { error: 'You must claim a team in this league to rebuild valuations' },
        { status: 403 }
      );
    }

    console.log(`Starting valuation rebuild for league ${leagueId} by user ${user.id}`);

    // Compute new valuations
    const result = await computeLeagueValuations(leagueId);

    // Save to database
    await saveValuations(result);

    // Return summary
    return NextResponse.json({
      success: true,
      leagueId: result.leagueId,
      engineVersion: result.engineVersion,
      computedAt: result.computedAt,
      totalPlayers: result.metadata.totalPlayers,
      avgPrice: result.metadata.avgPrice,
      priceRange: result.metadata.priceRange,
      message: `Successfully computed valuations for ${result.metadata.totalPlayers} players`
    });

  } catch (error) {
    console.error('Valuation rebuild error:', error);

    return NextResponse.json(
      { 
        error: 'Failed to rebuild valuations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get current valuation status for the league
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

    // Verify league exists and user has access
    const league = await db.league.findUnique({
      where: { id: leagueId },
      include: {
        TeamClaim: {
          where: { userId: user.id },
          take: 1
        }
      }
    });

    if (!league || league.TeamClaim.length === 0) {
      return NextResponse.json(
        { error: 'League not found or access denied' },
        { status: 404 }
      );
    }

    // Get latest valuation statistics
    const latestValuation = await db.valuation.findFirst({
      where: { leagueId },
      orderBy: { ts: 'desc' },
      select: {
        ts: true,
        engineVersion: true
      }
    });

    const totalValuations = await db.valuation.count({
      where: { leagueId }
    });

    const avgPrice = await db.valuation.aggregate({
      where: { leagueId },
      _avg: {
        price: true
      }
    });

    const priceRange = await db.valuation.aggregate({
      where: { leagueId },
      _min: {
        price: true
      },
      _max: {
        price: true
      }
    });

    return NextResponse.json({
      leagueId,
      hasValuations: totalValuations > 0,
      lastComputed: latestValuation?.ts || null,
      engineVersion: latestValuation?.engineVersion || null,
      totalPlayers: totalValuations,
      avgPrice: avgPrice._avg.price ? Math.round(avgPrice._avg.price * 100) / 100 : 0,
      priceRange: {
        min: priceRange._min.price ? Math.round(priceRange._min.price * 100) / 100 : 0,
        max: priceRange._max.price ? Math.round(priceRange._max.price * 100) / 100 : 0
      }
    });

  } catch (error) {
    console.error('Valuation status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}