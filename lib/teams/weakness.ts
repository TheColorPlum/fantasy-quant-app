import { db } from '@/lib/database';

export interface WeaknessItem {
  pos: string;
  deficitPts: number;
  deficitValue: number;
  drivers: string[];
}

export interface WeaknessResult {
  needScore: number;
  items: WeaknessItem[];
}

export interface StarterSlot {
  pos: string;
  playerId: string | null;
  playerName: string | null;
  projectedPts: number;
  isBye: boolean;
  isInjured: boolean;
}

/**
 * Calculate team weakness using TDD A9 formula
 */
export async function calculateTeamWeakness(
  leagueId: string, 
  teamId: string
): Promise<WeaknessResult> {
  console.log(`Calculating weakness for team ${teamId} in league ${leagueId}`);

  // Get team with current roster
  const team = await db.team.findUnique({
    where: { id: teamId },
    include: {
      league: true,
      RosterSlot: {
        include: {
          player: {
            include: {
              Projection: {
                where: { week: { gte: 1 } }, // Current season projections
                orderBy: { week: 'desc' },
                take: 4 // Use recent projections
              },
              GameLog: {
                orderBy: { week: 'desc' },
                take: 4 // Recent performance
              }
            }
          }
        }
      }
    }
  });

  if (!team) {
    throw new Error(`Team ${teamId} not found`);
  }

  // Get replacement baselines for this season
  const baselines = await db.replacementBaseline.findMany({
    where: { season: team.league.season }
  });

  const baselineMap = baselines.reduce((acc, baseline) => {
    acc[baseline.pos] = baseline.ptsPerGame;
    return acc;
  }, {} as Record<string, number>);

  // Get current valuations to calculate VPP - TDD A9 requirement
  const valuations = await db.valuation.findMany({
    where: { 
      leagueId: leagueId 
    },
    orderBy: { ts: 'desc' },
    take: 100 // Get recent valuations for VPP calculation
  });

  // Calculate value-per-point using same method as valuation engine
  const vpp = await calculateValuePerPointFromValuations(valuations, baselineMap);

  // Get league's roster rules to understand starting lineup requirements
  const rosterRules = typeof team.league.rosterRulesJson === 'object' && team.league.rosterRulesJson !== null
    ? team.league.rosterRulesJson as any
    : {};

  // Define standard lineup requirements (fallback if rosterRules incomplete)
  const standardLineup = {
    QB: 1,
    RB: 2, 
    WR: 2,
    TE: 1,
    FLEX: 1, // RB/WR/TE
    K: 1,
    'D/ST': 1
  };

  const lineupRequirements = { ...standardLineup, ...rosterRules };

  // Calculate projected points for each rostered player
  const rosterPlayers = team.RosterSlot.map(slot => {
    const player = slot.player;
    if (!player) {
      return {
        playerId: null,
        playerName: null,
        pos: 'UNKNOWN',
        projectedPts: 0,
        isBye: false,
        isInjured: false
      };
    }

    // Calculate projected points (use recent projections or game log average)
    let projectedPts = 0;
    if (player.Projection.length > 0) {
      projectedPts = player.Projection.reduce((sum, proj) => sum + proj.ptsMean, 0) / player.Projection.length;
    } else if (player.GameLog.length > 0) {
      projectedPts = player.GameLog.reduce((sum, log) => sum + log.ptsActual, 0) / player.GameLog.length;
    }

    // TODO: Implement bye week and injury detection
    // For now, use simple heuristics
    const isBye = false; // Would check current week vs team schedule
    const isInjured = false; // Would check injury status

    return {
      playerId: player.id,
      playerName: player.name,
      pos: player.posPrimary,
      projectedPts: Math.max(0, projectedPts),
      isBye,
      isInjured
    };
  });

  // Select optimal starters using greedy algorithm
  const { starters, flexStarter } = selectOptimalStarters(rosterPlayers, lineupRequirements);

  // Calculate deficits using TDD A9 formula
  const weaknessItems: WeaknessItem[] = [];
  let totalNeedScore = 0;

  // TDD A9: For each position p, calculate B_p_team and S_p_team
  for (const [pos, required] of Object.entries(lineupRequirements)) {
    if (pos === 'FLEX') continue; // Handle FLEX separately

    const baseline = baselineMap[pos] || 8.0; // R_p (replacement baseline)
    const positionStarters = starters.filter(starter => starter.pos === pos);
    
    
    // B_p_team = lineupSlotCounts[p] × R_p
    const baselineTeamPts = required * baseline;
    
    // S_p_team = Σ PPG_proj_i of chosen starters at p
    let starterTeamPts = 0;
    for (let i = 0; i < required; i++) {
      const starter = positionStarters[i];
      starterTeamPts += starter?.projectedPts || 0;
    }
    
    // Deficit_p = max(0, B_p_team − S_p_team)
    const deficitPts = Math.max(0, baselineTeamPts - starterTeamPts);
    
    // Create individual deficit items for each slot (independent of total position deficit)
    for (let i = 0; i < required; i++) {
      const starter = positionStarters[i];
      const starterPts = starter?.projectedPts || 0;
      const slotDeficit = Math.max(0, baseline - starterPts);
      
      
      if (slotDeficit > 0.1) {
        const drivers = buildDeficitDrivers(starter, baseline, i + 1);
        const slotDeficitValue = vpp * slotDeficit;
        
        weaknessItems.push({
          pos: pos + (required > 1 ? (i + 1).toString() : ''),
          deficitPts: Math.round(slotDeficit * 100) / 100,
          deficitValue: Math.round(slotDeficitValue * 100) / 100,
          drivers
        });
        
        // Add individual slot deficit to total need score
        totalNeedScore += slotDeficit;
      }
    }
  }

  // Handle FLEX position using TDD A9 formula
  if (lineupRequirements.FLEX) {
    // Use minimum baseline of FLEX-eligible positions as FLEX baseline
    const flexBaseline = Math.min(
      baselineMap.RB || 12.0,
      baselineMap.WR || 11.0, 
      baselineMap.TE || 9.0
    );
    
    const flexPts = flexStarter?.projectedPts || 0;
    const flexDeficit = Math.max(0, flexBaseline - flexPts);
    
    if (flexDeficit > 0.1) {
      const drivers = buildDeficitDrivers(flexStarter, flexBaseline, 1, 'FLEX');
      const deficitValue = vpp * flexDeficit; // Use VPP from TDD formula
      
      weaknessItems.push({
        pos: 'FLEX',
        deficitPts: Math.round(flexDeficit * 100) / 100,
        deficitValue: Math.round(deficitValue * 100) / 100,
        drivers
      });

      totalNeedScore += flexDeficit;
    }
  }

  // Sort by deficit points (worst first)
  weaknessItems.sort((a, b) => b.deficitPts - a.deficitPts);

  return {
    needScore: Math.round(totalNeedScore * 100) / 100,
    items: weaknessItems
  };
}

