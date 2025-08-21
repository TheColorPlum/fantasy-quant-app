"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown } from "lucide-react"
import { useRouter } from "next/navigation"

interface Player {
  id: string
  name: string
  position: string
  nflTeam: string
  value: number
  weeklyTrend: number
  projectedPoints: number
}

const mockRoster: Player[] = [
  { id: "1", name: "Josh Allen", position: "QB", nflTeam: "BUF", value: 28.5, weeklyTrend: 0.2, projectedPoints: 24.8 },
  {
    id: "2",
    name: "Christian McCaffrey",
    position: "RB",
    nflTeam: "SF",
    value: 52.1,
    weeklyTrend: 0.5,
    projectedPoints: 22.3,
  },
  {
    id: "3",
    name: "Justin Jefferson",
    position: "WR",
    nflTeam: "MIN",
    value: 48.9,
    weeklyTrend: 0.2,
    projectedPoints: 19.4,
  },
  {
    id: "4",
    name: "Travis Kelce",
    position: "TE",
    nflTeam: "KC",
    value: 32.1,
    weeklyTrend: 0.1,
    projectedPoints: 14.6,
  },
]

const hotPlayers: Array<{
  name: string
  position: string
  team: string
  rosteredPctDelta24h: number
  projNext: number
}> = [
  { name: "Nico Collins", position: "WR", team: "HOU", rosteredPctDelta24h: 14.2, projNext: 15.4 },
  { name: "Jaylen Warren", position: "RB", team: "PIT", rosteredPctDelta24h: 12.1, projNext: 12.8 },
  { name: "Tua Tagovailoa", position: "QB", team: "MIA", rosteredPctDelta24h: 11.0, projNext: 22.2 },
  { name: "Dalton Kincaid", position: "TE", team: "BUF", rosteredPctDelta24h: 10.6, projNext: 11.1 },
  { name: "Tank Dell", position: "WR", team: "HOU", rosteredPctDelta24h: 16.9, projNext: 14.3 },
  { name: "Chuba Hubbard", position: "RB", team: "CAR", rosteredPctDelta24h: 10.2, projNext: 9.7 },
]

