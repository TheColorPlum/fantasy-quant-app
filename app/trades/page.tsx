"use client"

import React from "react"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, TrendingUp, Users, Zap, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import { TradeSandbox } from "@/components/trade-sandbox"

export default function TradesPage() {
  const [tab, setTab] = useState<"suggestions" | "sandbox">("suggestions")

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#sandbox") {
      setTab("sandbox")
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (tab === "sandbox") window.history.replaceState(null, "", "#sandbox")
      else window.history.replaceState(null, "", " ")
    }
  }, [tab])

  return (
    <div className="min-h-screen" style={{ background: "#0f0f0f", color: "#B0B6C0" }}>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-[12px] uppercase" style={{ color: "#B0B6C0" }}>
              Trades
            </h1>
            <TabsList className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
              <TabsTrigger value="suggestions" className="text-xs">
                Suggestions
              </TabsTrigger>
              <TabsTrigger value="sandbox" className="text-xs">
                Sandbox
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="suggestions" className="space-y-6">
            <SuggestionsContent />
          </TabsContent>

          <TabsContent value="sandbox">
            <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
              <CardHeader>
                <CardTitle className="text-[12px] uppercase">Trade Sandbox</CardTitle>
                <CardDescription className="text-xs">Build and evaluate hypothetical trades</CardDescription>
              </CardHeader>
              <CardContent className="p-3">
                <TradeSandbox />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SuggestionsContent() {
  const router = useRouter()
  const [selectedPosition, setSelectedPosition] = React.useState("")
  const [isScanning, setIsScanning] = React.useState(false)
  const [scanProgress, setScanProgress] = React.useState(0)

  const handleScan = async () => {
    if (!selectedPosition) return
    setIsScanning(true)
    setScanProgress(0)
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            router.push("/proposals")
          }, 400)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  return (
    <>
      <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
        <CardHeader>
          <CardTitle className="text-[12px] uppercase">Scan Parameters</CardTitle>
          <CardDescription className="text-xs">Configure target position</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-3">
          <div className="space-y-3">
            <label className="text-[12px] uppercase" style={{ color: "#B0B6C0" }}>
              Target Position
            </label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger
                className="rounded-[2px] border"
                style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#B0B6C0" }}
              >
                <SelectValue placeholder="Select Position" />
              </SelectTrigger>
              <SelectContent className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
                <SelectItem value="QB">QB - QUARTERBACK</SelectItem>
                <SelectItem value="RB">RB - RUNNING_BACK</SelectItem>
                <SelectItem value="WR">WR - WIDE_RECEIVER</SelectItem>
                <SelectItem value="TE">TE - TIGHT_END</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedPosition && (
            <div className="rounded-[2px] border p-3" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
              <div className="text-[11px] uppercase mb-2" style={{ color: "#B0B6C0" }}>
                Scan will analyze:
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp size={14} style={{ color: "#22C55E" }} /> Market trends for {selectedPosition}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} style={{ color: "#22C55E" }} /> Available players across all teams
                </div>
                <div className="flex items-center gap-2">
                  <Zap size={14} style={{ color: "#22C55E" }} /> Projections & matchups
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: "#22C55E" }} /> Injury reports
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleScan}
            disabled={!selectedPosition || isScanning}
            className="w-full h-10 rounded-[2px]"
            style={{ background: "#22C55E", color: "#000" }}
          >
            {isScanning ? (
              <>
                <Search className="mr-2 h-4 w-4 animate-pulse" />
                Scanning Market…
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Initiate Scan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isScanning && (
        <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
          <CardHeader>
            <CardTitle className="text-[12px] uppercase">Scanning Progress</CardTitle>
            <CardDescription className="text-xs">Analyzing market data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-3">
            <Progress value={scanProgress} className="h-3" />
            <div className="text-center font-mono text-sm" style={{ color: "#22C55E" }}>
              {Math.round(scanProgress)}% COMPLETE
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
