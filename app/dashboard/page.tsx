"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus, Users, Target, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { mockUser, mockTeams } from "@/lib/dummy-data"

export default function Dashboard() {
  const router = useRouter()
  const userTeam = mockTeams.find((t) => t.id === mockUser.teamId)!
  const usagePercentage = (mockUser.usageCount / mockUser.usageLimit) * 100

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fantasy Quant</h1>
              <p className="text-gray-600">Mike's Fantasy League • {userTeam.name}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Trade Proposals Used</div>
              <div className="text-lg font-semibold">
                {mockUser.usageCount} / {mockUser.usageLimit}
              </div>
              <Progress value={usagePercentage} className="w-24 mt-1" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>Generate trade proposals based on your team needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button
                    onClick={() => router.push("/trade-generator")}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                  >
                    <Zap className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold">Generate Trades</div>
                      <div className="text-sm opacity-90">Find trade partners</div>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/rosters")}
                    className="h-auto p-4 flex flex-col items-start space-y-2"
                  >
                    <Users className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold">View All Rosters</div>
                      <div className="text-sm opacity-70">League overview</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Your Team */}
            <Card>
              <CardHeader>
                <CardTitle>Your Team: {userTeam.name}</CardTitle>
                <CardDescription>Current roster and player values</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userTeam.players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{player.position}</Badge>
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-gray-500">{player.team}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(player.trend)}
                        <div className="text-right">
                          <div className="font-semibold">{player.value}</div>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Trade Proposals</span>
                      <span>
                        {mockUser.usageCount} / {mockUser.usageLimit}
                      </span>
                    </div>
                    <Progress value={usagePercentage} />
                  </div>
                  <div className="text-sm text-gray-600">
                    {mockUser.usageLimit - mockUser.usageCount} proposals remaining this week
                  </div>
                  {!mockUser.isPremium && (
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      Upgrade for Unlimited
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>League Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Teams:</span>
                  <span>{mockTeams.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Scoring:</span>
                  <span>PPR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Season:</span>
                  <span>2024</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
