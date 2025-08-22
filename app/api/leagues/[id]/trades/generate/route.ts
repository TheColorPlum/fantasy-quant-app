import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { generateTradeProposals } from '@/lib/trades/generate';
import { db } from '@/lib/database';

export const runtime = 'nodejs';

const TradeGenerationSchema = z.object({
  fromTeamId: z.string().min(1, 'From team ID is required'),
  toTeamId: z.string().optional(),
  targets: z.array(z.string()).optional(),
  sendables: z.array(z.string()).optional(),
  mode: z.enum(['balanced', 'strict']).default('balanced')
});

/**
 * Generate trade proposals using balanced win-win algorithm
 */
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

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const tradeParams = TradeGenerationSchema.parse(body);

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
        { error: 'You must claim a team in this league to generate trade proposals' },
        { status: 403 }
      );
    }

    // Verify the fromTeamId exists in this league and belongs to user
    const userTeamClaim = await db.teamClaim.findFirst({
      where: {
        userId: user.id,
        team: {
          leagueId: leagueId,
          id: tradeParams.fromTeamId
        }
      },
      include: {
        team: true
      }
    });

    if (!userTeamClaim) {
      return NextResponse.json(
        { error: 'You can only generate trades for teams you have claimed' },
        { status: 403 }
      );
    }

    // If toTeamId is specified, verify it exists in this league
    if (tradeParams.toTeamId) {
      const targetTeam = await db.team.findUnique({
        where: {
          id: tradeParams.toTeamId,
          leagueId: leagueId
        }
      });

      if (!targetTeam) {
        return NextResponse.json(
          { error: 'Target team not found in this league' },
          { status: 404 }
        );
      }

      if (targetTeam.id === tradeParams.fromTeamId) {
        return NextResponse.json(
          { error: 'Cannot generate trades with yourself' },
          { status: 400 }
        );
      }
    }

    console.log(`Generating ${tradeParams.mode} trade proposals for team ${tradeParams.fromTeamId} in league ${leagueId}`);

    // Generate trade proposals
    const result = await generateTradeProposals(leagueId, tradeParams);

    return NextResponse.json({
      success: true,
      proposals: result.proposals,
      meta: {
        ...result.meta,
        fromTeamName: userTeamClaim.team.name,
        requestedBy: user.id,
        requestedAt: new Date().toISOString()
      }
    }, {
      headers: {
        // Cache for 5 minutes since trade values change frequently
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('Trade generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to generate trade proposals',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get trade generation capabilities and constraints for the league
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
        },
        teams: {
          select: {
            id: true,
            name: true,
            espnTeamId: true
          }
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
        { error: 'You must claim a team in this league to access trade generation' },
        { status: 403 }
      );
    }

    // Get user's team details
    const userTeam = await db.team.findFirst({
      where: {
        leagueId: leagueId,
        TeamClaim: {
          some: { userId: user.id }
        }
      },
      include: {
        RosterSlot: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                posPrimary: true
              }
            }
          }
        }
      }
    });

    if (!userTeam) {
      return NextResponse.json(
        { error: 'Your team not found in this league' },
        { status: 404 }
      );
    }

    // Prepare response with available teams and players
    const availableTeams = league.teams.filter(team => team.id !== userTeam.id);
    const userPlayers = userTeam.RosterSlot.map(slot => ({
      id: slot.player.id,
      name: slot.player.name,
      position: slot.player.posPrimary
    }));

    return NextResponse.json({
      leagueId,
      leagueName: league.name,
      userTeam: {
        id: userTeam.id,
        name: userTeam.name,
        players: userPlayers
      },
      availableTeams,
      tradeGeneration: {
        supportedModes: ['balanced', 'strict'],
        defaultMode: 'balanced',
        maxProposals: 5,
        supportedTradeTypes: ['1:1', '2:1', '1:2'],
        constraints: {
          balanced: {
            description: 'Both teams improve need score, value loss ≤3% of roster value',
            valueTolerance: 0.03
          },
          strict: {
            description: 'Both teams must gain value',
            valueTolerance: 0.0
          }
        }
      }
    }, {
      headers: {
        // Cache for 15 minutes as team composition doesn't change frequently
        'Cache-Control': 's-maxage=900, stale-while-revalidate=1800'
      }
    });

  } catch (error) {
    console.error('Trade generation GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}