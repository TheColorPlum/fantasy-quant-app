"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Search, Zap, TrendingUp, Users, Clock } from 'lucide-react'
import { useRouter } from "next/navigation"

export default function TradesPage() {
  const [selectedPosition, setSelectedPosition] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const router = useRouter()

  const handleScan = async () => {
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
        return prev + Math.random() * 15
      })
    }, 200)
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-mono text-3xl font-bold text-[#22c55e] mb-2">FIND_A_TRADE</h1>
            <p className="font-mono text-sm text-[#94a3b8]">ANALYZE_MARKET_CONDITIONS → GENERATE_OPTIMAL_TRADES</p>
          </div>

          {/* Scan Configuration */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] terminal-glow mb-8">
            <CardHeader>
              <CardTitle className="font-mono text-xl text-[#22c55e]">SCAN_PARAMETERS</CardTitle>
              <CardDescription className="font-mono text-sm text-[#94a3b8]">
                CONFIGURE_TARGET_POSITION
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="font-mono text-sm text-[#cbd5e1]">TARGET_POSITION</label>
                <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                  <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-[#cbd5e1]">
                    <SelectValue placeholder="SELECT_POSITION" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <SelectItem value="QB" className="font-mono text-[#cbd5e1]">
                      QB - QUARTERBACK
                    </SelectItem>
                    <SelectItem value="RB" className="font-mono text-[#cbd5e1]">
                      RB - RUNNING_BACK
                    </SelectItem>
                    <SelectItem value="WR" className="font-mono text-[#cbd5e1]">
                      WR - WIDE_RECEIVER
                    </SelectItem>
                    <SelectItem value="TE" className="font-mono text-[#cbd5e1]">
                      TE - TIGHT_END
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPosition && (
                <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                  <div className="font-mono text-xs text-[#94a3b8] mb-3">SCAN_WILL_ANALYZE:</div>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-3 w-3 text-[#22c55e]" />
                      <span className="text-[#cbd5e1]">Market trends for {selectedPosition} position</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-3 w-3 text-[#22c55e]" />
                      <span className="text-[#cbd5e1]">Available players across all teams</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="h-3 w-3 text-[#22c55e]" />
                      <span className="text-[#cbd5e1]">Performance projections & matchups</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-[#22c55e]" />
                      <span className="text-[#cbd5e1]">Injury reports & availability</span>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleScan}
                disabled={!selectedPosition || isScanning}
                className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-bold text-lg py-6"
              >
                {isScanning ? (
                  <>
                    <Search className="mr-2 h-5 w-5 animate-pulse" />
                    SCANNING_MARKET...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    INITIATE_SCAN
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Scanning Animation */}
          {isScanning && (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] terminal-glow">
              <CardHeader>
                <CardTitle className="font-mono text-xl text-[#22c55e]">SCANNING_PROGRESS</CardTitle>
                <CardDescription className="font-mono text-sm text-[#94a3b8]">
                  ANALYZING_MARKET_DATA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Progress value={scanProgress} className="h-3" />
                  <div className="font-mono text-sm text-center text-[#22c55e]">
                    {Math.round(scanProgress)}% COMPLETE
                  </div>
                </div>

                <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                  <div className="font-mono text-xs text-[#94a3b8] mb-3">CURRENT_OPERATION:</div>
                  <div className="space-y-2 font-mono text-xs">
                    {scanProgress > 0 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                        <span className="text-[#cbd5e1]">Fetching league rosters...</span>
                      </div>
                    )}
                    {scanProgress > 25 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                        <span className="text-[#cbd5e1]">Analyzing player performance...</span>
                      </div>
                    )}
                    {scanProgress > 50 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                        <span className="text-[#cbd5e1]">Calculating trade values...</span>
                      </div>
                    )}
                    {scanProgress > 75 && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                        <span className="text-[#cbd5e1]">Generating proposals...</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ready State */}
          {!isScanning && !selectedPosition && (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="font-mono text-xl text-[#cbd5e1]">READY_TO_SCAN</CardTitle>
                <CardDescription className="font-mono text-sm text-[#94a3b8]">
                  SELECT_POSITION_TO_BEGIN
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Search className="h-16 w-16 text-[#2a2a2a] mx-auto mb-4" />
                  <p className="font-mono text-sm text-[#94a3b8]">
                    Choose a target position to start scanning for optimal trades
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
