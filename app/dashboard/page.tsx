"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, Users, Target, Zap, Terminal, Heart, LogOut, ChevronRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DonateModal } from "@/components/donate-modal"
import { RosterTicker } from "@/components/roster-ticker"
import { PlayerOverviewModal } from "@/components/player-overview-modal"

interface Player {
  id: string
  name: string
  position: string
  nflTeam: string
  fantasyTeam: string
  value: number
  weeklyTrend: number
  projectedPoints: number
  seasonPoints: number
  currentWeekProjection: number
  owned: boolean
}

const mockRoster: Player[] = [
  { 
    id: '1', 
    name: 'Josh Allen', 
    position: 'QB', 
    nflTeam: 'BUF', 
    fantasyTeam: 'My Team',
    value: 85, 
    weeklyTrend: 5.2, 
    projectedPoints: 24.8, 
    seasonPoints: 298,
    currentWeekProjection: 24.8,
    owned: true
  },
  { 
    id: '2', 
    name: 'Christian McCaffrey', 
    position: 'RB', 
    nflTeam: 'SF', 
    fantasyTeam: 'My Team',
    value: 92, 
    weeklyTrend: -2.1, 
    projectedPoints: 22.4, 
    seasonPoints: 268,
    currentWeekProjection: 22.4,
    owned: true
  },
  { 
    id: '3', 
    name: 'Alvin Kamara', 
    position: 'RB', 
    nflTeam: 'NO', 
    fantasyTeam: 'My Team',
    value: 78, 
    weeklyTrend: 3.8, 
    projectedPoints: 18.6, 
    seasonPoints: 223,
    currentWeekProjection: 18.6,
    owned: true
  },
  { 
    id: '4', 
    name: 'Tyreek Hill', 
    position: 'WR', 
    nflTeam: 'MIA', 
    fantasyTeam: 'My Team',
    value: 88, 
    weeklyTrend: 1.4, 
    projectedPoints: 19.2, 
    seasonPoints: 230,
    currentWeekProjection: 19.2,
    owned: true
  },
  { 
    id: '5', 
    name: 'Stefon Diggs', 
    position: 'WR', 
    nflTeam: 'HOU', 
    fantasyTeam: 'My Team',
    value: 82, 
    weeklyTrend: -1.8, 
    projectedPoints: 17.8, 
    seasonPoints: 213,
    currentWeekProjection: 17.8,
    owned: true
  },
  { 
    id: '6', 
    name: 'Mike Evans', 
    position: 'WR', 
    nflTeam: 'TB', 
    fantasyTeam: 'My Team',
    value: 75, 
    weeklyTrend: 2.3, 
    projectedPoints: 16.4, 
    seasonPoints: 197,
    currentWeekProjection: 16.4,
    owned: true
  },
  { 
    id: '7', 
    name: 'Travis Kelce', 
    position: 'TE', 
    nflTeam: 'KC', 
    fantasyTeam: 'My Team',
    value: 84, 
    weeklyTrend: -3.2, 
    projectedPoints: 15.6, 
    seasonPoints: 187,
    currentWeekProjection: 15.6,
    owned: true
  },
  { 
    id: '8', 
    name: 'Justin Tucker', 
    position: 'K', 
    nflTeam: 'BAL', 
    fantasyTeam: 'My Team',
    value: 45, 
    weeklyTrend: 0.8, 
    projectedPoints: 8.2, 
    seasonPoints: 98,
    currentWeekProjection: 8.2,
    owned: true
  },
  { 
    id: '9', 
    name: 'San Francisco', 
    position: 'DST', 
    nflTeam: 'SF', 
    fantasyTeam: 'My Team',
    value: 38, 
    weeklyTrend: 4.1, 
    projectedPoints: 9.4, 
    seasonPoints: 113,
    currentWeekProjection: 9.4,
    owned: true
  },
]

