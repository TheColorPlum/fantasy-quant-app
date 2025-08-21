"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Plus, Minus, DollarSign, Shuffle, ChevronDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ActivityType = "all" | "add" | "drop" | "claim" | "trade"

type ActivityItem = {
  id: string
  type: Exclude<ActivityType, "all">
  team: string
  player: string
  position?: string
  nflTeam?: string
  ts: string
}

const TYPE_META: Record<Exclude<ActivityType, "all">, { color: string; label: string; icon: any }> = {
  add: { color: "#00FF85", label: "ADD", icon: Plus },
  drop: { color: "#FF3B30", label: "DROP", icon: Minus },
  claim: { color: "#EAB308", label: "CLAIM", icon: DollarSign },
  trade: { color: "#38BDF8", label: "TRADE", icon: Shuffle },
}

export function GlobalTicker({ defaultFilter = "all" as ActivityType }) {
  const [filter, setFilter] = useState<ActivityType>(defaultFilter)
  const [data, setData] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/activity?type=${encodeURIComponent(filter)}&limit=40`, { cache: "no-store" })
      const json = (await res.json()) as ActivityItem[]
      setData(json)
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30_000)
    return () => clearInterval(id)
  }, [filter])

  const items = useMemo(() => {
    return [...data, ...data, ...data]
  }, [data])

  return (
    <div
      role="region"
      aria-label="Global league activity"
      className="w-full border-y"
      style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}
    >
      <div className="mx-auto max-w-[1280px] flex items-center justify-between px-3" style={{ height: 30 }}>
        {/* Left controls */}
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as ActivityType)}>
            <SelectTrigger
              className="h-6 rounded-[2px] border text-[10px] uppercase px-2"
              style={{ borderColor: "#2E2E2E", background: "#121417", color: "#B0B6C0" }}
            >
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
              <SelectItem value="all" className="text-[11px] uppercase">
                All
              </SelectItem>
              <SelectItem value="add" className="text-[11px] uppercase">
                Add
              </SelectItem>
              <SelectItem value="drop" className="text-[11px] uppercase">
                Drop
              </SelectItem>
              <SelectItem value="claim" className="text-[11px] uppercase">
                Claim
              </SelectItem>
              <SelectItem value="trade" className="text-[11px] uppercase">
                Trade
              </SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[10px] uppercase" style={{ color: "#B0B6C0" }}>
            {loading ? "Refreshing…" : "Recent activity"}
          </span>
        </div>

        {/* Marquee rail */}
        <div
          className="relative flex-1 overflow-hidden mx-3"
          aria-live="polite"
          aria-busy={loading ? "true" : "false"}
          title="Recent activity ticker"
        >
          <div className="flex gap-2 whitespace-nowrap animate-[ticker_40s_linear_infinite] hover:[animation-play-state:paused]">
            {items.map((item, idx) => {
              const meta = TYPE_META[item.type]
              const Icon = meta.icon
              return (
                <span
                  key={`${item.id}-${idx}`}
                  className="inline-flex items-center gap-2 px-4 py-1"
                  style={{ color: "#B0B6C0" }}
                >
                  <span className="inline-flex items-center gap-1">
                    <Icon size={12} style={{ color: meta.color }} />
                    <span className="text-[10px] font-semibold uppercase" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                  </span>
                  <span className="text-[12px]">
                    {item.team} <span className="opacity-70">•</span>{" "}
                    <span className="font-mono">
                      {item.player}
                      {item.position && item.nflTeam ? ` (${item.position} – ${item.nflTeam})` : ""}
                    </span>
                  </span>
                </span>
              )
            })}
          </div>
          <style jsx>{`
            @keyframes ticker {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
          `}</style>
        </div>

        {/* Expand link */}
        <Link
          href={`/activity?type=${encodeURIComponent(filter)}`}
          className="inline-flex items-center gap-1 h-6 px-2 border rounded-[2px] text-[10px] uppercase hover:bg-[#121417]"
          style={{ borderColor: "#2E2E2E", color: "#B0B6C0" }}
        >
          Expand <ChevronDown size={12} />
        </Link>
      </div>
    </div>
  )
}
