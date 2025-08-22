import { db } from '@/lib/database';
import { calculateTeamWeakness } from '@/lib/teams/weakness';

export interface TradeGenerationParams {
  fromTeamId: string;
  toTeamId?: string;
  targets?: string[];
  sendables?: string[];
  mode?: 'balanced' | 'strict';
}

export interface TradeItem {
  playerId: string;
  playerName: string;
  position: string;
  value: number;
}

export interface TradeProposal {
  proposalId: string;
  give: TradeItem[];
  get: TradeItem[];
  valueDelta: {
    you: number;
    them: number;
  };
  needDelta: {
    you: {
      byPos: Record<string, number>;
      before: number;
      after: number;
    };
    them: {
      byPos: Record<string, number>;
      before: number;
      after: number;
    };
  };
  rationale: string;
}

export interface TradeGenerationResult {
  proposals: TradeProposal[];
  meta: {
    totalCandidates: number;
    filteredCandidates: number;
    mode: 'balanced' | 'strict';
    fromTeamId: string;
    targetTeamIds: string[];
  };
}

interface PlayerData {
  id: string;
  name: string;
  pos: string;
  value: number;
  teamId: string;
}

interface TeamData {
  id: string;
  name: string;
  players: PlayerData[];
  totalValue: number;
  needScore: number;
  needsByPos: Record<string, number>;
}

/**
 * Generate trade proposals using balanced win-win algorithm
 */
