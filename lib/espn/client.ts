import Client from 'espn-fantasy-football-api/node';
import type { 
  EspnLeague, 
  EspnTeam, 
  EspnPlayer, 
  EspnBoxscore, 
  EspnDraftPlayer, 
  EspnFreeAgent,
  ESPN_POSITION_MAP,
  ESPN_TEAM_MAP
} from './types';

export interface EspnCookies {
  espnS2: string;
  SWID: string;
}

export interface FetchLeagueInfoArgs {
  leagueId: number;
  seasonId: number;
  cookies?: EspnCookies;
}

export interface FetchTeamsAtWeekArgs {
  leagueId: number;
  seasonId: number;
  week: number;
  cookies?: EspnCookies;
}

export interface FetchBoxscoresArgs {
  leagueId: number;
  seasonId: number;
  week: number;
  cookies?: EspnCookies;
}

export interface FetchDraftInfoArgs {
  leagueId: number;
  seasonId: number;
  cookies?: EspnCookies;
}

export interface FetchFreeAgentsArgs {
  leagueId: number;
  seasonId: number;
  week: number;
  cookies?: EspnCookies;
}

/**
 * Creates an ESPN Fantasy Football API client instance
 */
export function getClient(leagueId: number, cookies?: EspnCookies): any {
  const client = new Client({ leagueId });
  if (cookies) {
    client.setCookies(cookies);
  }
  return client;
}

/**
 * Fetches league information including settings and metadata
 */
export async function fetchLeagueInfo(args: FetchLeagueInfoArgs): Promise<EspnLeague> {
  const client = getClient(args.leagueId, args.cookies);
  
  try {
    const league = await client.getLeagueInfo({ seasonId: args.seasonId });
    
    return {
      id: league.id,
      seasonId: league.seasonId,
      currentScoringPeriod: league.currentScoringPeriod || 1,
      settings: {
        name: league.settings?.name || `League ${args.leagueId}`,
        scoringSettings: {
          scoringItems: league.settings?.scoringSettings?.scoringItems || []
        },
        rosterSettings: {
          lineupSlotCounts: league.settings?.rosterSettings?.lineupSlotCounts || {}
        },
        acquisitionSettings: {
          acquisitionBudget: league.settings?.acquisitionSettings?.acquisitionBudget || 200
        }
      }
    };
  } catch (error) {
    throw new Error(`Failed to fetch league info for league ${args.leagueId}: ${error}`);
  }
}

/**
 * Fetches teams and their rosters for a specific week
 */
export async function fetchTeamsAtWeek(args: FetchTeamsAtWeekArgs): Promise<EspnTeam[]> {
  const client = getClient(args.leagueId, args.cookies);
  
  try {
    const teams = await client.getTeamsAtWeek({ 
      seasonId: args.seasonId,
      scoringPeriodId: args.week 
    });
    
    return teams.map((team: any): EspnTeam => ({
      id: team.id,
      name: team.name || `Team ${team.id}`,
      abbrev: team.abbrev || `T${team.id}`,
      owners: team.owners?.map((owner: any) => ({
        id: owner.id,
        displayName: owner.displayName || 'Unknown Owner'
      })) || [],
      roster: {
        entries: team.roster?.entries?.map((entry: any) => ({
          playerId: entry.playerId,
          lineupSlotId: entry.lineupSlotId,
          playerPoolEntry: {
            player: mapEspnPlayer(entry.playerPoolEntry?.player)
          }
        })) || []
      }
    }));
  } catch (error) {
    throw new Error(`Failed to fetch teams at week ${args.week} for league ${args.leagueId}: ${error}`);
  }
}

/**
 * Fetches boxscores (game results) for a specific week
 */
export async function fetchBoxscores(args: FetchBoxscoresArgs): Promise<EspnBoxscore[]> {
  const client = getClient(args.leagueId, args.cookies);
  
  try {
    const boxscores = await client.getBoxscoreForWeek({
      seasonId: args.seasonId,
      matchupPeriodId: args.week,
      scoringPeriodId: args.week
    });
    
    return boxscores.map((boxscore: any): EspnBoxscore => ({
      matchupPeriodId: boxscore.matchupPeriodId || args.week,
      teams: boxscore.teams?.map((team: any) => ({
        teamId: team.teamId,
        totalPoints: team.totalPoints || 0,
        roster: {
          entries: team.roster?.entries?.map((entry: any) => ({
            playerId: entry.playerId,
            lineupSlotId: entry.lineupSlotId,
            playerPoolEntry: {
              player: mapEspnPlayer(entry.playerPoolEntry?.player)
            }
          })) || []
        }
      })) || []
    }));
  } catch (error) {
    throw new Error(`Failed to fetch boxscores for week ${args.week} in league ${args.leagueId}: ${error}`);
  }
}

/**
 * Fetches draft information including auction prices
 */
export async function fetchDraftInfo(args: FetchDraftInfoArgs): Promise<EspnDraftPlayer[]> {
  const client = getClient(args.leagueId, args.cookies);
  
  try {
    const draftInfo = await client.getDraftInfo({ seasonId: args.seasonId });
    
    return (draftInfo.picks || []).map((pick: any): EspnDraftPlayer => ({
      id: pick.playerId,
      fullName: pick.playerName || 'Unknown Player',
      bidAmount: pick.bidAmount,
      nominatingTeamId: pick.nominatingTeamId,
      overallDraftPosition: pick.overallDraftPosition
    }));
  } catch (error) {
    throw new Error(`Failed to fetch draft info for league ${args.leagueId}: ${error}`);
  }
}

/**
 * Fetches free agents available for pickup
 */
export async function fetchFreeAgents(args: FetchFreeAgentsArgs): Promise<EspnFreeAgent[]> {
  const client = getClient(args.leagueId, args.cookies);
  
  try {
    const freeAgents = await client.getFreeAgents({
      seasonId: args.seasonId,
      scoringPeriodId: args.week
    });
    
    return freeAgents.map((agent: any): EspnFreeAgent => ({
      id: agent.id,
      player: mapEspnPlayer(agent.player),
      status: agent.status || 'FREEAGENT'
    }));
  } catch (error) {
    throw new Error(`Failed to fetch free agents for week ${args.week} in league ${args.leagueId}: ${error}`);
  }
}

/**
 * Maps ESPN player data to our normalized format
 */
function mapEspnPlayer(espnPlayer: any): EspnPlayer {
  if (!espnPlayer) {
    return {
      id: 0,
      fullName: 'Unknown Player',
      defaultPositionId: 0,
      eligibleSlots: [],
      proTeamId: 0
    };
  }

  return {
    id: espnPlayer.id,
    fullName: espnPlayer.fullName || 'Unknown Player',
    defaultPositionId: espnPlayer.defaultPositionId || 0,
    eligibleSlots: espnPlayer.eligibleSlots || [],
    proTeamId: espnPlayer.proTeamId || 0,
    stats: espnPlayer.stats?.map((stat: any) => ({
      seasonId: stat.seasonId,
      statSourceId: stat.statSourceId,
      statSplitTypeId: stat.statSplitTypeId,
      stats: stat.stats || {}
    })) || []
  };
}