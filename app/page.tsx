"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Terminal, Users, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LandingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const tryDemo = async () => {
    localStorage.setItem("demo", "true")
    setIsLoading(true)
    // simulate quick handoff then route
    setTimeout(() => router.push("/dashboard?demo=1"), 600)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        router.push("/dashboard")
      } else {
        // Handle login error
        console.error("Login failed:", data.error)
      }
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0f0f0f", color: "white" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "#2E2E2E", background: "#1a1a1a" }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-6 w-6" style={{ color: "#22C55E" }} />
              <span className="text-xl font-bold font-mono">TRADEUP</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] uppercase rounded-[2px]"
                style={{ color: "#22C55E", borderColor: "#22C55E" }}
              >
                v2.1.4
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="font-mono text-sm" style={{ color: "#B0B6C0" }}>
                LOGIN
              </Link>
              <Link
                href="/signup"
                className="font-mono text-sm px-3 py-1 rounded-[2px]"
                style={{ background: "#22C55E", color: "#000" }}
              >
                SIGN UP FREE
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-[#cbd5e1] bg-clip-text text-transparent">
          This is your (fantasy) quant!
        </h1>
        <p className="text-xl text-[#cbd5e1] mb-8 max-w-2xl mx-auto">
          Find winning trades across your league. Scan, evaluate, and send proposals that get accepted.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup">
            <Button className="h-11 px-8 rounded-[2px]" style={{ background: "#22C55E", color: "#000" }}>
              Sign Up Free
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={tryDemo}
            disabled={isLoading}
            className="h-11 px-8 rounded-[2px] bg-transparent"
            style={{ borderColor: "#22C55E", color: "#22C55E", background: "transparent" }}
          >
            {isLoading ? "Loading…" : "Try Demo"}
          </Button>
        </div>
      </section>

      {/* Quick Login for Existing Users */}
      <Card className="max-w-md mx-auto bg-[#1a1a1a] border-[#2a2a2a] terminal-glow">
        <CardHeader className="text-center">
          <CardTitle className="font-mono text-[#22c55e]">QUICK_LOGIN</CardTitle>
          <CardDescription className="text-[#94a3b8] font-mono text-sm">EXISTING_USERS</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-mono text-xs text-[#cbd5e1]">
                EMAIL
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold"
            >
              {isLoading ? "CONNECTING..." : "ACCESS_TERMINAL"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-[#94a3b8] text-sm font-mono">
              NEW_USER?{" "}
              <Link href="/signup" className="text-[#22c55e] hover:text-[#16a34a]">
                CREATE_ACCOUNT
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Combined How It Works & Features */}
      <section className="container mx-auto px-4 py-16 border-t border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 font-mono text-[#22c55e]">HOW_IT_WORKS</h2>

          {/* Process Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-[#22c55e] text-black rounded-full flex items-center justify-center font-mono font-bold text-sm">
                    1
                  </div>
                  <CardTitle className="font-mono text-lg text-[#cbd5e1]">CONNECT_LEAGUE</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[#cbd5e1] text-sm">
                  Link your ESPN fantasy league and select your team. We'll analyze all rosters and recent activity to
                  understand your league's dynamics.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-[#22c55e] text-black rounded-full flex items-center justify-center font-mono font-bold text-sm">
                    2
                  </div>
                  <CardTitle className="font-mono text-lg text-[#cbd5e1]">FIND_TRADES</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[#cbd5e1] text-sm">
                  Select a position you want to upgrade. Our AI scans all teams to find mutually beneficial trades based
                  on team needs and player values.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-[#22c55e] text-black rounded-full flex items-center justify-center font-mono font-bold text-sm">
                    3
                  </div>
                  <CardTitle className="font-mono text-lg text-[#cbd5e1]">SEND_PROPOSALS</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[#cbd5e1] text-sm">
                  Get personalized trade messages that explain why the trade works. Copy and send to league mates with
                  context that gets results.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Core Capabilities */}
          <h3 className="text-2xl font-bold text-center mb-8 font-mono text-[#22c55e]">CORE_CAPABILITIES</h3>
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
