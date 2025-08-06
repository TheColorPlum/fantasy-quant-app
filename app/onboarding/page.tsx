"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Terminal, Loader2, CheckCircle, ArrowRight, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [leagueId, setLeagueId] = useState("")
  const [selectedTeam, setSelectedTeam] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Mock teams data - in real app this would come from ESPN API
  const mockTeams = [
    { id: "1", name: "Team Alpha", owner: "John Smith" },
    { id: "2", name: "Fantasy Legends", owner: "Sarah Johnson" },
    { id: "3", name: "Gridiron Warriors", owner: "Mike Davis" },
    { id: "4", name: "Championship Chasers", owner: "Emily Wilson" },
    { id: "5", name: "Draft Kings", owner: "Chris Brown" },
    { id: "6", name: "End Zone Elite", owner: "Jessica Taylor" },
    { id: "7", name: "Touchdown Titans", owner: "David Miller" },
    { id: "8", name: "Fantasy Phenoms", owner: "Amanda Garcia" },
  ]

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!leagueId) {
      setError("League ID is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Simulate API call to validate league
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock validation - in real app this would call ESPN API
      if (leagueId.length < 6) {
        setError("Invalid League ID format")
        setIsLoading(false)
        return
      }

      setStep(2)
    } catch (error) {
      setError("Failed to connect to league. Please check your League ID.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) {
      setError("Please select your team")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Simulate saving user preferences
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // In real app, this would save to database
      const userData = {
        leagueId,
        teamId: selectedTeam,
      }

      console.log("Saving user data:", userData)

      // Navigate to dashboard
      router.push("/dashboard")
    } catch (error) {
      setError("Failed to save preferences. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="h-6 w-6 text-[#22c55e]" />
              <span className="text-xl font-bold font-mono">TRADEUP</span>
            </div>
            <div className="font-mono text-sm text-[#94a3b8]">
              STATUS: <span className="text-[#fbbf24]">ONBOARDING</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center space-x-2 ${step >= 1 ? "text-[#22c55e]" : "text-[#94a3b8]"}`}>
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm ${
                    step >= 1 ? "border-[#22c55e] bg-[#22c55e] text-black" : "border-[#94a3b8]"
                  }`}
                >
                  {step > 1 ? <CheckCircle className="h-4 w-4" /> : "1"}
                </div>
                <span className="font-mono text-sm">LEAGUE_SETUP</span>
              </div>

              <ArrowRight className={`h-4 w-4 ${step >= 2 ? "text-[#22c55e]" : "text-[#94a3b8]"}`} />

              <div className={`flex items-center space-x-2 ${step >= 2 ? "text-[#22c55e]" : "text-[#94a3b8]"}`}>
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono text-sm ${
                    step >= 2 ? "border-[#22c55e] bg-[#22c55e] text-black" : "border-[#94a3b8]"
                  }`}
                >
                  2
                </div>
                <span className="font-mono text-sm">TEAM_SELECT</span>
              </div>
            </div>
          </div>

          {/* Step 1: League Setup */}
          {step === 1 && (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] terminal-glow">
              <CardHeader className="text-center">
                <CardTitle className="font-mono text-2xl text-[#22c55e]">CONNECT_LEAGUE</CardTitle>
                <CardDescription className="font-mono text-sm text-[#94a3b8]">STEP_1_OF_2</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStep1Submit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="leagueId" className="font-mono text-sm text-[#cbd5e1]">
                      ESPN_LEAGUE_ID
                    </Label>
                    <Input
                      id="leagueId"
                      type="text"
                      value={leagueId}
                      onChange={(e) => setLeagueId(e.target.value)}
                      placeholder="123456789"
                      className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-[#cbd5e1] placeholder:text-[#94a3b8]"
                      required
                    />
                    <p className="font-mono text-xs text-[#94a3b8]">
                      Find this in your ESPN league URL: espn.com/fantasy/football/league?leagueId=YOUR_ID
                    </p>
                  </div>

                  {error && (
                    <Alert className="bg-red-500/10 border-red-500/20">
                      <AlertDescription className="text-red-400 font-mono text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-bold text-lg py-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        CONNECTING_TO_LEAGUE...
                      </>
                    ) : (
                      "CONNECT_LEAGUE"
                    )}
                  </Button>
                </form>

                {/* Help Section */}
                <div className="mt-6 p-4 bg-[#0f0f0f] rounded border border-[#2a2a2a]">
                  <h3 className="font-mono text-sm font-bold text-[#22c55e] mb-2">HOW_TO_FIND_LEAGUE_ID:</h3>
                  <ol className="font-mono text-xs text-[#cbd5e1] space-y-1">
                    <li>1. Go to your ESPN Fantasy Football league</li>
                    <li>2. Look at the URL in your browser</li>
                    <li>3. Copy the numbers after "leagueId="</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Team Selection */}
          {step === 2 && (
            <Card className="bg-[#1a1a1a] border-[#2a2a2a] terminal-glow">
              <CardHeader className="text-center">
                <CardTitle className="font-mono text-2xl text-[#22c55e]">SELECT_TEAM</CardTitle>
                <CardDescription className="font-mono text-sm text-[#94a3b8]">STEP_2_OF_2</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStep2Submit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-mono text-sm text-[#cbd5e1]">YOUR_TEAM</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-[#cbd5e1]">
                        <SelectValue placeholder="Select your team..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {mockTeams.map((team) => (
                          <SelectItem
                            key={team.id}
                            value={team.id}
                            className="font-mono text-[#cbd5e1] focus:bg-[#2a2a2a] focus:text-[#22c55e]"
                          >
                            {team.name} ({team.owner})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <Alert className="bg-red-500/10 border-red-500/20">
                      <AlertDescription className="text-red-400 font-mono text-sm">{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-bold text-lg py-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        INITIALIZING_TERMINAL...
                      </>
                    ) : (
                      "COMPLETE_SETUP"
                    )}
                  </Button>
                </form>

                {/* Success Preview */}
                <div className="mt-6 p-4 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-[#22c55e]" />
                    <span className="font-mono text-sm font-bold text-[#22c55e]">READY_TO_LAUNCH:</span>
                  </div>
                  <ul className="font-mono text-xs text-[#cbd5e1] space-y-1">
                    <li>• AI trade analysis activated</li>
                    <li>• League data synchronized</li>
                    <li>• 5 free scans available</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
