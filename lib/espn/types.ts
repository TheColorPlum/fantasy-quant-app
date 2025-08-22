// TypeScript types for ESPN Fantasy Football API
// Subset of fields we consume from the mkreiser client

export interface EspnLeague {
  id: number;
  settings: {
    name: string;
    scoringSettings: {
      scoringItems: Array<{
        statId: number;
        points: number;
      }>;
    };
    rosterSettings: {
      lineupSlotCounts: Record<string, number>;
    };
    acquisitionSettings: {
      acquisitionBudget: number;
    };
  };
  seasonId: number;
  currentScoringPeriod: number;
}

export interface EspnTeam {
  id: number;
  name: string;
  abbrev: string;
  owners: Array<{
    id: string;
    displayName: string;
  }>;
  roster: {
    entries: Array<{
      playerId: number;
      lineupSlotId: number;
      playerPoolEntry: {
        player: EspnPlayer;
      };
    }>;
  };
}

export interface EspnPlayer {
  id: number;
  fullName: string;
  defaultPositionId: number;
  eligibleSlots: number[];
  proTeamId: number;
  stats?: Array<{
    seasonId: number;
    statSourceId: number;
    statSplitTypeId: number;
    stats: Record<string, number>;
  }>;
}

export interface EspnBoxscore {
  matchupPeriodId: number;
  teams: Array<{
    teamId: number;
    totalPoints: number;
    roster: {
      entries: Array<{
        playerId: number;
        lineupSlotId: number;
        playerPoolEntry: {
          player: EspnPlayer;
        };
      }>;
    };
  }>;
}

export interface EspnDraftPlayer {
  id: number;
  fullName: string;
  bidAmount?: number;
  nominatingTeamId?: number;
  overallDraftPosition?: number;
}

export interface EspnFreeAgent {
  id: number;
  player: EspnPlayer;
  status: string;
}

// Position mapping from ESPN position IDs to our position strings
export const ESPN_POSITION_MAP: Record<number, string> = {
  1: 'QB',
  2: 'RB',
  3: 'WR',
  4: 'TE',
  5: 'K',
  16: 'D/ST',
  17: 'LB',
  18: 'DL',
  19: 'DB',
  20: 'FLEX',
  21: 'IR',
  23: 'BENCH'
};

// Team abbreviations mapping from ESPN team IDs
export const ESPN_TEAM_MAP: Record<number, string> = {
  1: 'ATL', 2: 'BUF', 3: 'CHI', 4: 'CIN', 5: 'CLE', 6: 'DAL', 7: 'DEN', 8: 'DET',
  9: 'GB', 10: 'TEN', 11: 'IND', 12: 'KC', 13: 'LV', 14: 'LAR', 15: 'MIA', 16: 'MIN',
  17: 'NE', 18: 'NO', 19: 'NYG', 20: 'NYJ', 21: 'PHI', 22: 'ARI', 23: 'PIT', 24: 'LAC',
  25: 'SF', 26: 'SEA', 27: 'TB', 28: 'WAS', 29: 'CAR', 30: 'JAX', 33: 'BAL', 34: 'HOU'
};