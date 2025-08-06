"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlayerOverviewModal } from "@/components/player-overview-modal"

export default function RostersPage() {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState("your-team")

  // Mock league teams data
  const leagueTeams = [
    { id: "your-team", name: "Your Team", owner: "You" },
    { id: "fantasy-legends", name: "Fantasy Legends", owner: "Mike Johnson" },
    { id: "trade-masters", name: "Trade Masters", owner: "Sarah Chen" },
    { id: "playoff-bound", name: "Playoff Bound", owner: "Alex Rodriguez" },
    { id: "defense-dynasty", name: "Defense Dynasty", owner: "Jordan Smith" },
    { id: "waiver-warriors", name: "Waiver Warriors", owner: "Taylor Brown" },
    { id: "championship-chasers", name: "Championship Chasers", owner: "Chris Wilson" },
    { id: "draft-kings", name: "Draft Kings", owner: "Morgan Davis" },
  ]

  // Mock roster data for different teams
  const teamRosters = {
    "your-team": [
      {
        id: "1",
        name: "Patrick Mahomes",
        position: "QB",
        nflTeam: "KC",
        fantasyTeam: "Your Team",
        value: 28.5,
        weeklyTrend: 2.1,
        projectedPoints: 24.8,
        projTrend: 1.3,
        seasonPoints: 287.4,
        currentWeekProjection: 24.8,
        owned: true,
      },
      {
        id: "2",
        name: "Christian McCaffrey",
        position: "RB",
        nflTeam: "SF",
        fantasyTeam: "Your Team",
        value: 52.1,
        weeklyTrend: 0.5,
        projectedPoints: 22.3,
        projTrend: -0.8,
        seasonPoints: 245.3,
        currentWeekProjection: 22.3,
        owned: true,
      },
      {
        id: "3",
        name: "Austin Ekeler",
        position: "RB",
        nflTeam: "LAC",
        fantasyTeam: "Your Team",
        value: 45.3,
        weeklyTrend: -1.2,
        projectedPoints: 18.7,
        projTrend: 2.1,
        seasonPoints: 205.7,
        currentWeekProjection: 18.7,
        owned: true,
      },
      {
        id: "4",
        name: "Justin Jefferson",
        position: "WR",
        nflTeam: "MIN",
        fantasyTeam: "Your Team",
        value: 48.9,
        weeklyTrend: 0.2,
        projectedPoints: 19.4,
        projTrend: 0.5,
        seasonPoints: 213.4,
        currentWeekProjection: 19.4,
        owned: true,
      },
      {
        id: "5",
        name: "Stefon Diggs",
        position: "WR",
        nflTeam: "BUF",
        fantasyTeam: "Your Team",
        value: 42.1,
        weeklyTrend: 0.4,
        projectedPoints: 17.2,
        projTrend: -1.1,
        seasonPoints: 189.2,
        currentWeekProjection: 17.2,
        owned: true,
      },
      {
        id: "6",
        name: "Travis Kelce",
        position: "TE",
        nflTeam: "KC",
        fantasyTeam: "Your Team",
        value: 32.1,
        weeklyTrend: 0.1,
        projectedPoints: 14.6,
        projTrend: 0.3,
        seasonPoints: 160.6,
        currentWeekProjection: 14.6,
        owned: true,
      },
    ],
    "fantasy-legends": [
      {
        id: "7",
        name: "Josh Allen",
        position: "QB",
        nflTeam: "BUF",
        fantasyTeam: "Fantasy Legends",
        value: 26.8,
        weeklyTrend: 1.5,
        projectedPoints: 23.2,
        projTrend: 0.8,
        seasonPoints: 255.2,
        currentWeekProjection: 23.2,
        owned: true,
      },
      {
        id: "8",
        name: "Derrick Henry",
        position: "RB",
        nflTeam: "TEN",
        fantasyTeam: "Fantasy Legends",
        value: 38.4,
        weeklyTrend: -0.8,
        projectedPoints: 16.9,
        projTrend: -1.2,
        seasonPoints: 185.9,
        currentWeekProjection: 16.9,
        owned: true,
      },
      {
        id: "9",
        name: "Davante Adams",
        position: "WR",
        nflTeam: "LV",
        fantasyTeam: "Fantasy Legends",
        value: 41.2,
        weeklyTrend: 0.6,
        projectedPoints: 18.1,
        projTrend: 1.4,
        seasonPoints: 199.1,
        currentWeekProjection: 18.1,
        owned: true,
      },
      {
        id: "10",
        name: "Mark Andrews",
        position: "TE",
        nflTeam: "BAL",
        fantasyTeam: "Fantasy Legends",
        value: 28.7,
        weeklyTrend: -0.4,
        projectedPoints: 13.2,
        projTrend: -0.6,
        seasonPoints: 145.2,
        currentWeekProjection: 13.2,
        owned: true,
      },
    ],
  }

  const currentRoster = teamRosters[selectedTeam] || []
  const selectedTeamInfo = leagueTeams.find(team => team.id === selectedTeam)

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
        return "text-[#cbd5e1] border-[#cbd5e1]"
    }
  }

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player)
    setShowPlayerModal(true)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-mono text-3xl font-bold text-[#22c55e] mb-2">LEAGUE_ROSTERS</h1>
            <p className="font-mono text-sm text-[#94a3b8]">VIEW_ALL_TEAM_ROSTERS</p>
          </div>

          {/* Team Selector */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] mb-8">
            <CardHeader>
              <CardTitle className="font-mono text-[#22c55e]">SELECT_TEAM</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-[#cbd5e1] max-w-md">
                  <SelectValue placeholder="SELECT_TEAM" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  {leagueTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id} className="font-mono text-[#cbd5e1]">
                      {team.name} ({team.owner})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Selected Team Roster */}
          {selectedTeamInfo && (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="font-mono text-[#22c55e]">{selectedTeamInfo.name.toUpperCase()}</CardTitle>
                <CardDescription className="font-mono text-xs text-[#cbd5e1]">
                  Owner: {selectedTeamInfo.owner}
                </CardDescription>
              </CardHeader>
              <div className="px-6 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
                  <div className="text-center">
                    <div className="font-mono text-xs text-[#94a3b8] mb-1">TOTAL_VALUE</div>
                    <div className="font-mono text-lg font-bold text-[#22c55e]">
                      ${currentRoster.reduce((sum, player) => sum + player.value, 0)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-xs text-[#94a3b8] mb-1">PROJ_POINTS</div>
                    <div className="font-mono text-lg font-bold text-[#22c55e]">
                      {currentRoster.reduce((sum, player) => sum + player.projectedPoints, 0).toFixed(1)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-mono text-xs text-[#94a3b8] mb-1">RECORD</div>
                    <div className="font-mono text-lg font-bold text-[#22c55e]">
                      {selectedTeam === "your-team" ? "8-4-0" : "6-6-0"}
                    </div>
                  </div>
                </div>
              </div>
              <CardContent>
                {currentRoster.length > 0 ? (
                  <div className="bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                          <TableHead className="font-mono text-xs text-[#94a3b8] font-medium text-left">
                            POSITION
                          </TableHead>
                          <TableHead className="font-mono text-xs text-[#94a3b8] font-medium text-left">
                            PLAYER
                          </TableHead>
                          <TableHead className="font-mono text-xs text-[#94a3b8] font-medium text-center">
                            VALUE
                          </TableHead>
                          <TableHead className="font-mono text-xs text-[#94a3b8] font-medium text-center">
                            PROJ_PTS
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentRoster.map((player, index) => (
                          <TableRow key={index} className="border-[#2a2a2a] hover:bg-[#1a1a1a]">
                            <TableCell className="py-3 text-left">
                              <Badge
                                variant="outline"
                                className={`font-mono text-xs ${getPositionColor(player.position)}`}
                              >
                                {player.position}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-left">
                              <div>
                                <div 
                                  className="font-mono text-sm text-[#cbd5e1] font-medium cursor-pointer hover:text-[#22c55e]"
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
                                <span
                                  className={`text-xs ${player.weeklyTrend >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                                >
                                  ({player.weeklyTrend > 0 ? "+" : ""}
                                  {player.weeklyTrend}%)
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 text-center">
                              <div className="font-mono text-sm text-[#cbd5e1] font-medium">
                                {player.projectedPoints}{" "}
                                <span
                                  className={`text-xs ${player.projTrend >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                                >
                                  ({player.projTrend > 0 ? "+" : ""}
                                  {player.projTrend}%)
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 text-[#2a2a2a] mx-auto mb-4" />
                    <p className="font-mono text-sm text-[#94a3b8]">
                      No roster data available for this team
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Player Overview Modal */}
      <PlayerOverviewModal 
        player={selectedPlayer} 
        open={showPlayerModal} 
        onOpenChange={setShowPlayerModal} 
      />
    </div>
  )
}
