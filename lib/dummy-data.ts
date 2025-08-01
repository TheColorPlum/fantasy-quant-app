export interface Player {
  id: string
  name: string
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST"
  team: string
  value: number
  trend: "up" | "down" | "stable"
  weeklyChange: number
}

export interface Team {
  id: string
  name: string
  owner: string
  players: Player[]
}

export interface TradeProposal {
  id: string
  tradePartner: string
  tradeType: "Fair Value" | "Buy Low/Sell High" | "Underpriced"
  userGives: Player[]
  userGets: Player[]
  valueDifferential: number
  score: number
  reasoning: string
}

export const mockPlayers: Player[] = [
  // QBs
  { id: "1", name: "Josh Allen", position: "QB", team: "BUF", value: 28.5, trend: "stable", weeklyChange: 0.2 },
  { id: "2", name: "Lamar Jackson", position: "QB", team: "BAL", value: 27.8, trend: "up", weeklyChange: 1.5 },
  { id: "3", name: "Jalen Hurts", position: "QB", team: "PHI", value: 26.9, trend: "down", weeklyChange: -0.8 },
  { id: "4", name: "Patrick Mahomes", position: "QB", team: "KC", value: 26.2, trend: "stable", weeklyChange: 0.1 },
  { id: "5", name: "Dak Prescott", position: "QB", team: "DAL", value: 22.1, trend: "up", weeklyChange: 2.1 },
  { id: "6", name: "Tua Tagovailoa", position: "QB", team: "MIA", value: 19.8, trend: "stable", weeklyChange: -0.3 },

  // RBs
  { id: "7", name: "Christian McCaffrey", position: "RB", team: "SF", value: 52.1, trend: "stable", weeklyChange: 0.5 },
  { id: "8", name: "Austin Ekeler", position: "RB", team: "LAC", value: 45.3, trend: "down", weeklyChange: -1.2 },
  { id: "9", name: "Derrick Henry", position: "RB", team: "TEN", value: 42.8, trend: "up", weeklyChange: 2.3 },
  { id: "10", name: "Nick Chubb", position: "RB", team: "CLE", value: 41.9, trend: "stable", weeklyChange: 0.1 },
  { id: "11", name: "Saquon Barkley", position: "RB", team: "NYG", value: 40.2, trend: "up", weeklyChange: 1.8 },
  { id: "12", name: "Tony Pollard", position: "RB", team: "DAL", value: 35.6, trend: "down", weeklyChange: -0.9 },
  { id: "13", name: "Josh Jacobs", position: "RB", team: "LV", value: 34.1, trend: "stable", weeklyChange: 0.3 },
  { id: "14", name: "Kenneth Walker III", position: "RB", team: "SEA", value: 32.8, trend: "up", weeklyChange: 1.4 },

  // WRs
  { id: "15", name: "Justin Jefferson", position: "WR", team: "MIN", value: 48.9, trend: "stable", weeklyChange: 0.2 },
  { id: "16", name: "Cooper Kupp", position: "WR", team: "LAR", value: 46.7, trend: "down", weeklyChange: -1.1 },
  { id: "17", name: "Stefon Diggs", position: "WR", team: "BUF", value: 42.1, trend: "stable", weeklyChange: 0.4 },
  { id: "18", name: "Davante Adams", position: "WR", team: "LV", value: 41.3, trend: "up", weeklyChange: 1.6 },
  { id: "19", name: "Tyreek Hill", position: "WR", team: "MIA", value: 40.8, trend: "stable", weeklyChange: -0.2 },
  { id: "20", name: "A.J. Brown", position: "WR", team: "PHI", value: 38.9, trend: "up", weeklyChange: 2.1 },
  { id: "21", name: "CeeDee Lamb", position: "WR", team: "DAL", value: 37.2, trend: "stable", weeklyChange: 0.6 },
  { id: "22", name: "Mike Evans", position: "WR", team: "TB", value: 35.4, trend: "down", weeklyChange: -0.7 },

  // TEs
  { id: "23", name: "Travis Kelce", position: "TE", team: "KC", value: 32.1, trend: "stable", weeklyChange: 0.1 },
  { id: "24", name: "Mark Andrews", position: "TE", team: "BAL", value: 28.9, trend: "down", weeklyChange: -1.3 },
  { id: "25", name: "T.J. Hockenson", position: "TE", team: "MIN", value: 24.6, trend: "up", weeklyChange: 1.9 },
  { id: "26", name: "George Kittle", position: "TE", team: "SF", value: 23.8, trend: "stable", weeklyChange: 0.3 },
]

