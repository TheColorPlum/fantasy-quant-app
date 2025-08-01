"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Terminal, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LeagueSetup() {
  const [leagueId, setLeagueId] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationStatus, setValidationStatus] = useState<"idle" | "success" | "error">("idle")
  const [leagueData, setLeagueData] = useState<any>(null)
  const router = useRouter()

  const handleValidateLeague = async () => {
    if (!leagueId) return

    setIsValidating(true)
    setValidationStatus("idle")

    // Simulate API validation
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (leagueId === "123456") {
      setValidationStatus("error")
      setLeagueData(null)
    } else {
      setValidationStatus("success")
      setLeagueData({
        name: "Championship Dreams",
        season: "2024",
        teams: [
          "Team Mahomes",
          "Team Allen",
          "Team Burrow",
          "Team Herbert",
          "Team Jackson",
          "Team Hurts",
          "Team Tua",
          "Team Wilson",
          "Team Lawrence",
          "Team Murray",
          "Team Prescott",
          "Team Rodgers",
        ],
        scoring: "PPR",
        size: 12,
      })
    }

    setIsValidating(false)
  }

  const handleConnect = async () => {
    if (!selectedTeam) return

    // Simulate connection
    await new Promise((resolve) => setTimeout(resolve, 1000))
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Terminal className="h-6 w-6 text-[#22c55e]" />
              <span className="text-xl font-bold font-mono">FANTASYQUANT</span>
            </div>
            <Badge variant="outline" className="text-[#22c55e] border-[#22c55e] font-mono text-xs">
              CONNECTION_PROTOCOL
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Main Setup Card */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] terminal-glow">
            <CardHeader className="text-center">
              <CardTitle className="font-mono text-2xl text-[#22c55e]">PORTFOLIO_CONNECTION_PROTOCOL</CardTitle>
              <CardDescription className="font-mono text-sm text-[#94a3b8]">
                ESTABLISH_DATA_PIPELINE_TO_ESPN_SERVERS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* League ID Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="league-id" className="font-mono text-sm text-[#cbd5e1]">
                    ESPN_LEAGUE_IDENTIFIER
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="league-id"
                      value={leagueId}
                      onChange={(e) => setLeagueId(e.target.value)}
                      placeholder="Enter ESPN League ID (e.g., 1847392)"
                      className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm flex-1"
                    />
                    <Button
                      onClick={handleValidateLeague}
                      disabled={!leagueId || isValidating}
                      className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold px-6"
                    >
                      {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "VALIDATE"}
                    </Button>
                  </div>
                </div>

                {/* Validation Status */}
                {validationStatus === "success" && leagueData && (
                  <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-[#22c55e]" />
                      <div className="font-mono text-sm text-[#22c55e]">CONNECTION_ESTABLISHED</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                      <div className="space-y-1">
                        <div className="text-[#94a3b8]">LEAGUE_NAME</div>
                        <div className="text-[#cbd5e1]">{leagueData.name}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[#94a3b8]">SEASON</div>
                        <div className="text-[#cbd5e1]">{leagueData.season}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[#94a3b8]">SCORING_FORMAT</div>
                        <div className="text-[#cbd5e1]">{leagueData.scoring}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[#94a3b8]">PARTICIPANTS</div>
                        <div className="text-[#cbd5e1]">{leagueData.size} TEAMS</div>
                      </div>
                    </div>
                  </div>
                )}

                {validationStatus === "error" && (
                  <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-[#ef4444]" />
                      <div className="font-mono text-sm text-[#ef4444]">
                        CONNECTION_FAILED: Invalid league ID or private league detected
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Team Selection */}
              {validationStatus === "success" && leagueData && (
                <div className="space-y-4 border-t border-[#2a2a2a] pt-6">
                  <div className="space-y-2">
                    <Label className="font-mono text-sm text-[#cbd5e1]">SELECT_YOUR_PORTFOLIO</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono">
                        <SelectValue placeholder="CHOOSE_TEAM_IDENTIFIER" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {leagueData.teams.map((team: string, index: number) => (
                          <SelectItem key={index} value={team} className="font-mono">
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleConnect}
                    disabled={!selectedTeam}
                    className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-bold text-lg py-6"
                  >
                    INITIALIZE_TRADING_TERMINAL
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6 bg-[#1a1a1a] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="font-mono text-[#22c55e]">CONNECTION_REQUIREMENTS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-sm text-[#94a3b8]">
              <div className="flex items-start space-x-2">
                <div className="text-[#22c55e] mt-1">→</div>
                <div>
                  ESPN league must be set to <span className="text-[#cbd5e1]">PUBLIC</span> visibility
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="text-[#22c55e] mt-1">→</div>
                <div>
                  League ID found in ESPN URL:{" "}
                  <span className="text-[#cbd5e1]">fantasy.espn.com/football/league?leagueId=XXXXXX</span>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="text-[#22c55e] mt-1">→</div>
                <div>Private leagues require additional authentication protocols</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
