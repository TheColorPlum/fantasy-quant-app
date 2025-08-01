"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Terminal, TrendingUp, Zap, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function TradeGenerator() {
  const [selectedPosition, setSelectedPosition] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const router = useRouter()

  const handleExecuteScan = async () => {
    if (!selectedPosition) return

    setIsScanning(true)
    setScanProgress(0)

    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            router.push("/proposals")
          }, 500)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Terminal className="h-6 w-6 text-[#22c55e]" />
                <span className="text-xl font-bold font-mono">FANTASYQUANT</span>
              </Link>
              <Badge variant="outline" className="text-[#22c55e] border-[#22c55e] font-mono text-xs">
                ARBITRAGE_DETECTION_ENGINE
              </Badge>
            </div>

            <div className="flex items-center space-x-6">
              <div className="font-mono text-sm text-[#94a3b8]">
                PROPOSALS_REMAINING: <span className="text-[#f59e0b] font-semibold">3/5</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-black bg-transparent"
              >
                UPGRADE_ACCOUNT
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Main Scanner Interface */}
          <Card className="mb-8 bg-[#1a1a1a] border-[#2a2a2a] terminal-glow">
            <CardHeader className="text-center">
              <CardTitle className="font-mono text-2xl text-[#22c55e] flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6" />
                ARBITRAGE_DETECTION_ENGINE
              </CardTitle>
              <CardDescription className="font-mono text-sm text-[#94a3b8]">
                INITIALIZE_MARKET_INEFFICIENCY_SCAN
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isScanning ? (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="font-mono text-sm text-[#cbd5e1]">TARGET_POSITION_CLASS</label>
                      <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                        <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono">
                          <SelectValue placeholder="SELECT_ASSET_CLASS" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                          <SelectItem value="QB" className="font-mono">
                            QB - QUARTERBACK_ASSETS
                          </SelectItem>
                          <SelectItem value="RB" className="font-mono">
                            RB - RUNNING_BACK_SECURITIES
                          </SelectItem>
                          <SelectItem value="WR" className="font-mono">
                            WR - WIDE_RECEIVER_COMMODITIES
                          </SelectItem>
                          <SelectItem value="TE" className="font-mono">
                            TE - TIGHT_END_DERIVATIVES
                          </SelectItem>
                          <SelectItem value="FLEX" className="font-mono">
                            FLEX - DIVERSIFIED_PORTFOLIO
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4 space-y-2">
                      <div className="font-mono text-xs text-[#94a3b8] mb-2">SCAN_PARAMETERS:</div>
                      <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#94a3b8]">COUNTERPARTIES:</span>
                          <span className="text-[#22c55e]">11</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#94a3b8]">CONFIDENCE_MIN:</span>
                          <span className="text-[#22c55e]">75%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#94a3b8]">VALUE_TOLERANCE:</span>
                          <span className="text-[#22c55e]">±10%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#94a3b8]">MAX_POSITIONS:</span>
                          <span className="text-[#22c55e]">3</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleExecuteScan}
                    disabled={!selectedPosition}
                    className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-bold text-lg py-6"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    EXECUTE_ARBITRAGE_SCAN
                  </Button>
                </>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="space-y-2">
                    <div className="font-mono text-lg text-[#22c55e]">SCANNING_MARKET_INEFFICIENCIES...</div>
                    <div className="font-mono text-sm text-[#94a3b8]">
                      ANALYZING_{selectedPosition}_ARBITRAGE_OPPORTUNITIES
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Progress value={scanProgress} className="h-3 bg-[#2a2a2a]" />
                    <div className="font-mono text-xs text-[#94a3b8]">PROGRESS: {scanProgress}% COMPLETE</div>
                  </div>

                  <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                    <div className="font-mono text-xs text-[#94a3b8] space-y-1">
                      <div>→ FETCHING_PORTFOLIO_DATA...</div>
                      <div>→ CALCULATING_CORRELATION_MATRIX...</div>
                      <div>→ IDENTIFYING_VALUE_DISCREPANCIES...</div>
                      <div>→ GENERATING_TRADE_PROPOSALS...</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Warning */}
          <Card className="bg-[#1a1a1a] border-[#f59e0b]/20">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />
                <div className="flex-1">
                  <div className="font-mono text-sm text-[#f59e0b]">ACCOUNT_LIMITATION_WARNING</div>
                  <div className="font-mono text-xs text-[#94a3b8] mt-1">
                    Free tier accounts limited to 5 scans per week.
                    <span className="text-[#f59e0b]"> 3 scans remaining.</span>
                  </div>
                </div>
                <Button size="sm" className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-mono font-semibold">
                  UPGRADE
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Settings Teaser */}
          <Card className="mt-6 bg-[#1a1a1a] border-[#2a2a2a] opacity-60">
            <CardHeader>
              <CardTitle className="font-mono text-[#94a3b8] flex items-center justify-between">
                ADVANCED_PARAMETERS
                <Badge className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20 font-mono text-xs">
                  PREMIUM_ONLY
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 opacity-50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs text-[#94a3b8]">VOLATILITY_WEIGHT</label>
                  <div className="h-9 bg-[#0f0f0f] border border-[#2a2a2a] rounded-md"></div>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs text-[#94a3b8]">CORRELATION_THRESHOLD</label>
                  <div className="h-9 bg-[#0f0f0f] border border-[#2a2a2a] rounded-md"></div>
                </div>
              </div>
              <div className="font-mono text-xs text-[#94a3b8] text-center pt-2">
                Unlock advanced quantitative controls with premium subscription
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
