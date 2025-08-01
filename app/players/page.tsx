"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Terminal, TrendingUp, TrendingDown, Search } from "lucide-react"
import Link from "next/link"

interface Player {
  id: string
  name: string
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST"
  nflTeam: string
  fantasyTeam: string
  value: number
  weeklyTrend: number
  projectedPoints: number
  owned: boolean
}

const mockAllPlayers: Player[] = [
  // Owned Players
  {
    id: "1",
    name: "Josh Allen",
    position: "QB",
    nflTeam: "BUF",
    fantasyTeam: "TEAM_MAHOMES",
    value: 28.5,
    weeklyTrend: 0.2,
    projectedPoints: 24.8,
    owned: true,
  },
  {
    id: "2",
    name: "Christian McCaffrey",
    position: "RB",
    nflTeam: "SF",
    fantasyTeam: "TEAM_MAHOMES",
    value: 52.1,
    weeklyTrend: 0.5,
    projectedPoints: 22.3,
    owned: true,
  },
  {
    id: "3",
    name: "Justin Jefferson",
    position: "WR",
    nflTeam: "MIN",
    fantasyTeam: "TEAM_ALLEN",
    value: 48.9,
    weeklyTrend: 0.2,
    projectedPoints: 19.4,
    owned: true,
  },
  {
    id: "4",
    name: "Travis Kelce",
    position: "TE",
    nflTeam: "KC",
    fantasyTeam: "TEAM_BURROW",
    value: 32.1,
    weeklyTrend: 0.1,
    projectedPoints: 14.6,
    owned: true,
  },
  {
    id: "5",
    name: "Lamar Jackson",
    position: "QB",
    nflTeam: "BAL",
    fantasyTeam: "TEAM_JACKSON",
    value: 27.8,
    weeklyTrend: 1.5,
    projectedPoints: 24.2,
    owned: true,
  },
  {
    id: "6",
    name: "Derrick Henry",
    position: "RB",
    nflTeam: "TEN",
    fantasyTeam: "TEAM_ALLEN",
    value: 42.8,
    weeklyTrend: 2.3,
    projectedPoints: 19.8,
    owned: true,
  },
  {
    id: "7",
    name: "Cooper Kupp",
    position: "WR",
    nflTeam: "LAR",
    fantasyTeam: "TEAM_ALLEN",
    value: 46.7,
    weeklyTrend: -1.1,
    projectedPoints: 18.9,
    owned: true,
  },
  {
    id: "8",
    name: "Stefon Diggs",
    position: "WR",
    nflTeam: "BUF",
    fantasyTeam: "TEAM_MAHOMES",
    value: 42.1,
    weeklyTrend: 0.4,
    projectedPoints: 17.2,
    owned: true,
  },

  // Available Players (Waivers/Free Agents)
  {
    id: "9",
    name: "Gus Edwards",
    position: "RB",
    nflTeam: "BAL",
    fantasyTeam: "WAIVERS",
    value: 8.2,
    weeklyTrend: -2.1,
    projectedPoints: 6.4,
    owned: false,
  },
  {
    id: "10",
    name: "Deon Jackson",
    position: "RB",
    nflTeam: "IND",
    fantasyTeam: "WAIVERS",
    value: 4.1,
    weeklyTrend: 1.8,
    projectedPoints: 4.2,
    owned: false,
  },
  {
    id: "11",
    name: "Kendrick Bourne",
    position: "WR",
    nflTeam: "NE",
    fantasyTeam: "WAIVERS",
    value: 6.7,
    weeklyTrend: 0.9,
    projectedPoints: 5.8,
    owned: false,
  },
  {
    id: "12",
    name: "Tyler Higbee",
    position: "TE",
    nflTeam: "LAR",
    fantasyTeam: "WAIVERS",
    value: 5.3,
    weeklyTrend: -0.4,
    projectedPoints: 4.9,
    owned: false,
  },
  {
    id: "13",
    name: "Jameis Winston",
    position: "QB",
    nflTeam: "NO",
    fantasyTeam: "WAIVERS",
    value: 12.4,
    weeklyTrend: 2.7,
    projectedPoints: 16.8,
    owned: false,
  },
  {
    id: "14",
    name: "Chuba Hubbard",
    position: "RB",
    nflTeam: "CAR",
    fantasyTeam: "WAIVERS",
    value: 11.8,
    weeklyTrend: 3.2,
    projectedPoints: 8.9,
    owned: false,
  },
  {
    id: "15",
    name: "Darius Slayton",
    position: "WR",
    nflTeam: "NYG",
    fantasyTeam: "WAIVERS",
    value: 7.9,
    weeklyTrend: 1.4,
    projectedPoints: 6.7,
    owned: false,
  },
  {
    id: "16",
    name: "Hunter Henry",
    position: "TE",
    nflTeam: "NE",
    fantasyTeam: "WAIVERS",
    value: 9.2,
    weeklyTrend: 0.8,
    projectedPoints: 7.1,
    owned: false,
  },
]

