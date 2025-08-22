import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { queryPlayers, getAvailablePositions, getOwnershipStats } from '@/lib/players/query';
import { db } from '@/lib/database';

export const runtime = 'nodejs';

const PlayersQuerySchema = z.object({
  search: z.string().optional(),
  pos: z.string().optional(),
  owned: z.enum(['all', 'owned', 'available']).default('all'),
  sort: z.enum(['price', 'name', 'position', 'team']).default('price'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

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
        { error: 'You must claim a team in this league to view players' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const queryParams = PlayersQuerySchema.parse({
      search: searchParams.get('search') || undefined,
      pos: searchParams.get('pos') || undefined,
      owned: searchParams.get('owned') || 'all',
      sort: searchParams.get('sort') || 'price',
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') || '20'
    });

    // Execute player query
    const result = await queryPlayers(leagueId, queryParams);

    // Get additional metadata for the response
    const [availablePositions, ownershipStats] = await Promise.all([
      getAvailablePositions(leagueId),
      getOwnershipStats(leagueId)
    ]);

    return NextResponse.json({
      items: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      meta: {
        total: result.items.length,
        positions: availablePositions,
        ownership: ownershipStats,
        query: queryParams
      }
    }, {
      headers: {
        // Cache for 30 seconds
        'Cache-Control': 's-maxage=30, stale-while-revalidate=60'
      }
    });

  } catch (error) {
    console.error('Players API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get player count by position for the league (lighter endpoint)
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
        }
      }
    });

    if (!league || league.TeamClaim.length === 0) {
      return new NextResponse(null, { status: 404 });
    }

    // Get ownership stats
    const ownershipStats = await getOwnershipStats(leagueId);

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Players': ownershipStats.totalOwned.toString(),
        'X-Positions': Object.keys(ownershipStats.byPosition).join(','),
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
      }
    });

  } catch (error) {
    console.error('Players HEAD error:', error);
    return new NextResponse(null, { status: 500 });
  }
}