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

interface Player {
  id: string
  name: string
  position: string
  team: string
  value: number
  trend: number
  projectedPoints: number
  status: 'healthy' | 'questionable' | 'doubtful' | 'out'
}

const mockRoster: Player[] = [
  { id: '1', name: 'Josh Allen', position: 'QB', team: 'BUF', value: 85, trend: 5.2, projectedPoints: 24.8, status: 'healthy' },
  { id: '2', name: 'Christian McCaffrey', position: 'RB', team: 'SF', value: 92, trend: -2.1, projectedPoints: 22.4, status: 'questionable' },
  { id: '3', name: 'Alvin Kamara', position: 'RB', team: 'NO', value: 78, trend: 3.8, projectedPoints: 18.6, status: 'healthy' },
  { id: '4', name: 'Tyreek Hill', position: 'WR', team: 'MIA', value: 88, trend: 1.4, projectedPoints: 19.2, status: 'healthy' },
  { id: '5', name: 'Stefon Diggs', position: 'WR', team: 'HOU', value: 82, trend: -1.8, projectedPoints: 17.8, status: 'healthy' },
  { id: '6', name: 'Mike Evans', position: 'WR', team: 'TB', value: 75, trend: 2.3, projectedPoints: 16.4, status: 'doubtful' },
  { id: '7', name: 'Travis Kelce', position: 'TE', team: 'KC', value: 84, trend: -3.2, projectedPoints: 15.6, status: 'healthy' },
  { id: '8', name: 'Justin Tucker', position: 'K', team: 'BAL', value: 45, trend: 0.8, projectedPoints: 8.2, status: 'healthy' },
  { id: '9', name: 'San Francisco', position: 'DST', team: 'SF', value: 38, trend: 4.1, projectedPoints: 9.4, status: 'healthy' },
]

export default function DashboardPage() {
  const [showDonateModal, setShowDonateModal] = useState(false)
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

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'bg-purple-600'
      case 'RB': return 'bg-green-600'
      case 'WR': return 'bg-blue-600'
      case 'TE': return 'bg-orange-600'
      case 'K': return 'bg-yellow-600'
      case 'DST': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'questionable': return <Clock className="h-4 w-4 text-yellow-400" />
      case 'doubtful': return <AlertTriangle className="h-4 w-4 text-orange-400" />
      case 'out': return <AlertTriangle className="h-4 w-4 text-red-400" />
      default: return <CheckCircle className="h-4 w-4 text-green-400" />
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
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                  <TableHead className="text-[#94a3b8] font-mono text-xs">POSITION</TableHead>
                  <TableHead className="text-[#94a3b8] font-mono text-xs">PLAYER</TableHead>
                  <TableHead className="text-[#94a3b8] font-mono text-xs">VALUE</TableHead>
                  <TableHead className="text-[#94a3b8] font-mono text-xs">PROJ_PTS</TableHead>
                  <TableHead className="text-[#94a3b8] font-mono text-xs">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRoster.map((player) => (
                  <TableRow 
                    key={player.id} 
                    className="border-[#2a2a2a] hover:bg-[#1a1a1a] cursor-pointer"
                  >
                    <TableCell>
                      <Badge className={`${getPositionColor(player.position)} text-white font-mono text-xs`}>
                        {player.position}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-[#cbd5e1] text-sm">{player.name}</div>
                        <div className="text-[#94a3b8] text-xs font-mono">{player.team}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-[#cbd5e1] font-mono text-sm">{player.value}</span>
                        <span className={`text-xs font-mono ${
                          player.trend > 0 ? 'text-green-400' : player.trend < 0 ? 'text-red-400' : 'text-[#94a3b8]'
                        }`}>
                          {player.trend > 0 ? '+' : ''}{player.trend.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[#cbd5e1] font-mono text-sm">{player.projectedPoints}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(player.status)}
                        <span className="text-[#94a3b8] text-xs font-mono capitalize">
                          {player.status}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <DonateModal open={showDonateModal} onOpenChange={setShowDonateModal} />
    </div>
  )
}
