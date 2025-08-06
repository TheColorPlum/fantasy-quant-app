"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, Target, BarChart3, Clock, Zap, ArrowRight, Trophy, Calendar, Terminal, Heart, LogOut } from 'lucide-react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { RosterTicker } from "@/components/roster-ticker"
import { DonateModal } from "@/components/donate-modal"

export default function Dashboard() {
  const [currentWeek] = useState(14)
  const [playoffWeeks] = useState([15, 16, 17])
  const [showDonateModal, setShowDonateModal] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const quickActions = [
    {
      title: "FIND_A_TRADE",
      description: "Generate optimal trade opportunities",
      icon: Target,
      href: "/trades",
      color: "text-[#22c55e]",
      bgColor: "bg-[#22c55e]/10",
      borderColor: "border-[#22c55e]/20"
    },
    {
      title: "MY_PROPOSALS", 
      description: "View sent trade proposals",
      icon: BarChart3,
      href: "/proposals",
      color: "text-[#3b82f6]",
      bgColor: "bg-[#3b82f6]/10", 
      borderColor: "border-[#3b82f6]/20"
    },
    {
      title: "VIEW_ROSTERS",
      description: "Browse all league rosters",
      icon: Users,
      href: "/rosters",
      color: "text-[#f59e0b]",
      bgColor: "bg-[#f59e0b]/10",
      borderColor: "border-[#f59e0b]/20"
    },
    {
      title: "ALL_PLAYERS",
      description: "Search player database",
      icon: Trophy,
      href: "/players", 
      color: "text-[#8b5cf6]",
      bgColor: "bg-[#8b5cf6]/10",
      borderColor: "border-[#8b5cf6]/20"
    }
  ]

  const myRoster = [
    { name: "Josh Allen", position: "QB", team: "BUF", projectedPoints: 24.8, status: "active" },
    { name: "Saquon Barkley", position: "RB", team: "NYG", projectedPoints: 18.7, status: "active" },
    { name: "Austin Ekeler", position: "RB", team: "LAC", projectedPoints: 16.2, status: "questionable" },
    { name: "Stefon Diggs", position: "WR", team: "BUF", projectedPoints: 19.4, status: "active" },
    { name: "Mike Evans", position: "WR", team: "TB", projectedPoints: 17.1, status: "active" },
    { name: "Travis Kelce", position: "TE", team: "KC", projectedPoints: 16.8, status: "active" },
    { name: "Tyler Bass", position: "K", team: "BUF", projectedPoints: 8.2, status: "active" },
    { name: "Buffalo Bills", position: "DST", team: "BUF", projectedPoints: 12.4, status: "active" }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-[#22c55e] border-[#22c55e]"
      case "questionable":
        return "text-[#f59e0b] border-[#f59e0b]"
      case "out":
        return "text-[#ef4444] border-[#ef4444]"
      default:
        return "text-[#94a3b8] border-[#94a3b8]"
    }
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
      {/* Header - Dashboard keeps its own header */}
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Terminal className="h-6 w-6 text-[#22c55e]" />
                <span className="text-xl font-bold font-mono">TRADEUP</span>
              </Link>
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

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-mono text-[#22c55e] mb-2">DASHBOARD</h1>
          <p className="font-mono text-sm text-[#94a3b8]">
            Welcome back • Week {currentWeek} • Playoffs in {playoffWeeks[0] - currentWeek} weeks
          </p>
        </div>

        {/* League Activity Ticker */}
        <RosterTicker />

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="font-mono text-xl text-[#cbd5e1] mb-4">QUICK_ACTIONS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className={`bg-[#1a1a1a] border-[#2a2a2a] hover:${action.borderColor} transition-colors cursor-pointer terminal-glow`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`p-2 rounded-lg ${action.bgColor} ${action.borderColor} border`}>
                        <action.icon className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <div>
                        <h3 className={`font-mono text-sm font-semibold ${action.color}`}>
                          {action.title}
                        </h3>
                      </div>
                    </div>
                    <p className="font-mono text-xs text-[#94a3b8]">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* My Roster Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-xl text-[#cbd5e1]">MY_ROSTER</h2>
            <div className="flex items-center space-x-2 text-[#94a3b8]">
              <Calendar className="h-4 w-4" />
              <span className="font-mono text-sm">Week {currentWeek} Projections</span>
            </div>
          </div>
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="p-0">
              <div className="divide-y divide-[#2a2a2a]">
                {myRoster.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-[#0f0f0f] transition-colors">
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant="outline" 
                        className={`font-mono text-xs ${getPositionColor(player.position)}`}
                      >
                        {player.position}
                      </Badge>
                      <div>
                        <div className="font-mono text-sm text-[#cbd5e1] font-semibold">
                          {player.name}
                        </div>
                        <div className="font-mono text-xs text-[#94a3b8]">
                          {player.team}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge 
                        variant="outline" 
                        className={`font-mono text-xs ${getStatusColor(player.status)}`}
                      >
                        {player.status.toUpperCase()}
                      </Badge>
                      <div className="text-right">
                        <div className="font-mono text-sm text-[#22c55e] font-semibold">
                          {player.projectedPoints} pts
                        </div>
                        <div className="font-mono text-xs text-[#94a3b8]">
                          projected
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Season Progress */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="font-mono text-[#22c55e] flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                SEASON_PROGRESS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between font-mono text-sm">
                  <span className="text-[#94a3b8]">Week {currentWeek} of 18</span>
                  <span className="text-[#22c55e]">{Math.round((currentWeek / 18) * 100)}%</span>
                </div>
                <Progress value={(currentWeek / 18) * 100} className="h-2" />
                <div className="flex justify-between font-mono text-xs text-[#94a3b8]">
                  <span>Regular Season</span>
                  <span>Playoffs: Weeks {playoffWeeks.join(', ')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="font-mono text-[#22c55e] flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                TRADE_ACTIVITY
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[#94a3b8]">Trades This Season</span>
                  <span className="font-mono text-lg font-bold text-[#22c55e]">23</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[#94a3b8]">Your Trades</span>
                  <span className="font-mono text-lg font-bold text-[#3b82f6]">4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[#94a3b8]">Active Proposals</span>
                  <span className="font-mono text-lg font-bold text-[#f59e0b]">2</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Donate Modal */}
      <DonateModal open={showDonateModal} onOpenChange={setShowDonateModal} />
    </div>
  )
}
