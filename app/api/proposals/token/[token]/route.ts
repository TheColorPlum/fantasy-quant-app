import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { hashToken, isExpired, isValidTokenFormat } from '@/lib/share-tokens';

export const runtime = 'nodejs';

/**
 * Get a trade proposal by share token (read-only access)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    // Validate token format
    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    // Hash the token for database lookup
    const tokenHash = hashToken(token);

    // Find the share link by hash
    const shareLink = await db.proposalShare.findUnique({
      where: { 
        tokenHash: tokenHash
      },
      include: {
        proposal: {
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
        }
      }
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found or has expired' },
        { status: 404 }
      );
    }

    // Check if the token has expired
    if (isExpired(shareLink.expiresAt)) {
      return NextResponse.json(
        { error: 'Share link not found or has expired' },
        { status: 404 }
      );
    }

    const proposal = shareLink.proposal;

    return NextResponse.json({
      proposal: {
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
        expiresAt: proposal.expiresAt?.toISOString(),
        isReadOnly: true // Mark as read-only for token access
      },
      shareInfo: {
        // Never expose the token or tokenHash for security
        createdAt: shareLink.createdAt.toISOString(),
        expiresAt: shareLink.expiresAt.toISOString(),
        isActive: !isExpired(shareLink.expiresAt)
      }
    }, {
      headers: {
        // Cache for 5 minutes since shared proposals shouldn't change frequently
        'Cache-Control': 's-maxage=300, stale-while-revalidate=600'
      }
    });

  } catch (error) {
    console.error('Token proposal fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}