export const mockTeams: Team[] = [
  {
    id: "1",
    name: "The Gronk Squad",
    owner: "Mike Johnson",
    players: [
      mockPlayers.find((p) => p.name === "Josh Allen")!,
      mockPlayers.find((p) => p.name === "Christian McCaffrey")!,
      mockPlayers.find((p) => p.name === "Austin Ekeler")!,
      mockPlayers.find((p) => p.name === "Justin Jefferson")!,
      mockPlayers.find((p) => p.name === "Stefon Diggs")!,
      mockPlayers.find((p) => p.name === "Travis Kelce")!,
    ],
  },
  {
    id: "2",
    name: "Fantasy Footballers",
    owner: "Sarah Chen",
    players: [
      mockPlayers.find((p) => p.name === "Lamar Jackson")!,
      mockPlayers.find((p) => p.name === "Derrick Henry")!,
      mockPlayers.find((p) => p.name === "Tony Pollard")!,
      mockPlayers.find((p) => p.name === "Cooper Kupp")!,
      mockPlayers.find((p) => p.name === "Davante Adams")!,
      mockPlayers.find((p) => p.name === "Mark Andrews")!,
    ],
  },
  {
    id: "3",
    name: "Touchdown Machines",
    owner: "Alex Rodriguez",
    players: [
      mockPlayers.find((p) => p.name === "Jalen Hurts")!,
      mockPlayers.find((p) => p.name === "Nick Chubb")!,
      mockPlayers.find((p) => p.name === "Josh Jacobs")!,
      mockPlayers.find((p) => p.name === "Tyreek Hill")!,
      mockPlayers.find((p) => p.name === "A.J. Brown")!,
      mockPlayers.find((p) => p.name === "T.J. Hockenson")!,
    ],
  },
  // Add more teams...
]

export const mockTradeProposals: TradeProposal[] = [
  {
    id: "1",
    tradePartner: "Fantasy Footballers",
    tradeType: "Buy Low/Sell High",
    userGives: [mockPlayers.find((p) => p.name === "Austin Ekeler")!],
    userGets: [mockPlayers.find((p) => p.name === "A.J. Brown")!],
    valueDifferential: -3.6,
    score: 92,
    reasoning:
      "Great buy-low opportunity on A.J. Brown who's trending up (+2.1 weekly) while Ekeler is declining (-1.2). You're giving up RB depth but significantly upgrading your WR2 position. Sarah's team is RB-needy and has WR surplus.",
  },
  {
    id: "2",
    tradePartner: "Touchdown Machines",
    tradeType: "Fair Value",
    userGives: [mockPlayers.find((p) => p.name === "Stefon Diggs")!],
    userGets: [mockPlayers.find((p) => p.name === "Nick Chubb")!],
    valueDifferential: 0.2,
    score: 88,
    reasoning:
      "Nearly even value swap that addresses both teams' needs. You get a stable RB1 to pair with CMC, while Alex gets WR depth. Chubb's consistent floor makes this a safe trade with minimal risk.",
  },
  {
    id: "3",
    tradePartner: "Fantasy Footballers",
    tradeType: "Underpriced",
    userGives: [mockPlayers.find((p) => p.name === "Travis Kelce")!],
    userGets: [
      mockPlayers.find((p) => p.name === "Derrick Henry")!,
      mockPlayers.find((p) => p.name === "Mark Andrews")!,
    ],
    valueDifferential: 10.6,
    score: 85,
    reasoning:
      "You're getting significant value here - Henry + Andrews (71.7 total) for Kelce (32.1). Henry is trending up strongly (+2.3) and you still get a top-3 TE in Andrews. This gives you elite RB depth.",
  },
]

export const mockUser = {
  id: "1",
  email: "user@example.com",
  teamId: "1",
  leagueId: "ESPN123456",
  usageCount: 2,
  usageLimit: 5,
  isPremium: false,
}

