import { db } from '@/lib/database';
import { Prisma } from '@prisma/client';

export interface PlayersQueryParams {
  search?: string;
  pos?: string;
  owned?: 'all' | 'owned' | 'available';
  sort?: 'price' | 'name' | 'position' | 'team';
  cursor?: string;
  limit?: number;
}

export interface PlayerResult {
  playerId: string;
  name: string;
  pos: string;
  team: string | null;
  ownedByTeamId: string | null;
  ownedByTeamName: string | null;
  valuation: {
    price: number;
    components: {
      anchor?: number;
      deltaPerf?: number;
      vorp?: number;
      global?: number;
    };
  } | null;
}

export interface PlayersQueryResult {
  items: PlayerResult[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Query players with search, filtering, sorting, and pagination
 */
export async function queryPlayers(
  leagueId: string,
  params: PlayersQueryParams
): Promise<PlayersQueryResult> {
  const {
    search,
    pos,
    owned = 'all',
    sort = 'price',
    cursor,
    limit = 20
  } = params;

  // Build where clause
  const where: Prisma.PlayerWhereInput = {};

  // Search filter
  if (search && search.trim().length > 0) {
    where.name = {
      contains: search.trim(),
      mode: 'insensitive'
    };
  }

  // Position filter
  if (pos && pos !== 'ALL') {
    where.posPrimary = pos;
  }

  // Build order by clause
  const orderBy: Prisma.PlayerOrderByWithRelationInput[] = [];
  
  switch (sort) {
    case 'price':
      // Sort by latest valuation price (descending)
      orderBy.push({
        Valuation: {
          _count: 'desc' // Players with valuations first
        }
      });
      break;
    case 'name':
      orderBy.push({ name: 'asc' });
      break;
    case 'position':
      orderBy.push({ posPrimary: 'asc' }, { name: 'asc' });
      break;
    case 'team':
      orderBy.push({ teamAbbr: 'asc' }, { name: 'asc' });
      break;
    default:
      orderBy.push({ name: 'asc' });
  }

  // Always add a stable sort for pagination
  orderBy.push({ id: 'asc' });

  // Cursor-based pagination
  const cursorClause = cursor ? { id: { gt: cursor } } : {};
  const finalWhere = { ...where, ...cursorClause };

  // Execute query with joins
  const players = await db.player.findMany({
    where: finalWhere,
    orderBy,
    take: limit + 1, // Take one extra to check if there are more results
    include: {
      Valuation: {
        where: { leagueId },
        orderBy: { ts: 'desc' },
        take: 1 // Get latest valuation for this league
      },
      RosterSlot: {
        where: {
          team: { leagueId }
        },
        include: {
          team: {
            select: {
              id: true,
              name: true
            }
          }
        },
        take: 1 // Player should only be on one roster per league
      }
    }
  });

  // Check if there are more results
  const hasMore = players.length > limit;
  const items = hasMore ? players.slice(0, limit) : players;

  // Transform results
  const transformedItems: PlayerResult[] = items.map(player => {
    const latestValuation = player.Valuation[0];
    const rosterSlot = player.RosterSlot[0];

    return {
      playerId: player.id,
      name: player.name,
      pos: player.posPrimary,
      team: player.teamAbbr,
      ownedByTeamId: rosterSlot?.team.id || null,
      ownedByTeamName: rosterSlot?.team.name || null,
      valuation: latestValuation ? {
        price: latestValuation.price,
        components: typeof latestValuation.components === 'object' && latestValuation.components !== null
          ? latestValuation.components as any
          : {}
      } : null
    };
  });

  // Apply ownership filter after database query
  // (This could be optimized by moving to database query, but this is simpler for now)
  let filteredItems = transformedItems;
  if (owned === 'owned') {
    filteredItems = transformedItems.filter(item => item.ownedByTeamId !== null);
  } else if (owned === 'available') {
    filteredItems = transformedItems.filter(item => item.ownedByTeamId === null);
  }

  // Get next cursor
  const nextCursor = hasMore && filteredItems.length > 0
    ? filteredItems[filteredItems.length - 1]?.playerId || null
    : null;

  return {
    items: filteredItems,
    nextCursor,
    hasMore: hasMore && filteredItems.length === limit
  };
}

/**
 * Get available positions in the league
 */
export async function getAvailablePositions(leagueId: string): Promise<string[]> {
  const positions = await db.player.findMany({
    where: {
      RosterSlot: {
        some: {
          team: { leagueId }
        }
      }
    },
    select: {
      posPrimary: true
    },
    distinct: ['posPrimary'],
    orderBy: {
      posPrimary: 'asc'
    }
  });

  return positions.map(p => p.posPrimary);
}

/**
 * Get player ownership stats for the league
 */
export async function getOwnershipStats(leagueId: string) {
  const stats = await db.player.groupBy({
    by: ['posPrimary'],
    where: {
      RosterSlot: {
        some: {
          team: { leagueId }
        }
      }
    },
    _count: {
      id: true
    }
  });

  const totalOwned = stats.reduce((sum, stat) => sum + stat._count.id, 0);

  return {
    totalOwned,
    byPosition: stats.reduce((acc, stat) => {
      acc[stat.posPrimary] = stat._count.id;
      return acc;
    }, {} as Record<string, number>)
  };
}