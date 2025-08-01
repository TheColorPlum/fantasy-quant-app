"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { mockTeams } from "@/lib/dummy-data"

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

    // Mock validation - simulate API call
    setTimeout(() => {
      if (leagueId === "123456" || leagueId.length >= 6) {
        setValidationStatus("success")
        setLeagueData({
          name: "Mike's Fantasy League",
          teams: mockTeams,
          season: 2024,
          scoring: "PPR",
        })
      } else {
        setValidationStatus("error")
      }
      setIsValidating(false)
    }, 1500)
  }

  const handleConnect = () => {
    if (selectedTeam) {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connect Your ESPN League</h1>
          <p className="text-gray-600">Link your league to Fantasy Quant for intelligent roster management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>League Connection</CardTitle>
            <CardDescription>Find your league ID in your ESPN fantasy football league URL</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="league-id">ESPN League ID</Label>
              <div className="flex space-x-2">
                <Input
                  id="league-id"
                  placeholder="e.g., 123456789"
                  value={leagueId}
                  onChange={(e) => {
                    setLeagueId(e.target.value)
                    setValidationStatus("idle")
                    setLeagueData(null)
                  }}
                />
                <Button onClick={handleValidateLeague} disabled={!leagueId || isValidating} variant="outline">
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Validate"}
                </Button>
              </div>
              <p className="text-sm text-gray-500">Your league must be public or you must be logged into ESPN</p>
            </div>

            {validationStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Could not find league with that ID. Make sure your league is public or try logging into ESPN first.
                </AlertDescription>
              </Alert>
            )}

            {validationStatus === "success" && leagueData && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully connected to "{leagueData.name}" - {leagueData.season} {leagueData.scoring} League
                </AlertDescription>
              </Alert>
            )}

            {leagueData && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-select">Select Your Team</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your team from the league" />
                    </SelectTrigger>
                    <SelectContent>
                      {leagueData.teams.map((team: any) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name} ({team.owner})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleConnect} disabled={!selectedTeam} className="w-full">
                  Connect League & Continue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help finding your league ID?</p>
          <p>Go to your league page on ESPN and copy the number from the URL</p>
        </div>
      </div>
    </div>
  )
}
