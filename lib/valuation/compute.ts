import { db } from '@/lib/database';
import { Prisma } from '@prisma/client';

export interface ValuationComponents {
  anchor: number;        // A: Auction/ADP baseline
  deltaPerf: number;     // ΔPerf: Performance delta from expectations  
  vorp: number;          // VORP: Value over replacement player
  global: number;        // G: Global market adjustment
}

export interface PlayerValuation {
  playerId: string;
  playerName: string;
  position: string;
  price: number;
  components: ValuationComponents;
}

export interface ValuationResult {
  leagueId: string;
  engineVersion: string;
  computedAt: Date;
  valuations: PlayerValuation[];
  metadata: {
    totalPlayers: number;
    avgPrice: number;
    priceRange: {
      min: number;
      max: number;
    };
  };
}

const ENGINE_VERSION = '0.1.0';

// Position-specific price clamps
const POSITION_CLAMPS = {
  'QB': { min: 1.0, max: 80.0 },
  'RB': { min: 0.5, max: 75.0 },
  'WR': { min: 0.5, max: 70.0 },
  'TE': { min: 0.5, max: 50.0 },
  'K': { min: 0.5, max: 15.0 },
  'D/ST': { min: 0.5, max: 20.0 }
} as const;

// Component weights from TDD specification
const COMPONENT_WEIGHTS = {
  anchor: 0.45,      // 45% - Auction/ADP baseline
  deltaPerf: 0.20,   // 20% - Performance adjustment  
  vorp: 0.25,        // 25% - Value over replacement
  global: 0.10       // 10% - Global market factors
} as const;

/**
 * Compute valuations for all players in a league
 */
