"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Check, AlertCircle } from "lucide-react"
import { useSandboxStore, type SandboxPlayer } from "@/lib/sandbox-store"

type Player = SandboxPlayer & { weeklyTrend?: number; projectedPoints?: number }

const fallbackPlayers: Player[] = [
  { id: "1", name: "Josh Allen", position: "QB", nflTeam: "BUF", value: 28.5 },
  { id: "2", name: "Christian McCaffrey", position: "RB", nflTeam: "SF", value: 52.1 },
  { id: "3", name: "Justin Jefferson", position: "WR", nflTeam: "MIN", value: 48.9 },
  { id: "4", name: "Travis Kelce", position: "TE", nflTeam: "KC", value: 32.1 },
  { id: "14", name: "Chuba Hubbard", position: "RB", nflTeam: "CAR", value: 11.8 },
  { id: "11", name: "Kendrick Bourne", position: "WR", nflTeam: "NE", value: 6.7 },
]

function posColor(pos: Player["position"]) {
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
  }
}

export function TradeSandbox() {
  const { give, get, addGive, addGet, remove, reset } = useSandboxStore()
  const [pickerOpen, setPickerOpen] = useState<null | "give" | "get">(null)
  const [search, setSearch] = useState("")
  const [result, setResult] = useState<null | { deltaYou: number; deltaOpp: number; details?: any }>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const filtered = useMemo(
    () => fallbackPlayers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [search],
  )

  const onPick = (p: Player) => {
    if (pickerOpen === "give") addGive(p)
    if (pickerOpen === "get") addGet(p)
    setPickerOpen(null)
    setSearch("")
  }

  const evaluate = async () => {
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const body = { youGive: give.map((p) => p.id), youGet: get.map((p) => p.id) }
      const res = await fetch("/api/trade/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to evaluate trade")
      const json = (await res.json()) as { deltaYou: number; deltaOpp: number; details?: any }
      setResult(json)
    } catch (e: any) {
      setError(e?.message || "Failed to evaluate trade")
    } finally {
      setLoading(false)
    }
  }

  const sum = (arr: Player[]) => arr.reduce((acc, p) => acc + p.value, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* You Give */}
      <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-[12px] uppercase" style={{ color: "#B0B6C0" }}>
            You Give
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          <div className="space-y-2">
            {give.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-2 py-2 rounded-[2px] border"
                style={{ borderColor: "#2E2E2E", background: "#121417" }}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-[2px] text-[10px]"
                    style={{ borderColor: posColor(p.position), color: posColor(p.position) }}
                  >
                    {p.position}
                  </Badge>
                  <div className="text-sm" style={{ color: "#B0B6C0" }}>
                    {p.name}
                  </div>
                  <div className="text-xs opacity-70">{p.nflTeam}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm">${p.value.toFixed(1)}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => remove("give", p.id)}
                    className="h-7 rounded-[2px]"
                    style={{ borderColor: "#2E2E2E", background: "transparent", color: "#B0B6C0" }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
            {give.length === 0 && (
              <div className="text-center text-sm py-6" style={{ color: "#6B7280" }}>
                No players added.
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setPickerOpen("give")}
            className="w-full h-8 rounded-[2px]"
            style={{ borderColor: "#2E2E2E", color: "#B0B6C0", background: "transparent" }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Player
          </Button>
          <div className="text-right text-xs">
            <span className="opacity-70">Total: </span>
            <span className="font-mono">${sum(give).toFixed(1)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions / Result */}
      <div className="space-y-3">
        <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[12px] uppercase" style={{ color: "#B0B6C0" }}>
              Evaluate
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            <Button
              onClick={evaluate}
              disabled={give.length === 0 || get.length === 0 || loading}
              className="w-full h-9 rounded-[2px]"
              style={{ background: "#00FF85", color: "#000" }}
            >
              {loading ? "Evaluating…" : "Evaluate Trade"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                reset()
                setResult(null)
                setError("")
              }}
              disabled={loading}
              className="w-full h-9 rounded-[2px] bg-transparent"
              style={{ borderColor: "#2E2E2E", color: "#B0B6C0", background: "transparent" }}
            >
              Reset
            </Button>

            {error && (
              <div
                className="flex items-center gap-2 px-2 py-2 rounded-[2px] border"
                style={{ borderColor: "#FF3B30", background: "rgba(255,59,48,0.1)", color: "#FF3B30" }}
              >
                <AlertCircle size={14} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {result && (
              <div className="space-y-2">
                <div className="text-[11px] uppercase opacity-70">Results</div>
                <div
                  className="flex items-center justify-between px-2 py-2 rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#121417" }}
                >
                  <div className="text-xs">Δ You</div>
                  <div
                    className="font-mono"
                    style={{ color: result.deltaYou > 0 ? "#00FF85" : result.deltaYou < 0 ? "#FF3B30" : "#B0B6C0" }}
                  >
                    {result.deltaYou > 0 ? "+" : ""}
                    {result.deltaYou.toFixed(1)}
                  </div>
                </div>
                <div
                  className="flex items-center justify-between px-2 py-2 rounded-[2px] border"
                  style={{ borderColor: "#2E2E2E", background: "#121417" }}
                >
                  <div className="text-xs">Δ Opp</div>
                  <div
                    className="font-mono"
                    style={{ color: result.deltaOpp > 0 ? "#00FF85" : result.deltaOpp < 0 ? "#FF3B30" : "#B0B6C0" }}
                  >
                    {result.deltaOpp > 0 ? "+" : ""}
                    {result.deltaOpp.toFixed(1)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* You Get */}
      <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-[12px] uppercase" style={{ color: "#B0B6C0" }}>
            You Get
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          <div className="space-y-2">
            {get.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-2 py-2 rounded-[2px] border"
                style={{ borderColor: "#2E2E2E", background: "#121417" }}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-[2px] text-[10px]"
                    style={{ borderColor: posColor(p.position), color: posColor(p.position) }}
                  >
                    {p.position}
                  </Badge>
                  <div className="text-sm" style={{ color: "#B0B6C0" }}>
                    {p.name}
                  </div>
                  <div className="text-xs opacity-70">{p.nflTeam}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm">${p.value.toFixed(1)}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => remove("get", p.id)}
                    className="h-7 rounded-[2px]"
                    style={{ borderColor: "#2E2E2E", background: "transparent", color: "#B0B6C0" }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
            {get.length === 0 && (
              <div className="text-center text-sm py-6" style={{ color: "#6B7280" }}>
                No players added.
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setPickerOpen("get")}
            className="w-full h-8 rounded-[2px]"
            style={{ borderColor: "#2E2E2E", color: "#B0B6C0", background: "transparent" }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Player
          </Button>
          <div className="text-right text-xs">
            <span className="opacity-70">Total: </span>
            <span className="font-mono">${sum(get).toFixed(1)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Picker Modal */}
      <Dialog open={!!pickerOpen} onOpenChange={() => setPickerOpen(null)}>
        <DialogContent
          className="max-w-3xl rounded-[2px] border"
          style={{ borderColor: "#2E2E2E", background: "#121417", color: "#B0B6C0" }}
        >
          <DialogHeader>
            <DialogTitle className="text-[12px] uppercase">Select Player</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search players…"
              className="rounded-[2px] border"
              style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#B0B6C0" }}
            />
            <div className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent" style={{ borderColor: "#2E2E2E" }}>
                    <TableHead className="text-[11px] uppercase">Pos</TableHead>
                    <TableHead className="text-[11px] uppercase">Player</TableHead>
                    <TableHead className="text-right text-[11px] uppercase">Value</TableHead>
                    <TableHead className="text-right text-[11px] uppercase">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-[#121417]" style={{ borderColor: "#2E2E2E" }}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="rounded-[2px] text-[10px]"
                          style={{ borderColor: posColor(p.position), color: posColor(p.position) }}
                        >
                          {p.position}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">{p.name}</div>
                        <div className="text-[11px] opacity-70">{p.nflTeam}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono">${p.value.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => onPick(p)}
                          className="h-7 rounded-[2px]"
                          style={{ background: "#00FF85", color: "#000" }}
                        >
                          <Check size={14} className="mr-1" />
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow style={{ borderColor: "#2E2E2E" }}>
                      <TableCell colSpan={4} className="text-center text-sm py-6 opacity-70">
                        No players match your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
