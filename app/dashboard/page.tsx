"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth-guard"
import { RosterTicker } from "@/components/roster-ticker"
import { TrendingUp, Users, Target, BarChart3, Clock, Trophy, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"

interface UserProfile {
  id: string
  email: string
  name: string
  isPremium: boolean
  scansRemaining: number
}

interface Analytics {
  totalAnalyses: number
  avgConfidence: number
  topPartners: string[]
  recentAnalyses: Array<{
    id: string
    partner: string
    confidence: number
    createdAt: string
  }>
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile")
        const data = await response.json()

        if (data.success) {
          setUser(data.user)
          setAnalytics(data.analytics)
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-slate-100">
        {/* Header */}
        <div className="border-b border-gray-800 bg-gray-900/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-400" />
                <div>
                  <h1 className="text-2xl font-bold text-green-400 font-mono">TRADEUP</h1>
                  <p className="text-xs text-slate-400">TRADING_TERMINAL_v2.1</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-300">Welcome back, {user?.name}</p>
                  <p className="text-xs text-slate-400">
                    SCANS_LEFT: <span className="text-green-400">{user?.scansRemaining || 0}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-slate-300 hover:bg-gray-800 bg-transparent"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" })
                    window.location.href = "/auth/login"
                  }}
                >
                  LOGOUT
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <RosterTicker />

        <div className="container mx-auto px-4 py-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-900 border-gray-800 hover:border-green-400/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-400" />
                  <CardTitle className="text-slate-100 text-lg">FIND_TRADES</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">Discover optimal trade opportunities using AI analysis</p>
                <Link href="/proposals">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-black font-semibold">
                    <Zap className="mr-2 h-4 w-4" />
                    EXECUTE_SCAN
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:border-blue-400/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <CardTitle className="text-slate-100 text-lg">ALL_PLAYERS</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">Browse complete player database with advanced filtering</p>
                <Link href="/players">
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 text-slate-300 hover:bg-gray-800 bg-transparent"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    VIEW_DATABASE
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800 hover:border-purple-400/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-400" />
                  <CardTitle className="text-slate-100 text-lg">YOUR_TEAM</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400 text-sm mb-4">Manage rosters and view team analytics</p>
                <Link href="/rosters">
                  <Button
                    variant="outline"
                    className="w-full border-gray-700 text-slate-300 hover:bg-gray-800 bg-transparent"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    VIEW_ROSTERS
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Dashboard */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trade Statistics */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-400" />
                    TRADE_ANALYTICS
                  </CardTitle>
                  <CardDescription className="text-slate-400">Your trading performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-green-400">{analytics.totalAnalyses}</p>
                      <p className="text-xs text-slate-400">TOTAL_SCANS</p>
                    </div>
                    <div className="text-center p-3 bg-gray-800 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">{analytics.avgConfidence}%</p>
                      <p className="text-xs text-slate-400">AVG_CONFIDENCE</p>
                    </div>
                  </div>

                  {analytics.topPartners.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-300 mb-2">TOP_PARTNERS:</p>
                      <div className="flex flex-wrap gap-2">
                        {analytics.topPartners.map((partner, index) => (
                          <Badge key={index} variant="outline" className="border-gray-700 text-slate-300">
                            {partner}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-400" />
                    RECENT_ACTIVITY
                  </CardTitle>
                  <CardDescription className="text-slate-400">Your latest trade analyses</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.recentAnalyses.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.recentAnalyses.map((analysis) => (
                        <div key={analysis.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                          <div>
                            <p className="text-sm text-slate-300 font-medium">{analysis.partner}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(analysis.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-green-400 font-semibold">{analysis.confidence}%</p>
                            <p className="text-xs text-slate-400">CONFIDENCE</p>
                          </div>
                        </div>
                      ))}
                      <Link href="/proposals">
                        <Button variant="ghost" className="w-full text-slate-400 hover:text-slate-300">
                          View All Analyses
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-4">No trade analyses yet</p>
                      <Link href="/proposals">
                        <Button className="bg-green-600 hover:bg-green-700 text-black font-semibold">
                          Run Your First Scan
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