export async function computeLeagueValuations(leagueId: string): Promise<ValuationResult> {
  console.log(`Starting valuation computation for league ${leagueId}`);
  
  // Get league and verify it exists
  const league = await db.league.findUnique({
    where: { id: leagueId },
    include: {
      teams: {
        include: {
          RosterSlot: {
            include: {
              player: true
            }
          }
        }
      }
    }
  });

  if (!league) {
    throw new Error(`League ${leagueId} not found`);
  }

  // Get all unique players in the league
  const playerIds = new Set<string>();
  for (const team of league.teams) {
    for (const slot of team.RosterSlot) {
      playerIds.add(slot.playerId);
    }
  }

  if (playerIds.size === 0) {
    console.log('No players found in league rosters');
    return {
      leagueId,
      engineVersion: ENGINE_VERSION,
      computedAt: new Date(),
      valuations: [],
      metadata: {
        totalPlayers: 0,
        avgPrice: 0,
        priceRange: { min: 0, max: 0 }
      }
    };
  }

  // Get player data with related information
  const players = await db.player.findMany({
    where: {
      id: { in: Array.from(playerIds) }
    },
    include: {
      AuctionPrice: {
        where: { leagueId },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      GameLog: {
        orderBy: { week: 'desc' },
        take: 4 // Last 4 weeks for performance calculation
      },
      Projection: {
        where: { week: { gte: 1 } }, // Current season projections
        orderBy: { week: 'desc' }
      }
    }
  });

  // Get replacement baselines for VORP calculation
  const baselines = await db.replacementBaseline.findMany({
    where: { season: league.season }
  });

  const baselineMap = baselines.reduce((acc, baseline) => {
    acc[baseline.pos] = baseline.ptsPerGame;
    return acc;
  }, {} as Record<string, number>);

  // Compute valuations for each player
  const valuations: PlayerValuation[] = [];
  
  for (const player of players) {
    try {
      const valuation = await computePlayerValuation(player, baselineMap, league);
      if (valuation) {
        valuations.push(valuation);
      }
    } catch (error) {
      console.warn(`Failed to compute valuation for player ${player.name}:`, error);
    }
  }

  // Calculate metadata
  const prices = valuations.map(v => v.price).filter(p => p > 0);
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  console.log(`Computed ${valuations.length} valuations for league ${leagueId}`);

  return {
    leagueId,
    engineVersion: ENGINE_VERSION,
    computedAt: new Date(),
    valuations,
    metadata: {
      totalPlayers: valuations.length,
      avgPrice: Math.round(avgPrice * 100) / 100,
      priceRange: {
        min: Math.round(minPrice * 100) / 100,
        max: Math.round(maxPrice * 100) / 100
      }
    }
  };
}

/**
 * Compute valuation for a single player
 */
async function computePlayerValuation(
  player: any,
  baselineMap: Record<string, number>,
  league: any
): Promise<PlayerValuation | null> {
  
  const position = player.posPrimary;
  const clamp = POSITION_CLAMPS[position as keyof typeof POSITION_CLAMPS];
  
  if (!clamp) {
    console.warn(`No price clamp defined for position: ${position}`);
    return null;
  }

  // Component 1: Anchor (A) - Auction price or ADP baseline
  const anchor = computeAnchorValue(player, position);

  // Component 2: Delta Performance (ΔPerf) - Recent performance vs expectations
  const deltaPerf = computeDeltaPerformance(player);

  // Component 3: VORP - Value over replacement player
  const vorp = computeVORP(player, baselineMap, position);

  // Component 4: Global (G) - Market adjustment factors
  const global = computeGlobalAdjustment(player, position);

  // Calculate final price using component weights
  const components: ValuationComponents = {
    anchor,
    deltaPerf, 
    vorp,
    global
  };

  const rawPrice = 
    COMPONENT_WEIGHTS.anchor * anchor +
    COMPONENT_WEIGHTS.deltaPerf * (anchor + deltaPerf) + // ΔPerf is additive to anchor
    COMPONENT_WEIGHTS.vorp * vorp +
    COMPONENT_WEIGHTS.global * global;

  // Apply position-specific clamps
  const price = Math.max(clamp.min, Math.min(clamp.max, rawPrice));

  return {
    playerId: player.id,
    playerName: player.name,
    position,
    price: Math.round(price * 100) / 100, // Round to 2 decimal places
    components: {
      anchor: Math.round(anchor * 100) / 100,
      deltaPerf: Math.round(deltaPerf * 100) / 100,
      vorp: Math.round(vorp * 100) / 100,
      global: Math.round(global * 100) / 100
    }
  };
}

/**
 * Compute anchor value (auction price or position baseline)
 */
function computeAnchorValue(player: any, position: string): number {
  // Use actual auction price if available
  if (player.AuctionPrice.length > 0) {
    return player.AuctionPrice[0].amount;
  }

  // Fall back to position-based baseline
  const positionBaselines = {
    'QB': 15.0,
    'RB': 20.0, 
    'WR': 18.0,
    'TE': 12.0,
    'K': 5.0,
    'D/ST': 8.0
  };

  return positionBaselines[position as keyof typeof positionBaselines] || 10.0;
}

/**
 * Compute delta performance (recent performance vs baseline)
 */
function computeDeltaPerformance(player: any): number {
  if (player.GameLog.length === 0) {
    return 0; // No recent performance data
  }

  // Calculate average points from recent games (last 4 weeks)
  const recentPoints = player.GameLog.slice(0, 4).map((log: any) => log.ptsActual);
  const avgRecent = recentPoints.reduce((a: number, b: number) => a + b, 0) / recentPoints.length;

  // Calculate season average if we have more data
  const seasonPoints = player.GameLog.map((log: any) => log.ptsActual);
  const avgSeason = seasonPoints.length > 0 
    ? seasonPoints.reduce((a: number, b: number) => a + b, 0) / seasonPoints.length 
    : avgRecent;

  // Delta is recent performance vs season average
  const delta = avgRecent - avgSeason;
  
  // Scale the delta (each point of performance difference = ~$2 in value)
  return delta * 2.0;
}

/**
 * Compute Value Over Replacement Player (VORP)
 */
function computeVORP(player: any, baselineMap: Record<string, number>, position: string): number {
  const replacementLevel = baselineMap[position] || 8.0; // Default replacement level

  // Estimate player's projected points per game
  let projectedPPG = replacementLevel;

  if (player.GameLog.length > 0) {
    // Use recent game log average
    const totalPoints = player.GameLog.reduce((sum: number, log: any) => sum + log.ptsActual, 0);
    projectedPPG = totalPoints / player.GameLog.length;
  } else if (player.Projection.length > 0) {
    // Fall back to projections
    const avgProjection = player.Projection.reduce((sum: number, proj: any) => sum + proj.ptsMean, 0) / player.Projection.length;
    projectedPPG = avgProjection;
  }

  // VORP is points above replacement * value per point
  const pointsAboveReplacement = Math.max(0, projectedPPG - replacementLevel);
  
  // Scale: each point above replacement = ~$1.5 in value
  return pointsAboveReplacement * 1.5;
}

/**
 * Compute global market adjustment
 */
function computeGlobalAdjustment(player: any, position: string): number {
  // Simple global adjustments based on position scarcity and league context
  const adjustments = {
    'QB': 2.0,   // QBs are plentiful, slight discount
    'RB': 5.0,   // RBs are scarce, premium
    'WR': 3.0,   // WRs are balanced
    'TE': 4.0,   // TEs are scarce after elite tier
    'K': 1.0,    // Kickers are mostly interchangeable  
    'D/ST': 2.0  // Defenses have some variability
  };

  return adjustments[position as keyof typeof adjustments] || 2.0;
}

/**
 * Save valuations to database
 */
export async function saveValuations(result: ValuationResult): Promise<void> {
  console.log(`Saving ${result.valuations.length} valuations to database`);
  
  const valuationRecords = result.valuations.map(valuation => ({
    leagueId: result.leagueId,
    playerId: valuation.playerId,
    price: valuation.price,
    components: valuation.components as Prisma.JsonValue,
    ts: result.computedAt,
    engineVersion: result.engineVersion
  }));

  // Delete old valuations for this engine version to avoid duplicates
  await db.valuation.deleteMany({
    where: {
      leagueId: result.leagueId,
      engineVersion: result.engineVersion
    }
  });

  // Insert new valuations in batches
  const batchSize = 100;
  for (let i = 0; i < valuationRecords.length; i += batchSize) {
    const batch = valuationRecords.slice(i, i + batchSize);
    await db.valuation.createMany({
      data: batch,
      skipDuplicates: true
    });
  }

  console.log(`Successfully saved ${valuationRecords.length} valuations`);
}