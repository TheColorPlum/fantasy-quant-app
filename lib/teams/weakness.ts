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
 * Calculate team weakness by comparing starters to replacement baselines
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

  // Calculate deficits by position
  const weaknessItems: WeaknessItem[] = [];
  let totalNeedScore = 0;

  for (const [pos, required] of Object.entries(lineupRequirements)) {
    if (pos === 'FLEX') continue; // Handle FLEX separately

    const positionStarters = starters.filter(starter => starter.pos === pos);
    const baseline = baselineMap[pos] || 8.0; // Default baseline

    for (let i = 0; i < required; i++) {
      const starter = positionStarters[i];
      const starterPts = starter?.projectedPts || 0;
      const deficitPts = Math.max(0, baseline - starterPts);
      
      if (deficitPts > 0.1) { // Only report meaningful deficits
        const drivers = buildDeficitDrivers(starter, baseline, i + 1);
        const deficitValue = calculateDeficitValue(deficitPts, team.league.auctionBudget || 200);
        
        weaknessItems.push({
          pos: pos + (required > 1 ? (i + 1).toString() : ''),
          deficitPts: Math.round(deficitPts * 100) / 100,
          deficitValue: Math.round(deficitValue * 100) / 100,
          drivers
        });

        totalNeedScore += deficitPts;
      }
    }
  }

  // Handle FLEX position (RB/WR/TE flexibility)
  if (lineupRequirements.FLEX && flexStarter) {
    const flexBaseline = Math.min(
      baselineMap.RB || 12.0,
      baselineMap.WR || 11.0, 
      baselineMap.TE || 9.0
    );
    
    const flexPts = flexStarter.projectedPts || 0;
    const flexDeficit = Math.max(0, flexBaseline - flexPts);
    
    if (flexDeficit > 0.1) {
      const drivers = buildDeficitDrivers(flexStarter, flexBaseline, 1, 'FLEX');
      const deficitValue = calculateDeficitValue(flexDeficit, team.league.auctionBudget || 200);
      
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
 * Convert deficit points to dollar value based on league auction budget
 */
function calculateDeficitValue(deficitPts: number, auctionBudget: number): number {
  // Simple value per point calculation
  // In a typical 200-budget league, value-per-point is approximately $1.5-2.0
  const valuePerPoint = auctionBudget / 100; // Rough approximation
  return deficitPts * valuePerPoint;
}