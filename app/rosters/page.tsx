"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { mockLeagueData } from "@/lib/dummy-data"
import { useSandboxStore } from "@/lib/sandbox-store"

type Player = {
  id?: string
  name: string
  position: "QB" | "RB" | "WR" | "TE"
  nflTeam?: string
  value: number
  weeklyTrend: number
  projectedPoints: number
}

export default function RostersPage() {
  // Build teams from central mock
  const teams = mockLeagueData.teams
  const myIndex = 0
  const [oppIndex, setOppIndex] = useState(1)
  const router = useRouter()
  const { addGive, addGet } = useSandboxStore()

  const myRoster = teams[myIndex]?.roster ?? []
  const oppRoster = teams[oppIndex]?.roster ?? []

  const sum = (arr: Player[], key: keyof Player) => arr.reduce((acc, p) => acc + (p[key] as number), 0)

  const positionColor = (pos: Player["position"]) => {
    switch (pos) {
      case "QB":
        return "#EF4444"
      case "RB":
        return "#22C55E"
      case "WR":
        return "#3B82F6"
      case "TE":
        return "#F59E0B"
    }
  }

  const addToSandbox = (player: Player, side: "give" | "get") => {
    const p = {
      id: player.id ?? player.name,
      name: player.name,
      position: player.position,
      nflTeam: player.nflTeam ?? "",
      value: player.value,
    }
    side === "give" ? addGive(p) : addGet(p)
    router.push("/trades#sandbox")
  }

  const RosterTable = ({ title, players, side }: { title: string; players: Player[]; side: "give" | "get" }) => (
    <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
      <CardHeader>
        <CardTitle className="text-[12px] uppercase">{title}</CardTitle>
        <CardDescription className="text-xs">
          Value ${sum(players, "value").toFixed(1)} • Proj {sum(players, "projectedPoints").toFixed(1)}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        <div className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ borderColor: "#2E2E2E" }}>
                <TableHead className="text-[11px] uppercase">Pos</TableHead>
                <TableHead className="text-[11px] uppercase">Player</TableHead>
                <TableHead className="text-right text-[11px] uppercase">Value</TableHead>
                <TableHead className="text-right text-[11px] uppercase">Proj</TableHead>
                <TableHead className="text-right text-[11px] uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p) => (
                <TableRow key={p.id ?? p.name} className="group hover:bg-[#1A1C1F]" style={{ borderColor: "#2E2E2E" }}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="rounded-[2px] text-[10px]"
                      style={{ borderColor: positionColor(p.position), color: positionColor(p.position) }}
                    >
                      {p.position}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="text-sm" style={{ color: "#B0B6C0" }}>
                      {p.name}
                    </div>
                    <div className="text-[11px] opacity-70">{p.nflTeam}</div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${p.value.toFixed(1)}{" "}
                    <span className="text-xs" style={{ color: p.weeklyTrend >= 0 ? "#22C55E" : "#EF4444" }}>
                      {p.weeklyTrend >= 0 ? "+" : ""}
                      {p.weeklyTrend}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">{p.projectedPoints.toFixed(1)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToSandbox(p, side)}
                      className="h-7 border rounded-[2px] text-xs opacity-0 group-hover:opacity-100 transition"
                      style={{ borderColor: "#2E2E2E", color: "#B0B6C0", background: "transparent" }}
                    >
                      Add to Sandbox
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {players.length === 0 && (
                <TableRow style={{ borderColor: "#2E2E2E" }}>
                  <TableCell colSpan={5} className="text-center text-sm py-6" style={{ color: "#6B7280" }}>
                    No roster data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  const OpponentPicker = () => (
    <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-[12px] uppercase">Opponent</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <Select value={String(oppIndex)} onValueChange={(v) => setOppIndex(Number(v))}>
          <SelectTrigger
            className="max-w-md rounded-[2px] border"
            style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#B0B6C0" }}
          >
            <SelectValue placeholder="Select opponent" />
          </SelectTrigger>
          <SelectContent className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
            {teams
              .map((t, idx) => ({ ...t, idx }))
              .filter((t) => t.idx !== myIndex)
              .map((t) => (
                <SelectItem key={t.idx} value={String(t.idx)}>
                  {t.name} {t.record ? `(${t.record})` : ""}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen" style={{ background: "#0E0F11" }}>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <RosterTable title="My Roster" players={myRoster as any} side="give" />
          </div>

          <div className="lg:col-span-6 space-y-4">
            <OpponentPicker />
            <RosterTable title="Opponent Roster" players={oppRoster as any} side="get" />
          </div>
        </div>
      </div>
    </div>
  )
}
