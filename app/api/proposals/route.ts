import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/database';
import { withRequestId } from '@/lib/log';

export const runtime = 'nodejs';

const TradeItemSchema = z.object({
  playerId: z.string(),
  playerName: z.string(),
  position: z.string(),
  value: z.number(),
  direction: z.enum(['give', 'get'])
});

const CreateProposalSchema = z.object({
  leagueId: z.string(),
  fromTeamId: z.string(),
  toTeamId: z.string(),
  items: z.array(TradeItemSchema),
  valueDelta: z.object({
    you: z.number(),
    them: z.number()
  }),
  needDelta: z.object({
    you: z.object({
      byPos: z.record(z.number()),
      before: z.number(),
      after: z.number()
    }),
    them: z.object({
      byPos: z.record(z.number()),
      before: z.number(),
      after: z.number()
    })
  }),
  rationale: z.string(),
  generationMode: z.enum(['balanced', 'strict'])
});

/**
 * Create a new trade proposal
 */
async function postHandler(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const proposalData = CreateProposalSchema.parse(body);

    // Verify user has access to the from team
    const userTeamClaim = await db.teamClaim.findFirst({
      where: {
        userId: user.id,
        team: {
          leagueId: proposalData.leagueId,
          id: proposalData.fromTeamId
        }
      },
      include: {
        team: true
      }
    });

    if (!userTeamClaim) {
      return NextResponse.json(
        { error: 'You can only create proposals for teams you have claimed' },
        { status: 403 }
      );
    }

    // Verify the target team exists in the league
    const targetTeam = await db.team.findUnique({
      where: {
        id: proposalData.toTeamId,
        leagueId: proposalData.leagueId
      }
    });

    if (!targetTeam) {
      return NextResponse.json(
        { error: 'Target team not found in this league' },
        { status: 404 }
      );
    }

    if (targetTeam.id === proposalData.fromTeamId) {
      return NextResponse.json(
        { error: 'Cannot create proposals with yourself' },
        { status: 400 }
      );
    }

    // Create the proposal with items in a transaction
    const proposal = await db.$transaction(async (tx) => {
      // Create proposal
      const newProposal = await tx.tradeProposal.create({
        data: {
          leagueId: proposalData.leagueId,
          fromTeamId: proposalData.fromTeamId,
          toTeamId: proposalData.toTeamId,
          status: 'draft',
          valueDeltaFrom: proposalData.valueDelta.you,
          valueDeltaTo: proposalData.valueDelta.them,
          needDeltaFromBefore: proposalData.needDelta.you.before,
          needDeltaFromAfter: proposalData.needDelta.you.after,
          needDeltaToBefore: proposalData.needDelta.them.before,
          needDeltaToAfter: proposalData.needDelta.them.after,
          needDeltaFromByPos: proposalData.needDelta.you.byPos,
          needDeltaToByPos: proposalData.needDelta.them.byPos,
          rationale: proposalData.rationale,
          generationMode: proposalData.generationMode,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Create trade items
      const tradeItems = await Promise.all(
        proposalData.items.map(item =>
          tx.tradeItem.create({
            data: {
              proposalId: newProposal.id,
              playerId: item.playerId,
              playerName: item.playerName,
              position: item.position,
              value: item.value,
              direction: item.direction
            }
          })
        )
      );

      return {
        ...newProposal,
        items: tradeItems
      };
    });

    return NextResponse.json({
      success: true,
      proposal: {
        id: proposal.id,
        leagueId: proposal.leagueId,
        fromTeamId: proposal.fromTeamId,
        toTeamId: proposal.toTeamId,
        status: proposal.status,
        valueDelta: {
          you: proposal.valueDeltaFrom,
          them: proposal.valueDeltaTo
        },
        needDelta: {
          you: {
            byPos: proposal.needDeltaFromByPos,
            before: proposal.needDeltaFromBefore,
            after: proposal.needDeltaFromAfter
          },
          them: {
            byPos: proposal.needDeltaToByPos,
            before: proposal.needDeltaToBefore,
            after: proposal.needDeltaToAfter
          }
        },
        rationale: proposal.rationale,
        generationMode: proposal.generationMode,
        items: proposal.items.map(item => ({
          id: item.id,
          playerId: item.playerId,
          playerName: item.playerName,
          position: item.position,
          value: item.value,
          direction: item.direction
        })),
        createdAt: proposal.createdAt.toISOString(),
        expiresAt: proposal.expiresAt?.toISOString()
      }
    });

  } catch (error) {
    console.error('Proposal creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create trade proposal',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get trade proposals for the authenticated user
 */
async function getHandler(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const leagueId = searchParams.get('leagueId');
    const status = searchParams.get('status');
    const teamId = searchParams.get('teamId');

    // Build where clause
    const where: any = {};

    // Filter by league if specified
    if (leagueId) {
      where.leagueId = leagueId;
    }

    // Filter by status if specified
    if (status) {
      where.status = status;
    }

    // Filter to proposals involving user's teams
    const userTeams = await db.teamClaim.findMany({
      where: { userId: user.id },
      select: { teamId: true }
    });

    if (userTeams.length === 0) {
      return NextResponse.json({
        proposals: [],
        meta: {
          total: 0,
          userTeamIds: []
        }
      });
    }

    const userTeamIds = userTeams.map(claim => claim.teamId);

    // Filter by specific team if provided, otherwise all user teams
    if (teamId) {
      if (!userTeamIds.includes(teamId)) {
        return NextResponse.json(
          { error: 'You do not have access to this team' },
          { status: 403 }
        );
      }
      where.OR = [
        { fromTeamId: teamId },
        { toTeamId: teamId }
      ];
    } else {
      where.OR = [
        { fromTeamId: { in: userTeamIds } },
        { toTeamId: { in: userTeamIds } }
      ];
    }

    // Get proposals with items
    const proposals = await db.tradeProposal.findMany({
      where,
      include: {
        items: true,
        fromTeam: {
          select: { id: true, name: true, espnTeamId: true }
        },
        toTeam: {
          select: { id: true, name: true, espnTeamId: true }
        },
        league: {
          select: { id: true, name: true, season: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      proposals: proposals.map(proposal => ({
        id: proposal.id,
        leagueId: proposal.leagueId,
        league: proposal.league,
        fromTeam: proposal.fromTeam,
        toTeam: proposal.toTeam,
        status: proposal.status,
        valueDelta: {
          you: proposal.valueDeltaFrom,
          them: proposal.valueDeltaTo
        },
        needDelta: {
          you: {
            byPos: proposal.needDeltaFromByPos,
            before: proposal.needDeltaFromBefore,
            after: proposal.needDeltaFromAfter
          },
          them: {
            byPos: proposal.needDeltaToByPos,
            before: proposal.needDeltaToBefore,
            after: proposal.needDeltaToAfter
          }
        },
        rationale: proposal.rationale,
        generationMode: proposal.generationMode,
        items: proposal.items.map(item => ({
          id: item.id,
          playerId: item.playerId,
          playerName: item.playerName,
          position: item.position,
          value: item.value,
          direction: item.direction
        })),
        createdAt: proposal.createdAt.toISOString(),
        updatedAt: proposal.updatedAt.toISOString(),
        expiresAt: proposal.expiresAt?.toISOString()
      })),
      meta: {
        total: proposals.length,
        userTeamIds
      }
    });

  } catch (error) {
    console.error('Get proposals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRequestId(postHandler);
export const GET = withRequestId(getHandler);