export async function generateTradeProposals(
  leagueId: string,
  params: TradeGenerationParams
): Promise<TradeGenerationResult> {
  console.log(`Generating trade proposals for team ${params.fromTeamId} in league ${leagueId}`);

  const mode = params.mode || 'balanced';
  const fromTeamId = params.fromTeamId;

  // Get league data with teams and players
  const league = await db.league.findUnique({
    where: { id: leagueId },
    include: {
      teams: {
        include: {
          RosterSlot: {
            include: {
              player: {
                include: {
                  Valuation: {
                    where: { leagueId },
                    orderBy: { ts: 'desc' },
                    take: 1
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!league) {
    throw new Error(`League ${leagueId} not found`);
  }

  // Find the from team
  const fromTeam = league.teams.find(team => team.id === fromTeamId);
  if (!fromTeam) {
    throw new Error(`Team ${fromTeamId} not found in league ${leagueId}`);
  }

  // Determine target teams
  let targetTeams = league.teams.filter(team => team.id !== fromTeamId);
  if (params.toTeamId) {
    targetTeams = targetTeams.filter(team => team.id === params.toTeamId);
    if (targetTeams.length === 0) {
      throw new Error(`Target team ${params.toTeamId} not found in league ${leagueId}`);
    }
  }

  // Prepare team data with valuations and weakness analysis
  const teamsData = await Promise.all([
    prepareTeamData(fromTeam, leagueId),
    ...targetTeams.map(team => prepareTeamData(team, leagueId))
  ]);

  const fromTeamData = teamsData[0];
  const targetTeamsData = teamsData.slice(1);

  // Generate candidate trades
  const allCandidates: any[] = [];
  
  for (const targetTeamData of targetTeamsData) {
    const candidates = await generateCandidateTrades(
      fromTeamData,
      targetTeamData,
      params.targets,
      params.sendables
    );
    allCandidates.push(...candidates);
  }

  console.log(`Generated ${allCandidates.length} candidate trades`);

  // Filter candidates based on mode
  const filteredCandidates = filterCandidates(allCandidates, mode);
  console.log(`Filtered to ${filteredCandidates.length} win-win candidates`);

  // Rank candidates
  const rankedCandidates = rankCandidates(filteredCandidates);

  // Convert top 3-5 to proposals
  const topCandidates = rankedCandidates.slice(0, 5);
  const proposals = topCandidates.map((candidate, index) => 
    convertToProposal(candidate, index + 1)
  );

  return {
    proposals,
    meta: {
      totalCandidates: allCandidates.length,
      filteredCandidates: filteredCandidates.length,
      mode,
      fromTeamId,
      targetTeamIds: targetTeamsData.map(team => team.id)
    }
  };
}

/**
 * Prepare team data with valuations and weakness analysis
 */
async function prepareTeamData(team: any, leagueId: string): Promise<TeamData> {
  // Get player valuations
  const players: PlayerData[] = team.RosterSlot.map((slot: any) => {
    const player = slot.player;
    const valuation = player.Valuation[0];
    
    return {
      id: player.id,
      name: player.name,
      pos: player.posPrimary,
      value: valuation?.price || 0,
      teamId: team.id
    };
  });

  // Calculate total team value
  const totalValue = players.reduce((sum, player) => sum + player.value, 0);

  // Get team weakness analysis
  const weakness = await calculateTeamWeakness(leagueId, team.id);
  
  // Convert weakness items to position map
  const needsByPos = weakness.items.reduce((acc, item) => {
    acc[item.pos] = item.deficitPts;
    return acc;
  }, {} as Record<string, number>);

  return {
    id: team.id,
    name: team.name,
    players,
    totalValue,
    needScore: weakness.needScore,
    needsByPos
  };
}

/**
 * Generate candidate trades between two teams
 */
async function generateCandidateTrades(
  fromTeam: TeamData,
  toTeam: TeamData,
  targets?: string[],
  sendables?: string[]
): Promise<any[]> {
  const candidates: any[] = [];

  // Filter available players
  const availableSendables = fromTeam.players.filter(player => 
    !sendables || sendables.includes(player.id)
  );
  
  const availableTargets = toTeam.players.filter(player =>
    !targets || targets.includes(player.id)
  );

  // Generate 1:1 trades
  for (const sendable of availableSendables) {
    for (const target of availableTargets) {
      // Skip if same position and similar value (not interesting)
      if (sendable.pos === target.pos && Math.abs(sendable.value - target.value) < 2) {
        continue;
      }

      candidates.push({
        fromTeam: fromTeam.id,
        toTeam: toTeam.id,
        give: [sendable],
        get: [target],
        type: '1:1'
      });
    }
  }

  // Generate 2:1 trades (give 2, get 1)
  for (let i = 0; i < availableSendables.length; i++) {
    for (let j = i + 1; j < availableSendables.length; j++) {
      const sendable1 = availableSendables[i];
      const sendable2 = availableSendables[j];
      const totalValue = sendable1.value + sendable2.value;

      for (const target of availableTargets) {
        // Only consider if the target is significantly more valuable
        if (target.value < totalValue * 0.8) continue;

        candidates.push({
          fromTeam: fromTeam.id,
          toTeam: toTeam.id,
          give: [sendable1, sendable2],
          get: [target],
          type: '2:1'
        });
      }
    }
  }

  // Generate 1:2 trades (give 1, get 2)
  for (const sendable of availableSendables) {
    for (let i = 0; i < availableTargets.length; i++) {
      for (let j = i + 1; j < availableTargets.length; j++) {
        const target1 = availableTargets[i];
        const target2 = availableTargets[j];
        const totalValue = target1.value + target2.value;

        // Only consider if sendable is significantly more valuable
        if (sendable.value < totalValue * 0.8) continue;

        candidates.push({
          fromTeam: fromTeam.id,
          toTeam: toTeam.id,
          give: [sendable],
          get: [target1, target2],
          type: '1:2'
        });
      }
    }
  }

  return candidates;
}

/**
 * Filter candidates based on win-win criteria
 */
function filterCandidates(candidates: any[], mode: 'balanced' | 'strict'): any[] {
  return candidates.filter(candidate => {
    // Calculate value deltas
    const giveValue = candidate.give.reduce((sum: number, player: any) => sum + player.value, 0);
    const getValue = candidate.get.reduce((sum: number, player: any) => sum + player.value, 0);
    
    const fromValueDelta = getValue - giveValue; // Positive = getting more value
    const toValueDelta = giveValue - getValue;   // Positive = getting more value

    if (mode === 'strict') {
      // Both teams must gain value
      return fromValueDelta > 0 && toValueDelta > 0;
    } else {
      // Balanced mode: allow small value loss (3% of team value)
      const fromTeamValue = 200; // TODO: Calculate actual team value
      const toTeamValue = 200;   // TODO: Calculate actual team value
      
      const fromThreshold = -0.03 * fromTeamValue;
      const toThreshold = -0.03 * toTeamValue;
      
      return fromValueDelta >= fromThreshold && toValueDelta >= toThreshold;
    }
  });
}

/**
 * Rank candidates by need improvement
 */
function rankCandidates(candidates: any[]): any[] {
  return candidates.sort((a, b) => {
    // TODO: Calculate actual need improvement
    // For now, rank by value balance
    const aBalance = Math.abs(
      a.give.reduce((sum: number, p: any) => sum + p.value, 0) -
      a.get.reduce((sum: number, p: any) => sum + p.value, 0)
    );
    
    const bBalance = Math.abs(
      b.give.reduce((sum: number, p: any) => sum + p.value, 0) -
      b.get.reduce((sum: number, p: any) => sum + p.value, 0)
    );
    
    return aBalance - bBalance; // Prefer more balanced trades
  });
}

/**
 * Convert candidate to trade proposal format
 */
function convertToProposal(candidate: any, index: number): TradeProposal {
  const giveItems: TradeItem[] = candidate.give.map((player: any) => ({
    playerId: player.id,
    playerName: player.name,
    position: player.pos,
    value: player.value
  }));

  const getItems: TradeItem[] = candidate.get.map((player: any) => ({
    playerId: player.id,
    playerName: player.name,
    position: player.pos,
    value: player.value
  }));

  const giveValue = giveItems.reduce((sum, item) => sum + item.value, 0);
  const getValue = getItems.reduce((sum, item) => sum + item.value, 0);

  const fromValueDelta = getValue - giveValue;
  const toValueDelta = giveValue - getValue;

  // Generate rationale
  const rationale = generateRationale(candidate, fromValueDelta, toValueDelta);

  return {
    proposalId: `temp-${index}`,
    give: giveItems,
    get: getItems,
    valueDelta: {
      you: Math.round(fromValueDelta * 100) / 100,
      them: Math.round(toValueDelta * 100) / 100
    },
    needDelta: {
      you: {
        byPos: {}, // TODO: Calculate position-specific need changes
        before: 0, // TODO: Calculate actual need scores
        after: 0
      },
      them: {
        byPos: {},
        before: 0,
        after: 0
      }
    },
    rationale
  };
}

/**
 * Generate human-readable rationale for trade
 */
function generateRationale(candidate: any, fromDelta: number, toDelta: number): string {
  const giveNames = candidate.give.map((p: any) => p.name).join(' + ');
  const getNames = candidate.get.map((p: any) => p.name).join(' + ');
  
  let rationale = `Trade ${giveNames} for ${getNames}. `;
  
  if (fromDelta > 5) {
    rationale += `You gain significant value (+$${fromDelta.toFixed(1)}). `;
  } else if (fromDelta > 0) {
    rationale += `You gain slight value (+$${fromDelta.toFixed(1)}). `;
  } else if (fromDelta > -3) {
    rationale += `Balanced value trade. `;
  } else {
    rationale += `You give up some value for positional need. `;
  }

  // Add positional reasoning
  const givePositions = candidate.give.map((p: any) => p.pos);
  const getPositions = candidate.get.map((p: any) => p.pos);
  
  if (givePositions.length === 1 && getPositions.length === 1) {
    if (givePositions[0] !== getPositions[0]) {
      rationale += `Addresses positional needs by trading ${givePositions[0]} depth for ${getPositions[0]} upgrade.`;
    } else {
      rationale += `Upgrades your ${getPositions[0]} position.`;
    }
  } else {
    rationale += `Multi-player deal to rebalance roster composition.`;
  }

  return rationale;
}