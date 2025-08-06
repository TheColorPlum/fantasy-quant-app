"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { PlayerOverviewModal } from "@/components/player-overview-modal"

interface Player {
  id: string
  name: string
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST"
  nflTeam: string
  fantasyTeam: string
  value: number
  weeklyTrend: number
  projectedPoints: number
  seasonPoints: number
  currentWeekProjection: number
  owned: boolean
}

const mockAllPlayers: Player[] = [
  // Waiver Wire Players (Default Filter)
  {
    id: "9",
    name: "Gus Edwards",
    position: "RB",
    nflTeam: "BAL",
    fantasyTeam: "WAIVERS",
    value: 8.2,
    weeklyTrend: -2.1,
    projectedPoints: 6.4,
    seasonPoints: 89.3,
    currentWeekProjection: 8.1,
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
    seasonPoints: 45.7,
    currentWeekProjection: 5.3,
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
    seasonPoints: 67.2,
    currentWeekProjection: 7.4,
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
    seasonPoints: 52.8,
    currentWeekProjection: 6.1,
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
    seasonPoints: 134.5,
    currentWeekProjection: 18.2,
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
    seasonPoints: 98.4,
    currentWeekProjection: 11.7,
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
    seasonPoints: 73.1,
    currentWeekProjection: 8.3,
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
    seasonPoints: 81.6,
    currentWeekProjection: 9.4,
    owned: false,
  },

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
    seasonPoints: 287.3,
    currentWeekProjection: 26.1,
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
    seasonPoints: 245.7,
    currentWeekProjection: 24.8,
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
    seasonPoints: 213.8,
    currentWeekProjection: 21.2,
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
    seasonPoints: 167.4,
    currentWeekProjection: 16.3,
    owned: true,
  },
]

export default function PlayersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState("ALL")
  const [teamFilter, setTeamFilter] = useState("ALL")
  const [ownershipFilter, setOwnershipFilter] = useState("AVAILABLE") // Default to waiver wire
  const [sortBy, setSortBy] = useState("VALUE")
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const filteredPlayers = mockAllPlayers
    .filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesPosition = positionFilter === "ALL" || player.position === positionFilter
      const matchesTeam = teamFilter === "ALL" || player.nflTeam === teamFilter
      const matchesOwnership =
        ownershipFilter === "ALL" ||
        (ownershipFilter === "OWNED" && player.owned) ||
        (ownershipFilter === "AVAILABLE" && !player.owned)

      return matchesSearch && matchesPosition && matchesTeam && matchesOwnership
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

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]">
                  <SelectValue placeholder="NFL Team" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="ALL" className="font-mono text-[#cbd5e1]">
                    All Teams
                  </SelectItem>
                  <SelectItem value="BUF" className="font-mono text-[#cbd5e1]">
                    Buffalo Bills
                  </SelectItem>
                  <SelectItem value="KC" className="font-mono text-[#cbd5e1]">
                    Kansas City Chiefs
                  </SelectItem>
                  <SelectItem value="SF" className="font-mono text-[#cbd5e1]">
                    San Francisco 49ers
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
                  <SelectItem value="AVAILABLE" className="font-mono text-[#cbd5e1]">
                    Waiver Wire
                  </SelectItem>
                  <SelectItem value="OWNED" className="font-mono text-[#cbd5e1]">
                    Owned
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="VALUE" className="font-mono text-[#cbd5e1]">
                    Trade Value
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
            <div className="bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                    <TableHead className="font-mono text-xs text-[#94a3b8] font-medium text-left">POSITION</TableHead>
                    <TableHead className="font-mono text-xs text-[#94a3b8] font-medium text-left">PLAYER</TableHead>
                    <TableHead className="font-mono text-xs text-[#94a3b8] font-medium text-center">VALUE</TableHead>
                    <TableHead className="font-mono text-xs text-[#94a3b8] font-medium text-center">PROJ_PTS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <TableRow key={player.id} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                      <TableCell className="py-3 text-left">
                        <Badge variant="outline" className={`font-mono text-xs ${getPositionColor(player.position)}`}>
                          {player.position}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-left">
                        <div>
                          <div
                            className="font-mono text-sm text-[#cbd5e1] font-medium cursor-pointer hover:text-[#22c55e] transition-colors"
                            onClick={() => handlePlayerClick(player)}
                          >
                            {player.name}
                          </div>
                          <div className="font-mono text-xs text-[#94a3b8]">{player.nflTeam}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="font-mono text-sm text-[#22c55e] font-semibold">
                          ${player.value}{" "}
                          <span className={`text-xs ${player.weeklyTrend >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                            ({player.weeklyTrend > 0 ? "+" : ""}
                            {player.weeklyTrend}%)
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        <div className="font-mono text-sm text-[#cbd5e1] font-medium">{player.projectedPoints}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Player Overview Modal */}
      <PlayerOverviewModal
        player={selectedPlayer}
        open={!!selectedPlayer}
        onOpenChange={(open) => !open && setSelectedPlayer(null)}
      />
    </div>
  )
}
