"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react'

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

interface PlayerOverviewModalProps {
  player: Player | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlayerOverviewModal({ player, open, onOpenChange }: PlayerOverviewModalProps) {
  if (!player) return null

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono text-[#22c55e] flex items-center space-x-3">
            <Badge variant="outline" className={`font-mono text-xs ${getPositionColor(player.position)}`}>
              {player.position}
            </Badge>
            <span>{player.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="font-mono text-xs text-[#94a3b8]">NFL_TEAM</div>
                  <div className="font-mono text-lg font-bold text-[#cbd5e1]">{player.nflTeam}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="font-mono text-xs text-[#94a3b8]">OWNED_BY</div>
                  <div className={`font-mono text-sm font-bold ${player.owned ? "text-[#cbd5e1]" : "text-[#94a3b8]"}`}>
                    {player.fantasyTeam}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fantasy Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs text-[#94a3b8]">TRADE_VALUE</div>
                    <div className="font-mono text-xl font-bold text-[#22c55e]">${player.value}</div>
                  </div>
                  <Target className="h-6 w-6 text-[#22c55e]" />
                </div>
                <div className="mt-2 flex items-center space-x-1">
                  {player.weeklyTrend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-[#22c55e]" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-[#ef4444]" />
                  )}
                  <span
                    className={`font-mono text-xs ${player.weeklyTrend >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                  >
                    {player.weeklyTrend > 0 ? "+" : ""}
                    {player.weeklyTrend}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-xs text-[#94a3b8]">SEASON_TOTAL</div>
                    <div className="font-mono text-xl font-bold text-[#cbd5e1]">{player.seasonPoints}</div>
                  </div>
                  <BarChart3 className="h-6 w-6 text-[#cbd5e1]" />
                </div>
                <div className="font-mono text-xs text-[#94a3b8] mt-2">Fantasy Points</div>
              </CardContent>
            </Card>
          </div>

          {/* Projections */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="font-mono text-xs text-[#94a3b8]">SEASON_PROJECTION</div>
                  <div className="font-mono text-lg font-bold text-[#cbd5e1]">{player.projectedPoints}</div>
                  <div className="font-mono text-xs text-[#94a3b8]">Avg per game</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
              <CardContent className="pt-4">
                <div className="text-center">
                  <div className="font-mono text-xs text-[#94a3b8]">THIS_WEEK</div>
                  <div className="font-mono text-lg font-bold text-[#22c55e]">{player.currentWeekProjection}</div>
                  <div className="font-mono text-xs text-[#94a3b8]">Projected points</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
