"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Plus, Minus, ArrowRightLeft, Target } from "lucide-react"

interface RosterMove {
  id: string
  type: "ADD" | "DROP" | "TRADE" | "CLAIM"
  team: string
  player: string
  details?: string
  timestamp: Date
}

const generateMockMoves = (): RosterMove[] => [
  {
    id: "1",
    type: "DROP",
    team: "TEAM_MAHOMES",
    player: "Gus Edwards",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: "2",
    type: "CLAIM",
    team: "TEAM_ALLEN",
    player: "Chuba Hubbard",
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
  },
  {
    id: "3",
    type: "TRADE",
    team: "TEAM_BURROW",
    player: "Mike Evans",
    details: "for Josh Jacobs + Tyler Lockett",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: "4",
    type: "ADD",
    team: "TEAM_JACKSON",
    player: "Jameis Winston",
    timestamp: new Date(Date.now() - 23 * 60 * 1000),
  },
  {
    id: "5",
    type: "DROP",
    team: "TEAM_HERBERT",
    player: "Tyler Higbee",
    timestamp: new Date(Date.now() - 31 * 60 * 1000),
  },
  {
    id: "6",
    type: "CLAIM",
    team: "TEAM_HURTS",
    player: "Darius Slayton",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
  },
]

export function RosterTicker() {
  const [moves, setMoves] = useState<RosterMove[]>(generateMockMoves())
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        // Add a new random move every 15 seconds
        const newMove: RosterMove = {
          id: Date.now().toString(),
          type: ["ADD", "DROP", "CLAIM"][Math.floor(Math.random() * 3)] as any,
          team: ["TEAM_MAHOMES", "TEAM_ALLEN", "TEAM_BURROW", "TEAM_JACKSON"][Math.floor(Math.random() * 4)],
          player: ["Kendrick Bourne", "Hunter Henry", "Deon Jackson", "Tyler Higbee"][Math.floor(Math.random() * 4)],
          timestamp: new Date(),
        }

        setMoves((prev) => [newMove, ...prev.slice(0, 9)]) // Keep only 10 most recent
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [isPaused])

  const getMoveIcon = (type: string) => {
    switch (type) {
      case "ADD":
        return <Plus className="h-3 w-3 text-[#22c55e]" />
      case "DROP":
        return <Minus className="h-3 w-3 text-[#ef4444]" />
      case "TRADE":
        return <ArrowRightLeft className="h-3 w-3 text-[#f59e0b]" />
      case "CLAIM":
        return <Target className="h-3 w-3 text-[#3b82f6]" />
      default:
        return null
    }
  }

  const getMoveColor = (type: string) => {
    switch (type) {
      case "ADD":
        return "text-[#22c55e]"
      case "DROP":
        return "text-[#ef4444]"
      case "TRADE":
        return "text-[#f59e0b]"
      case "CLAIM":
        return "text-[#3b82f6]"
      default:
        return "text-[#cbd5e1]"
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const minutes = Math.floor((Date.now() - timestamp.getTime()) / 60000)
    if (minutes < 1) return "now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a] overflow-hidden">
      <div className="bg-[#0f0f0f] border-b border-[#2a2a2a] px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="font-mono text-sm text-[#22c55e]">LIVE_ROSTER_MOVES</div>
          <div className="font-mono text-xs text-[#94a3b8]">{isPaused ? "PAUSED" : "LIVE"}</div>
        </div>
      </div>

      <div
        className="relative h-32 overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#1a1a1a] to-transparent z-10" />
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#1a1a1a] to-transparent z-10" />

        <div className={`space-y-2 p-4 ${!isPaused ? "animate-scroll" : ""}`}>
          {moves.map((move) => (
            <div key={move.id} className="flex items-center space-x-3 font-mono text-sm">
              {getMoveIcon(move.type)}
              <span className={getMoveColor(move.type)}>{move.type}</span>
              <span className="text-[#cbd5e1]">{move.team}</span>
              <span className="text-[#94a3b8]">
                {move.type === "DROP"
                  ? "dropped"
                  : move.type === "ADD"
                    ? "added"
                    : move.type === "CLAIM"
                      ? "claimed"
                      : "traded"}
              </span>
              <span className="text-[#cbd5e1]">{move.player}</span>
              {move.details && <span className="text-[#94a3b8]">{move.details}</span>}
              <span className="text-[#94a3b8] text-xs ml-auto">{formatTimeAgo(move.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
