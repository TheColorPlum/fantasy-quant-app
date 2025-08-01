// Fantasy platform integrations
export interface FantasyLeague {
  id: string
  name: string
  size: number
  scoringType: string
  teams: FantasyTeam[]
}

export interface FantasyTeam {
  id: string
  name: string
  owner: string
  roster: FantasyPlayer[]
}

export interface FantasyPlayer {
  id: string
  name: string
  position: string
  nflTeam: string
  isOwned: boolean
  fantasyTeam?: string
}

export class ESPNClient {
  private baseUrl = "https://fantasy.espn.com/apis/v3/games/ffl"

  async getLeague(leagueId: string, credentials?: { swid: string; espnS2: string }): Promise<FantasyLeague> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (credentials) {
      headers["Cookie"] = `SWID=${credentials.swid}; espn_s2=${credentials.espnS2};`
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/seasons/2024/segments/0/leagues/${leagueId}?view=mTeam&view=mRoster`,
        { headers },
      )

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status}`)
      }

      const data = await response.json()

      return {
        id: leagueId,
        name: data.settings.name,
        size: data.settings.size,
        scoringType: data.settings.scoringSettings.scoringType === 0 ? "Standard" : "PPR",
        teams: data.teams.map((team: any) => ({
          id: team.id.toString(),
          name: team.location + " " + team.nickname,
          owner: team.primaryOwner,
          roster:
            team.roster?.entries?.map((entry: any) => ({
              id: entry.playerId.toString(),
              name: entry.playerPoolEntry.player.fullName,
              position: this.mapESPNPosition(entry.playerPoolEntry.player.defaultPositionId),
              nflTeam: this.mapESPNTeam(entry.playerPoolEntry.player.proTeamId),
              isOwned: true,
              fantasyTeam: team.location + " " + team.nickname,
            })) || [],
        })),
      }
    } catch (error) {
      console.error("ESPN API error:", error)
      throw new Error("Failed to fetch ESPN league data")
    }
  }

  private mapESPNPosition(positionId: number): string {
    const positions: Record<number, string> = {
      1: "QB",
      2: "RB",
      3: "WR",
      4: "TE",
      5: "K",
      16: "DST",
    }
    return positions[positionId] || "UNKNOWN"
  }

  private mapESPNTeam(teamId: number): string {
    // Simplified team mapping - in production, use complete mapping
    const teams: Record<number, string> = {
      1: "ATL",
      2: "BUF",
      3: "CHI",
      4: "CIN",
      5: "CLE",
      6: "DAL",
      7: "DEN",
      8: "DET",
      9: "GB",
      10: "TEN",
      11: "IND",
      12: "KC",
      13: "LV",
      14: "LAR",
      15: "MIA",
      16: "MIN",
      17: "NE",
      18: "NO",
      19: "NYG",
      20: "NYJ",
      21: "PHI",
      22: "ARI",
      23: "PIT",
      24: "LAC",
      25: "SF",
      26: "SEA",
      27: "TB",
      28: "WAS",
      29: "CAR",
      30: "JAX",
      33: "BAL",
      34: "HOU",
    }
    return teams[teamId] || "FA"
  }
}

export class SleeperClient {
  private baseUrl = "https://api.sleeper.app/v1"

  async getLeague(leagueId: string): Promise<FantasyLeague> {
    try {
      const [leagueResponse, rostersResponse, usersResponse] = await Promise.all([
        fetch(`${this.baseUrl}/league/${leagueId}`),
        fetch(`${this.baseUrl}/league/${leagueId}/rosters`),
        fetch(`${this.baseUrl}/league/${leagueId}/users`),
      ])

      if (!leagueResponse.ok || !rostersResponse.ok || !usersResponse.ok) {
        throw new Error("Sleeper API error")
      }

      const [leagueData, rostersData, usersData] = await Promise.all([
        leagueResponse.json(),
        rostersResponse.json(),
        usersResponse.json(),
      ])

      const userMap = new Map(usersData.map((user: any) => [user.user_id, user.display_name]))

      return {
        id: leagueId,
        name: leagueData.name,
        size: leagueData.total_rosters,
        scoringType: leagueData.scoring_settings.rec ? "PPR" : "Standard",
        teams: rostersData.map((roster: any) => ({
          id: roster.roster_id.toString(),
          name: `Team ${roster.roster_id}`,
          owner: userMap.get(roster.owner_id) || "Unknown",
          roster: (roster.players || []).map((playerId: string) => ({
            id: playerId,
            name: `Player ${playerId}`, // Would need player name lookup
            position: "UNKNOWN", // Would need player position lookup
            nflTeam: "UNKNOWN", // Would need team lookup
            isOwned: true,
            fantasyTeam: `Team ${roster.roster_id}`,
          })),
        })),
      }
    } catch (error) {
      console.error("Sleeper API error:", error)
      throw new Error("Failed to fetch Sleeper league data")
    }
  }
}

export class YahooClient {
  // Yahoo requires OAuth2 - simplified implementation
  async getLeague(leagueId: string, accessToken: string): Promise<FantasyLeague> {
    // This would require proper OAuth2 implementation
    throw new Error("Yahoo integration requires OAuth2 setup")
  }
}

export function createPlatformClient(platform: string) {
  switch (platform) {
    case "espn":
      return new ESPNClient()
    case "sleeper":
      return new SleeperClient()
    case "yahoo":
      return new YahooClient()
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}
