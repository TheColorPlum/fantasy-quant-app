"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Minus, DollarSign, Shuffle } from "lucide-react"

type ActivityType = "all" | "add" | "drop" | "claim" | "trade"
type Item = {
  id: string
  type: Exclude<ActivityType, "all">
  team: string
  player: string
  position?: string
  nflTeam?: string
  ts: string
  faabSpent?: number
}

const TYPE_META: Record<Exclude<ActivityType, "all">, { color: string; label: string; icon: any }> = {
  add: { color: "#00FF85", label: "ADD", icon: Plus },
  drop: { color: "#FF3B30", label: "DROP", icon: Minus },
  claim: { color: "#EAB308", label: "CLAIM", icon: DollarSign },
  trade: { color: "#38BDF8", label: "TRADE", icon: Shuffle },
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function ActivityPage() {
  const search = useSearchParams()
  const router = useRouter()
  const initialType = (search.get("type") || "all") as ActivityType
  const [type, setType] = useState<ActivityType>(initialType)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async (t: ActivityType) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/activity?type=${encodeURIComponent(t)}&limit=80`, { cache: "no-store" })
      const json = (await res.json()) as Item[]
      setItems(json)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(type)
    const params = new URLSearchParams(Array.from(search.entries()))
    params.set("type", type)
    router.replace(`/activity?${params.toString()}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const rows = useMemo(() => items, [items])

  return (
    <div className="min-h-screen" style={{ background: "#0E0F11" }}>
      <div className="container mx-auto px-4 py-6">
        <Card className="rounded-[2px] border mb-4" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[12px] uppercase">League Activity</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={type} onValueChange={(v: string) => setType(v as ActivityType)}>
                  <SelectTrigger
                    className="h-7 rounded-[2px] border text-[12px] px-2"
                    style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#B0B6C0" }}
                  >
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent
                    className="rounded-[2px] border"
                    style={{ borderColor: "#2E2E2E", background: "#121417" }}
                  >
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="add">Add</SelectItem>
                    <SelectItem value="drop">Drop</SelectItem>
                    <SelectItem value="claim">Claim</SelectItem>
                    <SelectItem value="trade">Trade</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] uppercase" style={{ color: "#B0B6C0" }}>
                  {loading ? "Refreshing…" : "Updated"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent" style={{ borderColor: "#2E2E2E" }}>
                    <TableHead className="text-[11px] uppercase">Type</TableHead>
                    <TableHead className="text-[11px] uppercase">Team</TableHead>
                    <TableHead className="text-[11px] uppercase">Player</TableHead>
                    <TableHead className="text-right text-[11px] uppercase">FAAB</TableHead>
                    <TableHead className="text-right text-[11px] uppercase">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((it) => {
                    const meta = TYPE_META[it.type]
                    const Icon = meta.icon
                    return (
                      <TableRow key={it.id} className="hover:bg-[#121417]" style={{ borderColor: "#2E2E2E" }}>
                        <TableCell>
                          <span className="inline-flex items-center gap-2">
                            <Icon size={14} style={{ color: meta.color }} />
                            <span className="text-[10px] font-semibold uppercase" style={{ color: meta.color }}>
                              {meta.label}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{it.team}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <span className="font-mono">
                            {it.player}
                            {it.position && it.nflTeam ? ` (${it.position} – ${it.nflTeam})` : ""}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {it.faabSpent ? `$${it.faabSpent}` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono">{timeAgo(it.ts)}</TableCell>
                      </TableRow>
                    )
                  })}
                  {!loading && rows.length === 0 && (
                    <TableRow style={{ borderColor: "#2E2E2E" }}>
                      <TableCell colSpan={5} className="text-center text-sm py-6" style={{ color: "#6B7280" }}>
                        No activity found.
                      </TableCell>
                    </TableRow>
                  )}
                  {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={`s-${i}`} style={{ borderColor: "#2E2E2E" }}>
                        <TableCell colSpan={5} className="py-2 text-sm opacity-70">
                          Loading…
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