export default function PlayersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState("ALL")
  const [ownershipFilter, setOwnershipFilter] = useState("ALL")
  const [sortBy, setSortBy] = useState("VALUE")

  const filteredPlayers = mockAllPlayers
    .filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPosition = positionFilter === "ALL" || player.position === positionFilter
      const matchesOwnership =
        ownershipFilter === "ALL" ||
        (ownershipFilter === "OWNED" && player.owned) ||
        (ownershipFilter === "AVAILABLE" && !player.owned)

      return matchesSearch && matchesPosition && matchesOwnership
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "VALUE":
          return b.value - a.value
        case "TREND":
          return b.weeklyTrend - a.weeklyTrend
        case "PROJECTED":
          return b.projectedPoints - a.projectedPoints
        case "NAME":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

  const getPositionColor = (position: string) => {
    switch (position) {
      case "QB":
        return "text-[#ef4444] border-[#ef4444]"
      case "RB":
        return "text-[#22c55e] border-[#22c55e]"
      case "WR":
        return "text-[#3b82f6] border-[#3b82f6]"
      case "TE":
        return "text-[#f59e0b] border-[#f59e0b]"
      case "K":
        return "text-[#94a3b8] border-[#94a3b8]"
      case "DST":
        return "text-[#8b5cf6] border-[#8b5cf6]"
      default:
        return "text-[#94a3b8] border-[#94a3b8]"
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Terminal className="h-6 w-6 text-[#22c55e]" />
                <span className="text-xl font-bold font-mono">TRADEUP</span>
              </Link>
              <Badge variant="outline" className="text-[#22c55e] border-[#22c55e] font-mono text-xs">
                PLAYER_DATABASE
              </Badge>
            </div>

            <div className="flex items-center space-x-6">
              <div className="font-mono text-sm text-[#cbd5e1]">
                SCANS_LEFT: <span className="text-[#f59e0b] font-semibold">3/5</span>
              </div>
              <Link href="/trade-generator">
                <Button className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold">
                  FIND_TRADES
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
                <Input
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]"
                />
              </div>

              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="ALL" className="font-mono text-[#cbd5e1]">
                    All Positions
                  </SelectItem>
                  <SelectItem value="QB" className="font-mono text-[#cbd5e1]">
                    QB
                  </SelectItem>
                  <SelectItem value="RB" className="font-mono text-[#cbd5e1]">
                    RB
                  </SelectItem>
                  <SelectItem value="WR" className="font-mono text-[#cbd5e1]">
                    WR
                  </SelectItem>
                  <SelectItem value="TE" className="font-mono text-[#cbd5e1]">
                    TE
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
                <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]">
                  <SelectValue placeholder="Ownership" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="ALL" className="font-mono text-[#cbd5e1]">
                    All Players
                  </SelectItem>
                  <SelectItem value="OWNED" className="font-mono text-[#cbd5e1]">
                    Owned
                  </SelectItem>
                  <SelectItem value="AVAILABLE" className="font-mono text-[#cbd5e1]">
                    Available
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="VALUE" className="font-mono text-[#cbd5e1]">
                    Value
                  </SelectItem>
                  <SelectItem value="TREND" className="font-mono text-[#cbd5e1]">
                    Trend
                  </SelectItem>
                  <SelectItem value="PROJECTED" className="font-mono text-[#cbd5e1]">
                    Projected
                  </SelectItem>
                  <SelectItem value="NAME" className="font-mono text-[#cbd5e1]">
                    Name
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="font-mono text-sm text-[#cbd5e1] flex items-center">
                SHOWING: <span className="text-[#22c55e] ml-1">{filteredPlayers.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="font-mono text-[#22c55e]">ALL_PLAYERS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className={`font-mono text-xs ${getPositionColor(player.position)}`}>
                      {player.position}
                    </Badge>
                    <div>
                      <div className="font-mono text-sm text-[#cbd5e1]">{player.name}</div>
                      <div className="font-mono text-xs text-[#94a3b8]">{player.nflTeam}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="font-mono text-xs text-[#94a3b8]">OWNED BY</div>
                      <div className={`font-mono text-sm ${player.owned ? "text-[#cbd5e1]" : "text-[#94a3b8]"}`}>
                        {player.fantasyTeam}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs text-[#94a3b8]">VALUE</div>
                      <div className="font-mono text-sm text-[#22c55e]">${player.value}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs text-[#94a3b8]">TREND</div>
                      <div
                        className={`font-mono text-sm flex items-center justify-end ${player.weeklyTrend >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                      >
                        {player.weeklyTrend >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {player.weeklyTrend > 0 ? "+" : ""}
                        {player.weeklyTrend}%
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs text-[#94a3b8]">PROJ_PTS</div>
                      <div className="font-mono text-sm text-[#cbd5e1]">{player.projectedPoints}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
