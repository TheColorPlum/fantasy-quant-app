import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/database';

export const runtime = 'nodejs';

const UpdateProposalSchema = z.object({
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).optional(),
  expiresAt: z.string().datetime().optional()
});

/**
 * Update a trade proposal status
 */
export async function PATCH(
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

    const proposalId = params.id;

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const updateData = UpdateProposalSchema.parse(body);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 }
      );
    }

    // Get the proposal and verify user has access
    const proposal = await db.tradeProposal.findUnique({
      where: { id: proposalId },
      include: {
        fromTeam: {
          include: {
            TeamClaim: {
              where: { userId: user.id }
            }
          }
        },
        toTeam: {
          include: {
            TeamClaim: {
              where: { userId: user.id }
            }
          }
        },
        items: true
      }
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if user has access to either team
    const hasFromTeamAccess = proposal.fromTeam.TeamClaim.length > 0;
    const hasToTeamAccess = proposal.toTeam.TeamClaim.length > 0;

    if (!hasFromTeamAccess && !hasToTeamAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this proposal' },
        { status: 403 }
      );
    }

    // Validate status transitions based on user role
    if (updateData.status) {
      const currentStatus = proposal.status;
      const newStatus = updateData.status;

      // Only from team can send/withdraw proposals
      if ((newStatus === 'sent' || newStatus === 'expired') && !hasFromTeamAccess) {
        return NextResponse.json(
          { error: 'Only the proposing team can send or expire proposals' },
          { status: 403 }
        );
      }

      // Only to team can accept/reject proposals
      if ((newStatus === 'accepted' || newStatus === 'rejected') && !hasToTeamAccess) {
        return NextResponse.json(
          { error: 'Only the target team can accept or reject proposals' },
          { status: 403 }
        );
      }

      // Validate status transitions
      const validTransitions: Record<string, string[]> = {
        'draft': ['sent', 'expired'],
        'sent': ['accepted', 'rejected', 'expired'],
        'accepted': [], // Final state
        'rejected': [], // Final state
        'expired': []   // Final state
      };

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${currentStatus} to ${newStatus}` },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateFields: any = {};
    if (updateData.status) {
      updateFields.status = updateData.status;
    }
    if (updateData.expiresAt) {
      updateFields.expiresAt = new Date(updateData.expiresAt);
    }

    // Update the proposal
    const updatedProposal = await db.tradeProposal.update({
      where: { id: proposalId },
      data: updateFields,
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
      }
    });

    return NextResponse.json({
      success: true,
      proposal: {
        id: updatedProposal.id,
        leagueId: updatedProposal.leagueId,
        league: updatedProposal.league,
        fromTeam: updatedProposal.fromTeam,
        toTeam: updatedProposal.toTeam,
        status: updatedProposal.status,
        valueDelta: {
          you: updatedProposal.valueDeltaFrom,
          them: updatedProposal.valueDeltaTo
        },
        needDelta: {
          you: {
            byPos: updatedProposal.needDeltaFromByPos,
            before: updatedProposal.needDeltaFromBefore,
            after: updatedProposal.needDeltaFromAfter
          },
          them: {
            byPos: updatedProposal.needDeltaToByPos,
            before: updatedProposal.needDeltaToBefore,
            after: updatedProposal.needDeltaToAfter
          }
        },
        rationale: updatedProposal.rationale,
        generationMode: updatedProposal.generationMode,
        items: updatedProposal.items.map(item => ({
          id: item.id,
          playerId: item.playerId,
          playerName: item.playerName,
          position: item.position,
          value: item.value,
          direction: item.direction
        })),
        createdAt: updatedProposal.createdAt.toISOString(),
        updatedAt: updatedProposal.updatedAt.toISOString(),
        expiresAt: updatedProposal.expiresAt?.toISOString()
      }
    });

  } catch (error) {
    console.error('Proposal update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update trade proposal',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Get a specific trade proposal
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

    const proposalId = params.id;

    // Get the proposal with all related data
    const proposal = await db.tradeProposal.findUnique({
      where: { id: proposalId },
      include: {
        items: true,
        fromTeam: {
          select: { id: true, name: true, espnTeamId: true },
          include: {
            TeamClaim: {
              where: { userId: user.id }
            }
          }
        },
        toTeam: {
          select: { id: true, name: true, espnTeamId: true },
          include: {
            TeamClaim: {
              where: { userId: user.id }
            }
          }
        },
        league: {
          select: { id: true, name: true, season: true }
        }
      }
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if user has access to either team
    const hasFromTeamAccess = proposal.fromTeam.TeamClaim.length > 0;
    const hasToTeamAccess = proposal.toTeam.TeamClaim.length > 0;

    if (!hasFromTeamAccess && !hasToTeamAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this proposal' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      proposal: {
        id: proposal.id,
        leagueId: proposal.leagueId,
        league: proposal.league,
        fromTeam: {
          id: proposal.fromTeam.id,
          name: proposal.fromTeam.name,
          espnTeamId: proposal.fromTeam.espnTeamId
        },
        toTeam: {
          id: proposal.toTeam.id,
          name: proposal.toTeam.name,
          espnTeamId: proposal.toTeam.espnTeamId
        },
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
        expiresAt: proposal.expiresAt?.toISOString(),
        userAccess: {
          canSend: hasFromTeamAccess && proposal.status === 'draft',
          canAcceptReject: hasToTeamAccess && proposal.status === 'sent',
          canExpire: hasFromTeamAccess && ['draft', 'sent'].includes(proposal.status)
        }
      }
    });

  } catch (error) {
    console.error('Get proposal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete a trade proposal (only drafts by the creating user)
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

    const proposalId = params.id;

    // Get the proposal and verify user has access
    const proposal = await db.tradeProposal.findUnique({
      where: { id: proposalId },
      include: {
        fromTeam: {
          include: {
            TeamClaim: {
              where: { userId: user.id }
            }
          }
        }
      }
    });

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Only allow deletion by the creating team and only for draft status
    const hasFromTeamAccess = proposal.fromTeam.TeamClaim.length > 0;
    if (!hasFromTeamAccess) {
      return NextResponse.json(
        { error: 'Only the proposing team can delete proposals' },
        { status: 403 }
      );
    }

    if (proposal.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft proposals can be deleted' },
        { status: 400 }
      );
    }

    // Delete the proposal (items will be cascade deleted)
    await db.tradeProposal.delete({
      where: { id: proposalId }
    });

    return NextResponse.json({
      success: true,
      message: 'Proposal deleted successfully'
    });

  } catch (error) {
    console.error('Proposal deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete proposal' },
      { status: 500 }
    );
  }
}