export default function DashboardPage() {
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [showPlayerModal, setShowPlayerModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player)
    setShowPlayerModal(true)
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
        return "text-[#cbd5e1] border-[#cbd5e1]"
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Terminal className="h-6 w-6 text-[#22c55e]" />
                <span className="text-xl font-bold font-mono">TRADEUP</span>
              </div>
              <Badge variant="outline" className="text-[#22c55e] border-[#22c55e] font-mono text-xs">
                DASHBOARD
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setShowDonateModal(true)}
                variant="outline"
                size="sm"
                className="font-mono text-xs border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-black bg-transparent"
              >
                <Heart className="mr-1 h-3 w-3" />
                DONATE
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="font-mono text-xs border-[#94a3b8] text-[#94a3b8] hover:bg-[#94a3b8] hover:text-black bg-transparent"
              >
                <LogOut className="mr-1 h-3 w-3" />
                LOGOUT
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Roster Activity Ticker */}
      <div className="border-b border-[#2a2a2a]">
        <div className="container mx-auto px-4 py-4">
          <RosterTicker />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/trades">
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
                  FIND_TRADES
                  <ChevronRight className="h-5 w-5 text-[#22c55e]" />
                </CardTitle>
                <CardDescription className="text-[#94a3b8] font-mono text-sm">
                  Scan all teams for winning opportunities
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/proposals">
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
                  MY_PROPOSALS
                  <ChevronRight className="h-5 w-5 text-[#22c55e]" />
                </CardTitle>
                <CardDescription className="text-[#94a3b8] font-mono text-sm">
                  View and manage your trade proposals
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/rosters">
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
                  VIEW_ROSTERS
                  <ChevronRight className="h-5 w-5 text-[#22c55e]" />
                </CardTitle>
                <CardDescription className="text-[#94a3b8] font-mono text-sm">
                  Analyze all league rosters and values
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/players">
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
                  ALL_PLAYERS
                  <ChevronRight className="h-5 w-5 text-[#22c55e]" />
                </CardTitle>
                <CardDescription className="text-[#94a3b8] font-mono text-sm">
                  Browse and analyze all league players
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* My Roster */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-[#cbd5e1] font-mono">MY_ROSTER</CardTitle>
            <CardDescription className="text-[#94a3b8] font-mono text-sm">
              Current roster analysis and projected points
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#0f0f0f] rounded-lg border border-[#2a2a2a]">
              <div className="text-center">
                <div className="font-mono text-xs text-[#94a3b8] mb-1">TOTAL_VALUE</div>
                <div className="font-mono text-lg font-bold text-[#22c55e]">
                  ${mockRoster.reduce((sum, player) => sum + player.value, 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="font-mono text-xs text-[#94a3b8] mb-1">PROJ_POINTS</div>
                <div className="font-mono text-lg font-bold text-[#22c55e]">
                  {mockRoster.reduce((sum, player) => sum + player.projectedPoints, 0).toFixed(1)}
                </div>
              </div>
              <div className="text-center">
                <div className="font-mono text-xs text-[#94a3b8] mb-1">RECORD</div>
                <div className="font-mono text-lg font-bold text-[#22c55e]">8-4-0</div>
              </div>
            </div>
          </div>
          <CardContent>
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
                  {mockRoster.map((player, index) => (
                    <TableRow 
                      key={index} 
                      className="border-[#2a2a2a] hover:bg-[#1a1a1a] cursor-pointer"
                      onClick={() => handlePlayerClick(player)}
                    >
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
                          <div className="font-mono text-sm text-[#cbd5e1] font-medium hover:text-[#22c55e] transition-colors">
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
                          {player.projectedPoints}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <DonateModal open={showDonateModal} onOpenChange={setShowDonateModal} />
      <PlayerOverviewModal 
        player={selectedPlayer} 
        open={showPlayerModal} 
        onOpenChange={setShowPlayerModal} 
      />
    </div>
  )
}
