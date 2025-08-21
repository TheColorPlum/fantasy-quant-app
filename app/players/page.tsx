"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSandboxStore } from "@/lib/sandbox-store"

type Player = {
  id: string
  name: string
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST"
  nflTeam: string
  value: number
  weeklyTrend: number
  projectedPoints: number
  owned: boolean
}

const mockAllPlayers: Player[] = [
  {
    id: "9",
    name: "Gus Edwards",
    position: "RB",
    nflTeam: "BAL",
    value: 8.2,
    weeklyTrend: -2.1,
    projectedPoints: 6.4,
    owned: false,
  },
  {
    id: "14",
    name: "Chuba Hubbard",
    position: "RB",
    nflTeam: "CAR",
    value: 11.8,
    weeklyTrend: 3.2,
    projectedPoints: 8.9,
    owned: false,
  },
  {
    id: "11",
    name: "Kendrick Bourne",
    position: "WR",
    nflTeam: "NE",
    value: 6.7,
    weeklyTrend: 0.9,
    projectedPoints: 5.8,
    owned: false,
  },
  {
    id: "1",
    name: "Josh Allen",
    position: "QB",
    nflTeam: "BUF",
    value: 28.5,
    weeklyTrend: 0.2,
    projectedPoints: 24.8,
    owned: true,
  },
  {
    id: "2",
    name: "Christian McCaffrey",
    position: "RB",
    nflTeam: "SF",
    value: 52.1,
    weeklyTrend: 0.5,
    projectedPoints: 22.3,
    owned: true,
  },
  {
    id: "4",
    name: "Travis Kelce",
    position: "TE",
    nflTeam: "KC",
    value: 32.1,
    weeklyTrend: 0.1,
    projectedPoints: 14.6,
    owned: true,
  },
]

export default function PlayersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [positionFilter, setPositionFilter] = useState<"ALL" | Player["position"]>("ALL")
  const [teamFilter, setTeamFilter] = useState<"ALL" | string>("ALL")
  const [ownershipFilter, setOwnershipFilter] = useState<"ALL" | "AVAILABLE" | "OWNED">("AVAILABLE")
  const [sortBy, setSortBy] = useState<"VALUE" | "TREND" | "PROJECTED" | "NAME">("VALUE")
  const [hotOnly, setHotOnly] = useState(false)
  const router = useRouter()
  const { addGet } = useSandboxStore()

  const filtered = useMemo(() => {
    let arr = [...mockAllPlayers]
    if (searchTerm) arr = arr.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    if (positionFilter !== "ALL") arr = arr.filter((p) => p.position === positionFilter)
    if (teamFilter !== "ALL") arr = arr.filter((p) => p.nflTeam === teamFilter)
    if (ownershipFilter !== "ALL") arr = arr.filter((p) => (ownershipFilter === "OWNED" ? p.owned : !p.owned))
    if (hotOnly) arr = arr.filter((p) => p.weeklyTrend > 0)
    arr.sort((a, b) => {
      switch (sortBy) {
        case "VALUE":
          return b.value - a.value
        case "TREND":
          return b.weeklyTrend - a.weeklyTrend
        case "PROJECTED":
          return b.projectedPoints - a.projectedPoints
        case "NAME":
          return a.name.localeCompare(b.name)
      }
    })
    return arr
  }, [searchTerm, positionFilter, teamFilter, ownershipFilter, sortBy, hotOnly])

  const positionColor = (pos: Player["position"]) => {
    switch (pos) {
      case "QB":
        return "#EF4444"
      case "RB":
        return "#22C55E"
      case "WR":
        return "#38BDF8"
      case "TE":
        return "#F59E0B"
      case "K":
        return "#94A3B8"
      case "DST":
        return "#8B5CF6"
    }
  }

  const faabSuggestion = (p: Player) => {
    const base = Math.max(1, Math.round(p.value / 2))
    const hotBoost = p.weeklyTrend > 0 ? Math.ceil(p.weeklyTrend) : 0
    return base + hotBoost
  }

  const addToSandbox = (p: Player) => {
    addGet({ id: p.id, name: p.name, position: p.position, nflTeam: p.nflTeam, value: p.value })
    router.push("/trades#sandbox")
  }

  return (
    <div className="min-h-screen" style={{ background: "#0E0F11" }}>
      <div className="container mx-auto px-4 py-6">
        <Card className="mb-4 rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#94A3B8" }} />
                <Input
                  placeholder="Search players…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#B0B6C0" }}
                />
              </div>

              <Select value={positionFilter} onValueChange={(v) => setPositionFilter(v as any)}>
                <SelectTrigger
                  className="rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#B0B6C0" }}
                >
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent
                  className="rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#121417" }}
                >
                  <SelectItem value="ALL">All Positions</SelectItem>
                  <SelectItem value="QB">QB</SelectItem>
                  <SelectItem value="RB">RB</SelectItem>
                  <SelectItem value="WR">WR</SelectItem>
                  <SelectItem value="TE">TE</SelectItem>
                </SelectContent>
              </Select>

              <Select value={teamFilter} onValueChange={(v) => setTeamFilter(v as any)}>
                <SelectTrigger
                  className="rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#B0B6C0" }}
                >
                  <SelectValue placeholder="NFL Team" />
                </SelectTrigger>
                <SelectContent
                  className="rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#121417" }}
                >
                  <SelectItem value="ALL">All Teams</SelectItem>
                  <SelectItem value="BUF">BUF</SelectItem>
                  <SelectItem value="SF">SF</SelectItem>
                  <SelectItem value="KC">KC</SelectItem>
                  <SelectItem value="MIN">MIN</SelectItem>
                  <SelectItem value="NE">NE</SelectItem>
                  <SelectItem value="CAR">CAR</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ownershipFilter} onValueChange={(v) => setOwnershipFilter(v as any)}>
                <SelectTrigger
                  className="rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#B0B6C0" }}
                >
                  <SelectValue placeholder="Ownership" />
                </SelectTrigger>
                <SelectContent
                  className="rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#121417" }}
                >
                  <SelectItem value="ALL">All Players</SelectItem>
                  <SelectItem value="AVAILABLE">Waiver Wire</SelectItem>
                  <SelectItem value="OWNED">Owned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger
                  className="rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#B0B6C0" }}
                >
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent
                  className="rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#121417" }}
                >
                  <SelectItem value="VALUE">Trade Value</SelectItem>
                  <SelectItem value="TREND">Trend</SelectItem>
                  <SelectItem value="PROJECTED">Projected</SelectItem>
                  <SelectItem value="NAME">Name</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Switch checked={hotOnly} onCheckedChange={setHotOnly} />
                <span className="text-xs uppercase" style={{ color: "#B0B6C0" }}>
                  Hot only
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
          <CardHeader>
            <CardTitle className="text-[12px] uppercase">All Players</CardTitle>
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
                    <TableHead className="text-right text-[11px] uppercase">FAAB</TableHead>
                    <TableHead className="text-right text-[11px] uppercase">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-[#1A1C1F]" style={{ borderColor: "#2E2E2E" }}>
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
                      <TableCell className="text-right font-mono">{faabSuggestion(p)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToSandbox(p)}
                          className="h-7 border rounded-[2px] text-xs"
                          style={{ borderColor: "#2E2E2E", color: "#B0B6C0", background: "transparent" }}
                        >
                          Add
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow style={{ borderColor: "#2E2E2E" }}>
                      <TableCell colSpan={6} className="text-center text-sm py-6" style={{ color: "#6B7280" }}>
                        No players match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
