// Mock database - replace with real database in production
export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  isPremium: boolean
  scansLimit: number
  scansUsed: number
  createdAt: Date
  updatedAt: Date
}

export interface League {
  id: string
  userId: string
  platform: "espn" | "yahoo" | "sleeper"
  leagueId: string
  leagueName: string
  credentials?: {
    username?: string
    password?: string
    swid?: string
    espnS2?: string
  }
  isActive: boolean
  createdAt: Date
}

export interface Player {
  id: string
  name: string
  position: string
  nflTeam: string
  fantasyTeam?: string
  value: number
  trend: "up" | "down" | "stable"
  projectedPoints: number
  injuryStatus: "healthy" | "questionable" | "doubtful" | "out"
  byeWeek: number
}

export interface TradeAnalysis {
  id: string
  userId: string
  givingPlayers: string[]
  receivingPlayers: string[]
  confidence: number
  reasoning: string
  createdAt: Date
}

// Mock data storage
const mockUsers: User[] = [
  {
    id: "user_1",
    email: "demo@tradeup.com",
    name: "Demo User",
    passwordHash: "password123", // In production, this would be bcrypt hashed
    isPremium: false,
    scansLimit: 5,
    scansUsed: 2,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "user_2",
    email: "john@example.com",
    name: "John Smith",
    passwordHash: "hashed_password_here",
    isPremium: true,
    scansLimit: 999,
    scansUsed: 15,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
]

const mockLeagues: League[] = [
  {
    id: "league_1",
    userId: "user_1",
    platform: "espn",
    leagueId: "123456",
    leagueName: "The Championship",
    credentials: {
      swid: "mock_swid",
      espnS2: "mock_espn_s2",
    },
    isActive: true,
    createdAt: new Date("2024-01-01"),
  },
]

const mockPlayers: Player[] = [
  {
    id: "player_1",
    name: "Josh Allen",
    position: "QB",
    nflTeam: "BUF",
    fantasyTeam: "Team Alpha",
    value: 95,
    trend: "up",
    projectedPoints: 24.5,
    injuryStatus: "healthy",
    byeWeek: 12,
  },
  {
    id: "player_2",
    name: "Christian McCaffrey",
    position: "RB",
    nflTeam: "SF",
    fantasyTeam: "Team Beta",
    value: 98,
    trend: "stable",
    projectedPoints: 22.8,
    injuryStatus: "healthy",
    byeWeek: 9,
  },
  {
    id: "player_3",
    name: "Tyreek Hill",
    position: "WR",
    nflTeam: "MIA",
    value: 88,
    trend: "down",
    projectedPoints: 18.2,
    injuryStatus: "questionable",
    byeWeek: 6,
  },
  {
    id: "player_4",
    name: "Travis Kelce",
    position: "TE",
    nflTeam: "KC",
    fantasyTeam: "Team Gamma",
    value: 85,
    trend: "stable",
    projectedPoints: 15.7,
    injuryStatus: "healthy",
    byeWeek: 10,
  },
  {
    id: "player_5",
    name: "Cooper Kupp",
    position: "WR",
    nflTeam: "LAR",
    value: 82,
    trend: "up",
    projectedPoints: 17.3,
    injuryStatus: "healthy",
    byeWeek: 6,
  },
]

const mockTradeAnalyses: TradeAnalysis[] = [
  {
    id: "analysis_1",
    userId: "user_1",
    givingPlayers: ["player_1"],
    receivingPlayers: ["player_2", "player_3"],
    confidence: 78,
    reasoning: "Strong value differential favoring the receiver",
    createdAt: new Date("2024-01-20"),
  },
]

// Mock database operations
export const db = {
  users: {
    findById: async (id: string): Promise<User | null> => {
      return mockUsers.find((user) => user.id === id) || null
    },
    findByEmail: async (email: string): Promise<User | null> => {
      return mockUsers.find((user) => user.email === email) || null
    },
    create: async (userData: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> => {
      const newUser: User = {
        ...userData,
        id: `user_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      mockUsers.push(newUser)
      return newUser
    },
    update: async (id: string, updates: Partial<User>): Promise<User | null> => {
      const userIndex = mockUsers.findIndex((user) => user.id === id)
      if (userIndex === -1) return null

      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...updates,
        updatedAt: new Date(),
      }
      return mockUsers[userIndex]
    },
  },
  leagues: {
    findByUserId: async (userId: string): Promise<League[]> => {
      return mockLeagues.filter((league) => league.userId === userId)
    },
    create: async (leagueData: Omit<League, "id" | "createdAt">): Promise<League> => {
      const newLeague: League = {
        ...leagueData,
        id: `league_${Date.now()}`,
        createdAt: new Date(),
      }
      mockLeagues.push(newLeague)
      return newLeague
    },
  },
  players: {
    findAll: async (): Promise<Player[]> => {
      return mockPlayers
    },
    search: async (
      query: string,
      filters?: {
        position?: string
        ownership?: "owned" | "available"
      },
    ): Promise<Player[]> => {
      let results = mockPlayers

      if (query) {
        results = results.filter((player) => player.name.toLowerCase().includes(query.toLowerCase()))
      }

      if (filters?.position) {
        results = results.filter((player) => player.position === filters.position)
      }

      if (filters?.ownership === "owned") {
        results = results.filter((player) => player.fantasyTeam)
      } else if (filters?.ownership === "available") {
        results = results.filter((player) => !player.fantasyTeam)
      }

      return results
    },
  },
  tradeAnalyses: {
    findByUserId: async (userId: string): Promise<TradeAnalysis[]> => {
      return mockTradeAnalyses.filter((analysis) => analysis.userId === userId)
    },
    create: async (analysisData: Omit<TradeAnalysis, "id" | "createdAt">): Promise<TradeAnalysis> => {
      const newAnalysis: TradeAnalysis = {
        ...analysisData,
        id: `analysis_${Date.now()}`,
        createdAt: new Date(),
      }
      mockTradeAnalyses.push(newAnalysis)
      return newAnalysis
    },
  },
}
