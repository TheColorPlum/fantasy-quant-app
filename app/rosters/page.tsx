"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useRouter } from "next/navigation"
import { mockTeams, mockUser } from "@/lib/dummy-data"

export default function RostersPage() {
  const router = useRouter()

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">League Rosters</h1>
              <p className="text-gray-600">Mike's Fantasy League • All Teams</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockTeams.map((team) => (
            <Card key={team.id} className={team.id === mockUser.teamId ? "ring-2 ring-blue-500" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{team.name}</span>
                  {team.id === mockUser.teamId && <Badge variant="default">Your Team</Badge>}
                </CardTitle>
                <p className="text-sm text-gray-600">{team.owner}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {team.players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {player.position}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{player.name}</div>
                          <div className="text-xs text-gray-500">{player.team}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(player.trend)}
                        <div className="text-right">
                          <div className="text-sm font-semibold">{player.value}</div>
                          <div className={`text-xs ${player.weeklyChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {player.weeklyChange >= 0 ? "+" : ""}
                            {player.weeklyChange}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