export default function DashboardPage() {
  const router = useRouter()
  const totalValue = mockRoster.reduce((s, p) => s + p.value, 0)
  const totalProj = mockRoster.reduce((s, p) => s + p.projectedPoints, 0)

  const addToSandbox = (player: Player) => {
    router.push("/trades#sandbox")
  }

  const positionColor = (pos: string) => {
    switch (pos) {
      case "QB":
        return "#FF3B30"
      case "RB":
        return "#00FF85"
      case "WR":
        return "#38BDF8"
      case "TE":
        return "#F59E0B"
      case "K":
        return "#94A3B8"
      case "DST":
        return "#8B5CF6"
      default:
        return "#B0B6C0"
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0E0F11", color: "#B0B6C0" }}>
      <div className="py-6 space-y-3">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] uppercase">Total Value</CardTitle>
              <div className="text-[10px] opacity-60">Last updated 2m ago</div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-right">
                <div className="font-mono text-[20px] leading-tight" style={{ color: "#00FF85" }}>
                  ${totalValue.toFixed(1)}
                </div>
                <div className="font-mono text-[12px]" style={{ color: "#00FF85" }}>
                  +5.1%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] uppercase">Projected Points</CardTitle>
              <div className="text-[10px] opacity-60">Last updated 2m ago</div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-right">
                <div className="font-mono text-[20px] leading-tight">{totalProj.toFixed(1)}</div>
                <div className="font-mono text-[12px]" style={{ color: "#FF3B30" }}>
                  -1.5%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
            <CardHeader className="pb-1">
              <CardTitle className="text-[11px] uppercase">Record</CardTitle>
              <div className="text-[10px] opacity-60">Regular season</div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-right font-mono text-[20px] leading-tight" style={{ color: "#00FF85" }}>
                8-4-0
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Row: Roster + Right Column */}
        <div className="grid grid-cols-12 gap-3">
          {/* Left: Roster */}
          <div className="col-span-12 lg:col-span-7">
            <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[12px] uppercase">My Roster</CardTitle>
                <CardDescription className="text-[11px]">Current roster and projections</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <div className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent" style={{ borderColor: "#2E2E2E" }}>
                        <TableHead className="text-[11px] uppercase">Position</TableHead>
                        <TableHead className="text-[11px] uppercase">Player</TableHead>
                        <TableHead className="text-right text-[11px] uppercase">Value</TableHead>
                        <TableHead className="text-right text-[11px] uppercase">Proj</TableHead>
                        <TableHead className="text-right text-[11px] uppercase">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockRoster.map((p) => (
                        <TableRow key={p.id} className="group hover:bg-[#121417]" style={{ borderColor: "#2E2E2E" }}>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="rounded-[2px] text-[10px]"
                              style={{ borderColor: positionColor(p.position), color: positionColor(p.position) }}
                            >
                              {p.position}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{p.name}</div>
                            <div className="text-[11px] opacity-70">{p.nflTeam}</div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${p.value.toFixed(1)}{" "}
                            {p.weeklyTrend >= 0 ? (
                              <span className="text-xs" style={{ color: "#00FF85" }}>
                                +{p.weeklyTrend}%
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: "#FF3B30" }}>
                                {p.weeklyTrend}%
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono">{p.projectedPoints.toFixed(1)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addToSandbox(p)}
                              className="h-7 border rounded-[2px] text-xs opacity-0 group-hover:opacity-100 transition"
                              style={{ borderColor: "#2E2E2E", color: "#B0B6C0", background: "transparent" }}
                            >
                              Add to Sandbox
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Decision Panels */}
          <div className="col-span-12 lg:col-span-5 space-y-3">
            {/* Trade vs Waiver */}
            <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[12px] uppercase">Trade vs Waiver</CardTitle>
                  <span className="text-[10px] opacity-60">Updated 2m ago</span>
                </div>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Target WR2 upgrade</div>
                  <Badge
                    className="rounded-[2px] text-[10px]"
                    style={{
                      background: "rgba(0,255,133,0.08)",
                      color: "#00FF85",
                      borderColor: "rgba(0,255,133,0.22)",
                    }}
                    variant="outline"
                  >
                    +3.6 vs waiver
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-80">
                  <TrendingUp className="h-3.5 w-3.5" style={{ color: "#00FF85" }} /> Jefferson + Kelce stack leverage
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">Add Chuba Hubbard (RB)</div>
                  <Badge
                    className="rounded-[2px] text-[10px]"
                    style={{ background: "#0B1B2F", color: "#38BDF8", borderColor: "#1E40AF" }}
                    variant="outline"
                  >
                    +1.8 vs waiver
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-80">
                  <TrendingDown className="h-3.5 w-3.5" style={{ color: "#FF3B30" }} /> Fade low-snap WR3s
                </div>
              </CardContent>
            </Card>

            {/* Hot Players */}
            <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[12px] uppercase">Hot Players</CardTitle>
                  <span className="text-[10px] opacity-60">24h change</span>
                </div>
              </CardHeader>
              <CardContent className="p-3">
                <div className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent" style={{ borderColor: "#2E2E2E" }}>
                        <TableHead className="text-[11px] uppercase">Player</TableHead>
                        <TableHead className="text-center text-[11px] uppercase">Pos</TableHead>
                        <TableHead className="text-right text-[11px] uppercase">Rostered Δ</TableHead>
                        <TableHead className="text-right text-[11px] uppercase">Proj Next</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hotPlayers.map((hp, i) => (
                        <TableRow key={i} className="hover:bg-[#121417]" style={{ borderColor: "#2E2E2E" }}>
                          <TableCell>
                            <div className="text-sm">{hp.name}</div>
                            <div className="text-[11px] opacity-70">{hp.team}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className="rounded-[2px] text-[10px]"
                              style={{
                                borderColor:
                                  hp.position === "RB"
                                    ? "#00FF85"
                                    : hp.position === "WR"
                                      ? "#38BDF8"
                                      : hp.position === "QB"
                                        ? "#FF3B30"
                                        : "#F59E0B",
                                color:
                                  hp.position === "RB"
                                    ? "#00FF85"
                                    : hp.position === "WR"
                                      ? "#38BDF8"
                                      : hp.position === "QB"
                                        ? "#FF3B30"
                                        : "#F59E0B",
                              }}
                            >
                              {hp.position}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono" style={{ color: "#00FF85" }}>
                            +{hp.rosteredPctDelta24h.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-mono">{hp.projNext.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
