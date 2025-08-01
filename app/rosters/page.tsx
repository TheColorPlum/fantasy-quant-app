"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Terminal, TrendingUp, TrendingDown, Filter } from "lucide-react"
import Link from "next/link"
import { mockLeagueData } from "@/lib/dummy-data"

export default function RostersPage() {
  const [selectedTeam, setSelectedTeam] = useState("ALL")
  const [sortBy, setSortBy] = useState("VALUE")

  const filteredTeams =
    selectedTeam === "ALL" ? mockLeagueData.teams : mockLeagueData.teams.filter((team) => team.name === selectedTeam)

  const sortPlayers = (players: any[]) => {
    return [...players].sort((a, b) => {
      switch (sortBy) {
        case "VALUE":
          return b.value - a.value
        case "TREND":
          return b.weeklyTrend - a.weeklyTrend
        case "POSITION":
          return a.position.localeCompare(b.position)
        default:
          return 0
      }
    })
  }

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
                <span className="text-xl font-bold font-mono">FANTASYQUANT</span>
              </Link>
              <Badge variant="outline" className="text-[#22c55e] border-[#22c55e] font-mono text-xs">
                MARKET_ANALYSIS
              </Badge>
            </div>

            <div className="flex items-center space-x-6">
              <div className="font-mono text-sm text-[#94a3b8]">
                PROPOSALS_REMAINING: <span className="text-[#f59e0b] font-semibold">3/5</span>
              </div>
              <Link href="/trade-generator">
                <Button className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold">
                  GENERATE_TRADES
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Controls */}
        <Card className="mb-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-[#22c55e]" />
                  <span className="font-mono text-sm text-[#cbd5e1]">FILTER_PORTFOLIO:</span>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="w-48 bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem value="ALL" className="font-mono">
                        ALL_PORTFOLIOS
                      </SelectItem>
                      {mockLeagueData.teams.map((team) => (
                        <SelectItem key={team.name} value={team.name} className="font-mono">
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm text-[#cbd5e1]">SORT_BY:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32 bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                      <SelectItem value="VALUE" className="font-mono">
                        VALUE
                      </SelectItem>
                      <SelectItem value="TREND" className="font-mono">
                        TREND
                      </SelectItem>
                      <SelectItem value="POSITION" className="font-mono">
                        POSITION
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="font-mono text-sm text-[#94a3b8]">
                SHOWING: <span className="text-[#22c55e]">{filteredTeams.length}</span> PORTFOLIOS
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Rosters */}
        <div className="space-y-8">
          {filteredTeams.map((team) => (
            <Card key={team.name} className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="font-mono text-xl text-[#22c55e]">{team.name}</CardTitle>
                    <Badge variant="outline" className="text-[#cbd5e1] border-[#cbd5e1] font-mono text-xs">
                      RANK_{team.rank}/12
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-6 font-mono text-sm">
                    <div className="text-[#94a3b8]">
                      PORTFOLIO_VALUE: <span className="text-[#22c55e]">${team.totalValue}</span>
                    </div>
                    <div className="text-[#94a3b8]">
                      RECORD: <span className="text-[#cbd5e1]">{team.record}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid gap-3">
                  {sortPlayers(team.roster).map((player, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3 hover:bg-[#1a1a1a] transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className={`font-mono text-xs ${getPositionColor(player.position)}`}>
                          {player.position}
                        </Badge>
                        <div>
                          <div className="font-mono text-sm text-[#cbd5e1]">{player.name}</div>
                          <div className="font-mono text-xs text-[#94a3b8]">{player.team}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <div className="font-mono text-sm text-[#22c55e]">${player.value}</div>
                          <div className="font-mono text-xs text-[#94a3b8]">MARKET_VALUE</div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`font-mono text-sm flex items-center ${player.weeklyTrend >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                          >
                            {player.weeklyTrend >= 0 ? (
                              <TrendingUp className="h-4 w-4 mr-1" />
                            ) : (
                              <TrendingDown className="h-4 w-4 mr-1" />
                            )}
                            {player.weeklyTrend > 0 ? "+" : ""}
                            {player.weeklyTrend}%
                          </div>
                          <div className="font-mono text-xs text-[#94a3b8]">WEEKLY_TREND</div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-sm text-[#cbd5e1]">{player.projectedPoints}</div>
                          <div className="font-mono text-xs text-[#94a3b8]">PROJ_PTS</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
