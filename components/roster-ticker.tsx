"use client"

import { useState, useEffect } from "react"

interface RosterMove {
  id: string
  type: "ADD" | "DROP" | "CLAIM" | "TRADE"
  player: string
  team: string
  time: string
  details?: string
}

export function RosterTicker() {
  const [moves, setMoves] = useState<RosterMove[]>([
    { id: "1", type: "ADD", player: "Gus Edwards", team: "Team Alpha", time: "2m", details: "" },
    { id: "2", type: "DROP", player: "Samaje Perine", team: "Team Beta", time: "5m", details: "" },
    { id: "3", type: "CLAIM", player: "Jaylen Warren", team: "Team Gamma", time: "8m", details: "" },
    {
      id: "4",
      type: "TRADE",
      player: "Josh Jacobs",
      team: "Team Delta",
      time: "12m",
      details: "for Tyler Lockett + Kicker",
    },
    { id: "5", type: "ADD", player: "Roschon Johnson", team: "Team Epsilon", time: "15m", details: "" },
    { id: "6", type: "DROP", player: "Jerick McKinnon", team: "Team Zeta", time: "18m", details: "" },
    { id: "7", type: "CLAIM", player: "Tyjae Spears", team: "Team Eta", time: "22m", details: "" },
    {
      id: "8",
      type: "TRADE",
      player: "DeAndre Hopkins",
      team: "Team Theta",
      time: "25m",
      details: "for Courtland Sutton",
    },
    { id: "9", type: "ADD", player: "Justice Hill", team: "Team Iota", time: "28m", details: "" },
    { id: "10", type: "DROP", player: "Deon Jackson", team: "Team Kappa", time: "32m", details: "" },
    { id: "11", type: "CLAIM", player: "Ty Chandler", team: "Team Lambda", time: "35m", details: "" },
    {
      id: "12",
      type: "TRADE",
      player: "Amari Cooper",
      team: "Team Mu",
      time: "38m",
      details: "for DJ Moore + Draft Pick",
    },
  ])

  const [isPaused, setIsPaused] = useState(false)

  // Add new moves periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        const newMove: RosterMove = {
          id: Date.now().toString(),
          type: ["ADD", "DROP", "CLAIM", "TRADE"][Math.floor(Math.random() * 4)] as RosterMove["type"],
          player: ["Zach Charbonnet", "Tank Dell", "Rashee Rice", "Jerome Ford", "Elijah Mitchell"][
            Math.floor(Math.random() * 5)
          ],
          team: ["Team Alpha", "Team Beta", "Team Gamma", "Team Delta", "Team Epsilon", "Team Zeta"][
            Math.floor(Math.random() * 6)
          ],
          time: "1m",
          details: Math.random() > 0.7 ? "for Mike Evans" : "",
        }

        setMoves((prev) => [newMove, ...prev.slice(0, 11)])
      }
    }, 15000)

    return () => clearInterval(interval)
  }, [isPaused])

  const getMoveColor = (type: RosterMove["type"]) => {
    switch (type) {
      case "ADD":
        return "text-[#22c55e]"
      case "DROP":
        return "text-[#ef4444]"
      case "CLAIM":
        return "text-[#3b82f6]"
      case "TRADE":
        return "text-[#f59e0b]"
      default:
        return "text-[#cbd5e1]"
    }
  }

  // Duplicate moves for seamless scrolling
  const duplicatedMoves = [...moves, ...moves]

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a2a] bg-[#0f0f0f]">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></div>
          <span className="font-mono text-xs text-[#22c55e] font-semibold">LIVE_ROSTER_MOVES</span>
        </div>
        <div className="font-mono text-xs text-[#94a3b8]">{isPaused ? "PAUSED" : "LIVE"}</div>
      </div>

      {/* Ticker Content */}
      <div className="relative h-16 overflow-hidden">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-[#1a1a1a] to-transparent z-10"></div>
        <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-[#1a1a1a] to-transparent z-10"></div>

        {/* Scrolling content */}
        <div
          className="flex items-center h-full whitespace-nowrap animate-ticker"
          style={{
            animationPlayState: isPaused ? "paused" : "running",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {duplicatedMoves.map((move, index) => (
            <div key={`${move.id}-${index}`} className="flex items-center flex-shrink-0">
              <div className="flex items-center space-x-2 px-4">
                <span className={`font-mono text-sm font-semibold ${getMoveColor(move.type)}`}>{move.type}</span>
                <span className="font-mono text-sm text-[#cbd5e1]">{move.player}</span>
                <span className="font-mono text-xs text-[#94a3b8]">by {move.team}</span>
                {move.details && <span className="font-mono text-xs text-[#94a3b8]">{move.details}</span>}
                <span className="font-mono text-xs text-[#94a3b8]">{move.time} ago</span>
              </div>
              <div className="text-[#94a3b8] mx-2">●</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
