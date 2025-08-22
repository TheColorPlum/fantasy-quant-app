import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/database';
import { getSessionUser } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';

const ClaimTeamSchema = z.object({
  espnTeamId: z.number().int().min(1)
});

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

    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const { espnTeamId } = ClaimTeamSchema.parse(body);

    const leagueId = params.id;

    // Verify league exists
    const league = await db.league.findUnique({
      where: { id: leagueId }
    });

    if (!league) {
      return NextResponse.json(
        { error: 'League not found' },
        { status: 404 }
      );
    }

    // Find the team in this league
    const team = await db.team.findUnique({
      where: {
        leagueId_espnTeamId: {
          leagueId,
          espnTeamId
        }
      }
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found in this league' },
        { status: 404 }
      );
    }

    try {
      // Attempt to create the team claim with unique constraints
      const teamClaim = await db.teamClaim.create({
        data: {
          leagueId,
          teamId: team.id,
          userId: user.id
        }
      });

      return NextResponse.json({
        ok: true,
        teamId: team.id,
        espnTeamId: team.espnTeamId,
        teamName: team.name,
        claimedAt: teamClaim.claimedAt
      });

    } catch (error) {
      // Handle unique constraint violations
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[] | undefined;
          
          if (target?.includes('leagueId') && target?.includes('teamId')) {
            // Team already claimed by someone else
            return NextResponse.json(
              { error: 'Team already claimed by another user' },
              { status: 409 }
            );
          }
          
          if (target?.includes('leagueId') && target?.includes('userId')) {
            // User already claimed a team in this league
            const existingClaim = await db.teamClaim.findUnique({
              where: {
                leagueId_userId: {
                  leagueId,
                  userId: user.id
                }
              },
              include: {
                team: true
              }
            });

            return NextResponse.json(
              { 
                error: 'You have already claimed a team in this league',
                existingTeam: existingClaim ? {
                  teamId: existingClaim.team.id,
                  espnTeamId: existingClaim.team.espnTeamId,
                  teamName: existingClaim.team.name
                } : null
              },
              { status: 409 }
            );
          }
        }
      }
      
      // Re-throw other errors
      throw error;
    }

  } catch (error) {
    console.error('Team claim error:', error);

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

/**
 * Get current team claim for authenticated user in this league
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

    // Find user's current claim in this league
    const teamClaim = await db.teamClaim.findUnique({
      where: {
        leagueId_userId: {
          leagueId,
          userId: user.id
        }
      },
      include: {
        team: true
      }
    });

    if (!teamClaim) {
      return NextResponse.json(
        { claimed: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      claimed: true,
      teamId: teamClaim.team.id,
      espnTeamId: teamClaim.team.espnTeamId,
      teamName: teamClaim.team.name,
      claimedAt: teamClaim.claimedAt
    });

  } catch (error) {
    console.error('Get team claim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Release/unclaim current team for authenticated user in this league
 */
export async function DELETE(
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

    // Delete the team claim (if exists)
    const deletedClaim = await db.teamClaim.deleteMany({
      where: {
        leagueId,
        userId: user.id
      }
    });

    if (deletedClaim.count === 0) {
      return NextResponse.json(
        { error: 'No team claim found to release' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Team claim released successfully'
    });

  } catch (error) {
    console.error('Release team claim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}