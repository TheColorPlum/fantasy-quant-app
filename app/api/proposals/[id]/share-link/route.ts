import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { db } from '@/lib/database';
import { generateSecureToken, hashToken, createExpirationDate, isExpired } from '@/lib/share-tokens';

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

    // Check if there's already an active (non-expired) share link
    const activeShare = proposal.shares.find(share => !isExpired(share.expiresAt));
    if (activeShare) {
      // Return existing active share info (but generate new token for response)
      const newToken = generateSecureToken(32);
      const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/proposals?token=${newToken}`;
      
      return NextResponse.json({
        success: true,
        shareLink: {
          id: activeShare.id,
          token: newToken, // New token for this request
          url: shareUrl,
          createdAt: activeShare.createdAt.toISOString(),
          expiresAt: activeShare.expiresAt.toISOString(),
          isNew: false
        }
      });
    }

    // Generate a secure base62 token and hash it
    const token = generateSecureToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = createExpirationDate();

    // Create the share link with hashed token and expiration
    const shareLink = await db.proposalShare.create({
      data: {
        proposalId: proposalId,
        tokenHash: tokenHash,
        expiresAt: expiresAt
      }
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/proposals?token=${token}`;

    return NextResponse.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        token: token, // Return raw token only for immediate use
        url: shareUrl,
        createdAt: shareLink.createdAt.toISOString(),
        expiresAt: shareLink.expiresAt.toISOString(),
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

    // Expire all active share links for this proposal by setting expiresAt to now
    const now = new Date();
    const result = await db.proposalShare.updateMany({
      where: {
        proposalId: proposalId,
        expiresAt: {
          gt: now
        }
      },
      data: {
        expiresAt: now // Expire immediately
      }
    });

    return NextResponse.json({
      success: true,
      message: `Expired ${result.count} share link(s)`,
      revokedCount: result.count
    });

  } catch (error) {
    console.error('Share link expiration error:', error);
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

    // Find active (non-expired) share link
    const activeShare = proposal.shares.find(share => !isExpired(share.expiresAt));

    return NextResponse.json({
      hasActiveLink: !!activeShare,
      activeLink: activeShare ? {
        id: activeShare.id,
        // Never expose token or tokenHash in responses
        expiresAt: activeShare.expiresAt.toISOString(),
        createdAt: activeShare.createdAt.toISOString()
      } : null,
      allLinks: proposal.shares.map(share => ({
        id: share.id,
        // Never expose tokenHash for security
        createdAt: share.createdAt.toISOString(),
        expiresAt: share.expiresAt.toISOString(),
        isActive: !isExpired(share.expiresAt)
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