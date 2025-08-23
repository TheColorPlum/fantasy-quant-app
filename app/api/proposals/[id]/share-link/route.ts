import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/database';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * Create a share link for a trade proposal
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
        },
        toTeam: {
          include: {
            TeamClaim: {
              where: { userId: user.id }
            }
          }
        },
        shares: {
          where: {
            revokedAt: null
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

    // Check if user has access to either team
    const hasFromTeamAccess = proposal.fromTeam.TeamClaim.length > 0;
    const hasToTeamAccess = proposal.toTeam.TeamClaim.length > 0;

    if (!hasFromTeamAccess && !hasToTeamAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this proposal' },
        { status: 403 }
      );
    }

    // Check if there's already an active share link
    if (proposal.shares.length > 0) {
      const existingShare = proposal.shares[0];
      const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/proposals?token=${existingShare.token}`;
      
      return NextResponse.json({
        success: true,
        shareLink: {
          id: existingShare.id,
          token: existingShare.token,
          url: shareUrl,
          createdAt: existingShare.createdAt.toISOString(),
          isNew: false
        }
      });
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Create the share link
    const shareLink = await db.proposalShare.create({
      data: {
        proposalId: proposalId,
        token: token
      }
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/proposals?token=${token}`;

    return NextResponse.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        url: shareUrl,
        createdAt: shareLink.createdAt.toISOString(),
        isNew: true
      }
    });

  } catch (error) {
    console.error('Share link creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create share link',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Revoke a share link for a trade proposal
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
        },
        toTeam: {
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

    // Check if user has access to either team
    const hasFromTeamAccess = proposal.fromTeam.TeamClaim.length > 0;
    const hasToTeamAccess = proposal.toTeam.TeamClaim.length > 0;

    if (!hasFromTeamAccess && !hasToTeamAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this proposal' },
        { status: 403 }
      );
    }

    // Revoke all active share links for this proposal
    const result = await db.proposalShare.updateMany({
      where: {
        proposalId: proposalId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Revoked ${result.count} share link(s)`,
      revokedCount: result.count
    });

  } catch (error) {
    console.error('Share link revocation error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}

/**
 * Get share link information for a proposal
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
        shares: {
          orderBy: {
            createdAt: 'desc'
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

    // Check if user has access to either team
    const hasFromTeamAccess = proposal.fromTeam.TeamClaim.length > 0;
    const hasToTeamAccess = proposal.toTeam.TeamClaim.length > 0;

    if (!hasFromTeamAccess && !hasToTeamAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this proposal' },
        { status: 403 }
      );
    }

    // Find active share link
    const activeShare = proposal.shares.find(share => !share.revokedAt);

    return NextResponse.json({
      hasActiveLink: !!activeShare,
      activeLink: activeShare ? {
        id: activeShare.id,
        token: activeShare.token,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/proposals?token=${activeShare.token}`,
        createdAt: activeShare.createdAt.toISOString()
      } : null,
      allLinks: proposal.shares.map(share => ({
        id: share.id,
        token: share.token,
        createdAt: share.createdAt.toISOString(),
        revokedAt: share.revokedAt?.toISOString(),
        isActive: !share.revokedAt
      }))
    });

  } catch (error) {
    console.error('Get share link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}