"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Terminal, Users, Zap } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleAccessTerminal = async () => {
    setIsLoading(true)
    // Simulate authentication
    await new Promise((resolve) => setTimeout(resolve, 1500))
    router.push("/dashboard")
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
              <Badge variant="outline" className="text-[#22c55e] border-[#22c55e] font-mono text-xs">
                v2.1.4
              </Badge>
            </div>
            <div className="font-mono text-sm text-[#94a3b8]">
              MARKET_STATUS: <span className="text-[#22c55e]">ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 font-mono">
              FANTASY_ANALYTICS
            </Badge>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-[#cbd5e1] bg-clip-text text-transparent">
              This is your (fantasy) quant!
            </h1>
            <p className="text-xl text-[#cbd5e1] mb-8 max-w-2xl mx-auto">
              Find winning trades in your fantasy football league. We analyze every team to spot opportunities others
              miss and help you craft trades that actually get accepted.
            </p>
          </div>

          {/* Terminal Access */}
          <Card className="max-w-md mx-auto bg-[#1a1a1a] border-[#2a2a2a] terminal-glow">
            <CardHeader className="text-center">
              <CardTitle className="font-mono text-[#22c55e]">ACCESS_TERMINAL</CardTitle>
              <CardDescription className="text-[#94a3b8] font-mono text-sm">START_TRADING_SESSION</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#2a2a2a]">
                  <TabsTrigger value="login" className="font-mono text-xs text-[#cbd5e1]">
                    LOGIN
                  </TabsTrigger>
                  <TabsTrigger value="register" className="font-mono text-xs text-[#cbd5e1]">
                    REGISTER
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-mono text-xs text-[#cbd5e1]">
                      EMAIL
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="trader@tradeup.com"
                      className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-mono text-xs text-[#cbd5e1]">
                      PASSWORD
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]"
                    />
                  </div>
                  <Button
                    onClick={handleAccessTerminal}
                    disabled={isLoading}
                    className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold"
                  >
                    {isLoading ? "CONNECTING..." : "START_TRADING"}
                  </Button>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="font-mono text-xs text-[#cbd5e1]">
                      EMAIL
                    </Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="trader@tradeup.com"
                      className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="font-mono text-xs text-[#cbd5e1]">
                      PASSWORD
                    </Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]"
                    />
                  </div>
                  <Button
                    onClick={handleAccessTerminal}
                    disabled={isLoading}
                    className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold"
                  >
                    {isLoading ? "CREATING..." : "CREATE_ACCOUNT"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 border-t border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 font-mono text-[#22c55e]">CORE_CAPABILITIES</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-[#22c55e] mb-2" />
                <CardTitle className="font-mono text-lg text-[#cbd5e1]">SMART_TRADE_FINDER</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#cbd5e1] text-sm">
                  Scan all teams to find trades that work for everyone. We analyze team needs, player values, and recent
                  performance to spot opportunities others miss.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <Users className="h-8 w-8 text-[#22c55e] mb-2" />
                <CardTitle className="font-mono text-lg text-[#cbd5e1]">CONTEXT_INTELLIGENCE</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#cbd5e1] text-sm">
                  Understand why trades work and how to pitch them. Get insights into team situations, recent moves, and
                  the best timing to maximize acceptance rates.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <Zap className="h-8 w-8 text-[#22c55e] mb-2" />
                <CardTitle className="font-mono text-lg text-[#cbd5e1]">MESSAGE_GENERATOR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#cbd5e1] text-sm">
                  Get personalized trade messages that reference team situations and needs. No more generic proposals -
                  craft compelling pitches that get results.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] bg-[#1a1a1a] py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm text-[#94a3b8]">© 2024 TradeUp. Smart fantasy trading.</div>
            <div className="font-mono text-sm text-[#94a3b8]">
              UPTIME: <span className="text-[#22c55e]">99.97%</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