export const mockLeagueData = {
  leagueInfo: {
    name: "Championship Dreams",
    season: "2024",
    scoring: "PPR",
    size: 12,
  },
  teams: [
    {
      name: "TEAM_MAHOMES",
      owner: "Mike Johnson",
      rank: 1,
      record: "8-3",
      totalValue: 847.5,
      roster: [
        { name: "Patrick Mahomes", position: "QB", team: "KC", value: 28.5, weeklyTrend: 2.1, projectedPoints: 24.8 },
        {
          name: "Christian McCaffrey",
          position: "RB",
          team: "SF",
          value: 52.1,
          weeklyTrend: 0.5,
          projectedPoints: 22.3,
        },
        { name: "Austin Ekeler", position: "RB", team: "LAC", value: 45.3, weeklyTrend: -1.2, projectedPoints: 18.7 },
        { name: "Justin Jefferson", position: "WR", team: "MIN", value: 48.9, weeklyTrend: 0.2, projectedPoints: 19.4 },
        { name: "Stefon Diggs", position: "WR", team: "BUF", value: 42.1, weeklyTrend: 0.4, projectedPoints: 17.2 },
        { name: "Travis Kelce", position: "TE", team: "KC", value: 32.1, weeklyTrend: 0.1, projectedPoints: 14.6 },
      ],
    },
    {
      name: "TEAM_ALLEN",
      owner: "Sarah Chen",
      rank: 2,
      record: "7-4",
      totalValue: 823.2,
      roster: [
        { name: "Josh Allen", position: "QB", team: "BUF", value: 28.5, weeklyTrend: 0.2, projectedPoints: 25.1 },
        { name: "Derrick Henry", position: "RB", team: "TEN", value: 42.8, weeklyTrend: 2.3, projectedPoints: 19.8 },
        { name: "Tony Pollard", position: "RB", team: "DAL", value: 35.6, weeklyTrend: -0.9, projectedPoints: 16.4 },
        { name: "Cooper Kupp", position: "WR", team: "LAR", value: 46.7, weeklyTrend: -1.1, projectedPoints: 18.9 },
        { name: "Davante Adams", position: "WR", team: "LV", value: 41.3, weeklyTrend: 1.6, projectedPoints: 17.8 },
        { name: "Mark Andrews", position: "TE", team: "BAL", value: 28.9, weeklyTrend: -1.3, projectedPoints: 13.2 },
      ],
    },
    {
      name: "TEAM_BURROW",
      owner: "Alex Rodriguez",
      rank: 3,
      record: "7-4",
      totalValue: 798.4,
      roster: [
        { name: "Joe Burrow", position: "QB", team: "CIN", value: 26.2, weeklyTrend: 1.8, projectedPoints: 23.4 },
        { name: "Nick Chubb", position: "RB", team: "CLE", value: 41.9, weeklyTrend: 0.1, projectedPoints: 18.6 },
        { name: "Josh Jacobs", position: "RB", team: "LV", value: 34.1, weeklyTrend: 0.3, projectedPoints: 16.9 },
        { name: "Tyreek Hill", position: "WR", team: "MIA", value: 40.8, weeklyTrend: -0.2, projectedPoints: 18.1 },
        { name: "A.J. Brown", position: "WR", team: "PHI", value: 38.9, weeklyTrend: 2.1, projectedPoints: 17.5 },
        { name: "T.J. Hockenson", position: "TE", team: "MIN", value: 24.6, weeklyTrend: 1.9, projectedPoints: 12.8 },
      ],
    },
    {
      name: "TEAM_HERBERT",
      owner: "Emma Wilson",
      rank: 4,
      record: "6-5",
      totalValue: 756.8,
      roster: [
        { name: "Justin Herbert", position: "QB", team: "LAC", value: 24.8, weeklyTrend: -0.5, projectedPoints: 22.1 },
        { name: "Saquon Barkley", position: "RB", team: "NYG", value: 40.2, weeklyTrend: 1.8, projectedPoints: 17.9 },
        {
          name: "Kenneth Walker III",
          position: "RB",
          team: "SEA",
          value: 32.8,
          weeklyTrend: 1.4,
          projectedPoints: 15.7,
        },
        { name: "CeeDee Lamb", position: "WR", team: "DAL", value: 37.2, weeklyTrend: 0.6, projectedPoints: 16.8 },
        { name: "Mike Evans", position: "WR", team: "TB", value: 35.4, weeklyTrend: -0.7, projectedPoints: 16.2 },
        { name: "George Kittle", position: "TE", team: "SF", value: 23.8, weeklyTrend: 0.3, projectedPoints: 12.4 },
      ],
    },
    {
      name: "TEAM_JACKSON",
      owner: "David Kim",
      rank: 5,
      record: "6-5",
      totalValue: 734.6,
      roster: [
        { name: "Lamar Jackson", position: "QB", team: "BAL", value: 27.8, weeklyTrend: 1.5, projectedPoints: 24.2 },
        { name: "Alvin Kamara", position: "RB", team: "NO", value: 38.4, weeklyTrend: -0.8, projectedPoints: 16.8 },
        { name: "Najee Harris", position: "RB", team: "PIT", value: 29.7, weeklyTrend: 0.9, projectedPoints: 14.3 },
        { name: "Ja'Marr Chase", position: "WR", team: "CIN", value: 44.2, weeklyTrend: 2.4, projectedPoints: 18.6 },
        { name: "DK Metcalf", position: "WR", team: "SEA", value: 31.8, weeklyTrend: -1.1, projectedPoints: 15.4 },
        { name: "Kyle Pitts", position: "TE", team: "ATL", value: 22.1, weeklyTrend: 1.2, projectedPoints: 11.9 },
      ],
    },
    {
      name: "TEAM_HURTS",
      owner: "Lisa Park",
      rank: 6,
      record: "5-6",
      totalValue: 712.3,
      roster: [
        { name: "Jalen Hurts", position: "QB", team: "PHI", value: 26.9, weeklyTrend: -0.8, projectedPoints: 23.7 },
        { name: "Joe Mixon", position: "RB", team: "CIN", value: 33.6, weeklyTrend: 0.7, projectedPoints: 15.9 },
        { name: "Breece Hall", position: "RB", team: "NYJ", value: 31.2, weeklyTrend: 2.8, projectedPoints: 15.1 },
        {
          name: "Amon-Ra St. Brown",
          position: "WR",
          team: "DET",
          value: 36.8,
          weeklyTrend: 1.3,
          projectedPoints: 16.5,
        },
        { name: "DeAndre Hopkins", position: "WR", team: "TEN", value: 28.4, weeklyTrend: -2.1, projectedPoints: 14.2 },
        { name: "Dallas Goedert", position: "TE", team: "PHI", value: 19.8, weeklyTrend: 0.4, projectedPoints: 10.8 },
      ],
    },
  ],
}
