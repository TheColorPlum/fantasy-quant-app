import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

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

    // Find the share link
    const shareLink = await db.proposalShare.findUnique({
      where: { 
        token: token,
        revokedAt: null // Only active links
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
        { error: 'Share link not found or has been revoked' },
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
        token: shareLink.token,
        createdAt: shareLink.createdAt.toISOString(),
        isActive: !shareLink.revokedAt
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