/**
 * Select optimal starting lineup using greedy algorithm
 */
function selectOptimalStarters(
  rosterPlayers: any[],
  lineupRequirements: Record<string, number>
): { starters: any[], flexStarter: any | null } {
  const starters: any[] = [];
  const available = [...rosterPlayers];

  // Sort by projected points (descending)
  available.sort((a, b) => b.projectedPts - a.projectedPts);

  // Fill each position requirement
  for (const [pos, required] of Object.entries(lineupRequirements)) {
    if (pos === 'FLEX') continue; // Handle FLEX after core positions

    for (let i = 0; i < required; i++) {
      const playerIndex = available.findIndex(p => p.pos === pos);
      if (playerIndex >= 0) {
        const player = available.splice(playerIndex, 1)[0];
        starters.push(player);
      }
    }
  }

  // Handle FLEX positions (RB/WR/TE eligible)
  let flexStarter: any | null = null;
  if (lineupRequirements.FLEX) {
    for (let i = 0; i < lineupRequirements.FLEX; i++) {
      const flexIndex = available.findIndex(p => ['RB', 'WR', 'TE'].includes(p.pos));
      if (flexIndex >= 0) {
        const player = available.splice(flexIndex, 1)[0];
        if (i === 0) flexStarter = player; // Track first FLEX for deficit calculation
        starters.push(player);
      }
    }
  }

  return { starters, flexStarter };
}

/**
 * Build human-readable drivers for why a position has a deficit
 */
function buildDeficitDrivers(
  starter: any,
  baseline: number,
  slotNumber: number,
  positionLabel?: string
): string[] {
  const drivers: string[] = [];

  if (!starter) {
    drivers.push(`No player in ${positionLabel || 'position'}`);
    return drivers;
  }

  const pts = starter.projectedPts;
  const gap = baseline - pts;

  if (gap > 0) {
    if (positionLabel === 'FLEX') {
      drivers.push(`${positionLabel} ${gap.toFixed(1)}pts below baseline`);
    } else {
      const posLabel = positionLabel || `${starter.pos}${slotNumber}`;
      drivers.push(`${posLabel} ${gap.toFixed(1)}pts below baseline`);
    }
  }

  if (starter.isBye) {
    drivers.push('BYE week');
  }

  if (starter.isInjured) {
    drivers.push('Injured');
  }

  if (pts < 5.0) {
    drivers.push('Low projected output');
  }

  return drivers.length > 0 ? drivers : [`${starter.playerName} underperforming`];
}

/**
 * Calculate value-per-point from existing valuations - follows TDD A4 method
 */
async function calculateValuePerPointFromValuations(
  valuations: any[],
  baselineMap: Record<string, number>
): Promise<number> {
  if (valuations.length === 0) {
    console.warn('No valuations found for VPP calculation, using fallback');
    return 2.0; // Conservative fallback VPP
  }

  // Get players with auction prices from components
  const playersWithAuctions = valuations.filter(v => 
    v.components && 
    typeof v.components === 'object' && 
    v.components.anchor && 
    v.components.anchor > 0
  );

  if (playersWithAuctions.length === 0) {
    console.warn('No auction data in valuations, using fallback VPP');
    return 2.0; // Fallback
  }

  let vppSum = 0;
  let vppValues: number[] = [];

  for (const valuation of playersWithAuctions) {
    const components = valuation.components;
    const auctionPrice = components.anchor; // A_i from components
    
    // Extract VORP points from components (this contains the PPG_proj - R calculation)  
    const vorpComponent = components.vorp || 0;
    
    if (vorpComponent > 0.1) { // Avoid division by very small numbers
      const playerVpp = auctionPrice / Math.max(0.1, vorpComponent);
      vppValues.push(playerVpp);
      vppSum += auctionPrice;
    }
  }

  if (vppValues.length === 0) {
    return 2.0; // Fallback
  }

  // Calculate total VORP points
  const totalVorpPoints = playersWithAuctions.reduce((sum, v) => {
    return sum + Math.max(0.1, v.components.vorp || 0);
  }, 0);

  const vppSumMethod = vppSum / totalVorpPoints;
  const vppMedian = median(vppValues);

  // TDD A4: vpp = 0.5*vpp_sum + 0.5*vpp_med
  const vpp = 0.5 * vppSumMethod + 0.5 * vppMedian;

  console.log(`VPP from valuations: sum=$${vppSumMethod.toFixed(2)}, median=$${vppMedian.toFixed(2)}, final=$${vpp.toFixed(2)}`);
  return Math.max(1.0, vpp); // Ensure reasonable minimum
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