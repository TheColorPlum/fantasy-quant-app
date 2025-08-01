"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Terminal, TrendingUp, Users, Zap } from "lucide-react"
import Link from "next/link"
import { RosterTicker } from "@/components/roster-ticker"

export default function Dashboard() {
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
                TRADING_TERMINAL
              </Badge>
            </div>

            <div className="flex items-center space-x-6">
              <div className="font-mono text-sm text-[#cbd5e1]">
                SCANS_LEFT: <span className="text-[#f59e0b] font-semibold">3/5</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-black bg-transparent"
              >
                UPGRADE
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Live Roster Moves Ticker */}
        <div className="mb-8">
          <RosterTicker />
        </div>

        {/* Portfolio Overview */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="font-mono text-[#22c55e]">YOUR_TEAM</CardTitle>
              <CardDescription className="font-mono text-xs text-[#cbd5e1]">
                ESPN League: Championship Dreams (ID: 1847392)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm text-[#cbd5e1]">CURRENT_RANK</span>
                  <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 font-mono text-xs">
                    3rd of 12
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#cbd5e1]">TEAM_VALUE</span>
                    <span className="text-[#22c55e]">$847.50</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#cbd5e1]">WEEKLY_PROJ</span>
                    <span className="text-[#22c55e]">+12.3 PTS</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#cbd5e1]">RECORD</span>
                    <span className="text-[#cbd5e1]">7-4</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2a2a2a]">
                <Link href="/rosters">
                  <Button className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold">
                    VIEW_ALL_TEAMS
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="font-mono text-[#22c55e]">TRADE_OPPORTUNITIES</CardTitle>
              <CardDescription className="font-mono text-xs text-[#cbd5e1]">
                Smart trades waiting for you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm text-[#cbd5e1]">SCAN_STATUS</span>
                  <Badge className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20 font-mono text-xs">READY</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#cbd5e1]">LAST_SCAN</span>
                    <span className="text-[#22c55e]">7 trades found</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#cbd5e1]">AVG_QUALITY</span>
                    <span className="text-[#22c55e]">84.2%</span>
                  </div>
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-[#cbd5e1]">READY_TO_SEND</span>
                    <span className="text-[#22c55e]">4</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#2a2a2a]">
                <Link href="/trade-generator">
                  <Button className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold">
                    FIND_NEW_TRADES
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="font-mono text-[#22c55e]">QUICK_ACTIONS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/trade-generator">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-[#2a2a2a] hover:bg-[#2a2a2a] bg-transparent text-[#cbd5e1]"
                >
                  <TrendingUp className="h-6 w-6 text-[#22c55e]" />
                  <span className="font-mono text-xs">FIND_TRADES</span>
                </Button>
              </Link>

              <Link href="/proposals">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-[#2a2a2a] hover:bg-[#2a2a2a] bg-transparent text-[#cbd5e1]"
                >
                  <Zap className="h-6 w-6 text-[#22c55e]" />
                  <span className="font-mono text-xs">VIEW_PROPOSALS</span>
                </Button>
              </Link>

              <Link href="/rosters">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-[#2a2a2a] hover:bg-[#2a2a2a] bg-transparent text-[#cbd5e1]"
                >
                  <Users className="h-6 w-6 text-[#22c55e]" />
                  <span className="font-mono text-xs">ALL_TEAMS</span>
                </Button>
              </Link>

              <Link href="/players">
                <Button
                  variant="outline"
                  className="w-full h-20 flex flex-col items-center justify-center space-y-2 border-[#2a2a2a] hover:bg-[#2a2a2a] bg-transparent text-[#cbd5e1]"
                >
                  <Users className="h-6 w-6 text-[#22c55e]" />
                  <span className="font-mono text-xs">ALL_PLAYERS</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Usage Tracking */}
        <Card className="mt-8 bg-[#1a1a1a] border-[#f59e0b]/20">
          <CardHeader>
            <CardTitle className="font-mono text-[#f59e0b] flex items-center justify-between">
              FREE_ACCOUNT_LIMITS
              <Badge className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20 font-mono text-xs">FREE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between font-mono text-sm">
                <span className="text-[#cbd5e1]">WEEKLY_SCANS</span>
                <span className="text-[#f59e0b]">3/5 remaining</span>
              </div>
              <Progress value={40} className="h-2 bg-[#2a2a2a]" />
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="font-mono text-xs text-[#cbd5e1]">Upgrade for unlimited scans + advanced features</div>
              <Button size="sm" className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-mono font-semibold">
                UPGRADE_NOW
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
