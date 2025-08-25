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

const ENGINE_VERSION = '1.0.0';

// TDD Constants from Appendix
const EMA_ALPHA = 1 - Math.pow(2, -1/3); // ≈ 0.2063 for half-life h=3
const EPSILON = 0.1; // Smoothing epsilon
const H_PERF = 3; // Performance horizon in weeks  
const H_VORP = 1; // VORP horizon in weeks
const REPLACEMENT_SMOOTHING_K = 3; // Replacement baseline smoothing

// Component weights from TDD specification (A8)
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

  // Calculate value-per-point (vpp) from auction data - TDD A4
  const vpp = calculateValuePerPoint(players, baselineMap);
  
  console.log(`Calculated value-per-point: $${vpp.toFixed(2)}`);

  // Compute valuations for each player
  const valuations: PlayerValuation[] = [];
  
  for (const player of players) {
    try {
      const valuation = await computePlayerValuation(player, baselineMap, vpp, league);
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
 * Compute valuation for a single player following TDD specification
 */
async function computePlayerValuation(
  player: any,
  baselineMap: Record<string, number>,
  vpp: number,
  league: any
): Promise<PlayerValuation | null> {
  
  const position = player.posPrimary;

  // Get projected points per game
  const ppgProj = getProjectedPointsPerGame(player);
  
  // Component 1: Anchor (C_anchor_i = A_i) - TDD A7
  const anchor = getAuctionPrice(player);

  // Component 2: Delta Performance (C_perf_i) - TDD A5
  const deltaPerf = computeDeltaPerformanceEMA(player, ppgProj, vpp);

  // Component 3: VORP (C_vorp_i) - TDD A6  
  const vorp = computeVORPComponent(player, baselineMap, position, ppgProj, vpp);

  // Component 4: Global (G_i) - TDD A7 (0 in MVP)
  const global = 0; // As specified in TDD: "G_i as normalized global anchor, 0 in MVP if absent"

  // Calculate final price using TDD A8 formula
  const components: ValuationComponents = {
    anchor,
    deltaPerf, 
    vorp,
    global
  };

  const rawPrice = 
    COMPONENT_WEIGHTS.anchor * anchor +
    COMPONENT_WEIGHTS.deltaPerf * (anchor + deltaPerf) + // Note: (anchor + deltaPerf) not just deltaPerf
    COMPONENT_WEIGHTS.vorp * vorp +
    COMPONENT_WEIGHTS.global * global;

  // Apply position-specific clamps - TDD A8 mentions using p05/p95 but for MVP use simpler clamps
  const price = Math.max(0.5, rawPrice); // Minimum $0.50, no arbitrary max for now

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
 * Calculate value-per-point (vpp) from auction data - TDD A4
 */
function calculateValuePerPoint(players: any[], baselineMap: Record<string, number>): number {
  // Get players with auction prices: S = { i | A_i > 0 }
  const playersWithAuctions = players.filter(p => p.AuctionPrice.length > 0);
  
  if (playersWithAuctions.length === 0) {
    console.warn('No auction data found, using fallback VPP');
    return 1.0; // Conservative fallback as per TDD
  }

  let vppSum = 0;
  let vppValues: number[] = [];
  
  for (const player of playersWithAuctions) {
    const auctionPrice = player.AuctionPrice[0].amount; // A_i
    const ppgProj = getProjectedPointsPerGame(player);
    const baseline = baselineMap[player.posPrimary] || 8.0; // R_{pos(i)}
    const vorpPoints = Math.max(EPSILON, ppgProj - baseline); // max(ε, PPG_proj_i − R_{pos(i)})
    
    const playerVpp = auctionPrice / vorpPoints;
    vppValues.push(playerVpp);
    vppSum += auctionPrice;
  }
  
  // TDD A4 formula
  const totalVorpPoints = playersWithAuctions.reduce((sum, player) => {
    const ppgProj = getProjectedPointsPerGame(player);
    const baseline = baselineMap[player.posPrimary] || 8.0;
    return sum + Math.max(EPSILON, ppgProj - baseline);
  }, 0);
  
  const vppSumMethod = vppSum / totalVorpPoints;
  const vppMedian = median(vppValues);
  
  // vpp = 0.5*vpp_sum + 0.5*vpp_med
  const vpp = 0.5 * vppSumMethod + 0.5 * vppMedian;
  
  console.log(`VPP calculation: sum=$${vppSumMethod.toFixed(2)}, median=$${vppMedian.toFixed(2)}, final=$${vpp.toFixed(2)}`);
  return vpp;
}

/**
 * Get projected points per game for a player
 */
function getProjectedPointsPerGame(player: any): number {
  // Use most recent projection if available
  if (player.Projection.length > 0) {
    const projections = player.Projection.sort((a: any, b: any) => b.week - a.week);
    return projections[0].ptsMean;
  }
  
  // Fallback to TDD A3: PPG_fallback_i = 0.6×rolling_avg_actual_3w + 0.4×pos_mean_proj
  if (player.GameLog.length > 0) {
    const recentLogs = player.GameLog.slice(0, 3); // Last 3 weeks
    const rollingAvg = recentLogs.reduce((sum: number, log: any) => sum + log.ptsActual, 0) / recentLogs.length;
    
    // For MVP, use rolling average * 0.6 + position mean * 0.4
    const posMeanFallback = {
      'QB': 18.0, 'RB': 14.0, 'WR': 13.0, 'TE': 10.0, 'K': 8.0, 'D/ST': 9.0
    };
    const positionMean = posMeanFallback[player.posPrimary as keyof typeof posMeanFallback] || 12.0;
    
    return 0.6 * rollingAvg + 0.4 * positionMean;
  }
  
  // Ultimate fallback: position baseline
  const posBaseline = {
    'QB': 16.0, 'RB': 12.0, 'WR': 11.0, 'TE': 8.5, 'K': 7.0, 'D/ST': 8.0
  };
  return posBaseline[player.posPrimary as keyof typeof posBaseline] || 10.0;
}

/**
 * Get auction price (A_i) - TDD A7  
 */
function getAuctionPrice(player: any): number {
  return player.AuctionPrice.length > 0 ? player.AuctionPrice[0].amount : 0;
}

/**
 * Compute delta performance using EMA - TDD A5
 */
function computeDeltaPerformanceEMA(player: any, ppgProj: number, vpp: number): number {
  if (player.GameLog.length === 0) {
    return 0; // ΔPerf_i[0] = 0
  }
  
  const logs = player.GameLog.sort((a: any, b: any) => a.week - b.week); // Sort chronologically
  let deltaPerf = 0; // ΔPerf_i[0] = 0
  
  for (const log of logs) {
    // Weekly error: e_i[w] = PPG_actual_i[w] − PPG_proj_i[w]
    const error = log.ptsActual - ppgProj;
    // ΔPerf_i[w] = α*e_i[w] + (1−α)*ΔPerf_i[w−1]
    deltaPerf = EMA_ALPHA * error + (1 - EMA_ALPHA) * deltaPerf;
  }
  
  // Currency tilt: C_perf_i = vpp × H_perf × ΔPerf_i
  return vpp * H_PERF * deltaPerf;
}

/**
 * Compute VORP component - TDD A6
 */
function computeVORPComponent(player: any, baselineMap: Record<string, number>, position: string, ppgProj: number, vpp: number): number {
  const replacementLevel = baselineMap[position] || 8.0; // R_{pos(i)}
  
  // VORP_pts_i = PPG_proj_i − R_{pos(i)}
  const vorpPoints = ppgProj - replacementLevel;
  
  // C_vorp_i = vpp × H_vorp × VORP_pts_i  
  return vpp * H_VORP * vorpPoints;
}

/**
 * Calculate median of array
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
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
    components: valuation.components as unknown as Prisma.InputJsonValue,
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