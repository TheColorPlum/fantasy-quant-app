"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Terminal, Loader2, Eye, EyeOff, CheckCircle, Zap, TrendingUp, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      setError("All fields are required")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // Navigate to onboarding after successful registration
        router.push("/onboarding")
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      console.error("Registration error:", error)
      setError("Network error. Please try again.")
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
            <Link href="/" className="flex items-center space-x-2">
              <Terminal className="h-6 w-6 text-[#22c55e]" />
              <span className="text-xl font-bold font-mono">TRADEUP</span>
            </Link>
            <div className="font-mono text-sm text-[#94a3b8]">
              STATUS: <span className="text-[#fbbf24]">REGISTRATION</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Registration Form */}
            <div>
              <Card className="bg-[#1a1a1a] border-[#2a2a2a] terminal-glow">
                <CardHeader className="text-center">
                  <CardTitle className="font-mono text-2xl text-[#22c55e]">CREATE_ACCOUNT</CardTitle>
                  <CardDescription className="font-mono text-sm text-[#94a3b8]">
                    JOIN_THE_TRADING_REVOLUTION
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-mono text-sm text-[#cbd5e1]">
                        FULL_NAME
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-[#cbd5e1] placeholder:text-[#94a3b8]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-mono text-sm text-[#cbd5e1]">
                        EMAIL
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@domain.com"
                        className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-[#cbd5e1] placeholder:text-[#94a3b8]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="font-mono text-sm text-[#cbd5e1]">
                        PASSWORD
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-[#cbd5e1] placeholder:text-[#94a3b8] pr-10"
                          required
                          minLength={8}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-[#94a3b8]" />
                          ) : (
                            <Eye className="h-4 w-4 text-[#94a3b8]" />
                          )}
                        </Button>
                      </div>
                      <p className="font-mono text-xs text-[#94a3b8]">MIN_8_CHARACTERS</p>
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
                          CREATING_ACCOUNT...
                        </>
                      ) : (
                        "CREATE_ACCOUNT"
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <span className="font-mono text-sm text-[#94a3b8]">HAVE_ACCOUNT? </span>
                    <Link href="/login" className="font-mono text-sm text-[#22c55e] hover:text-[#16a34a]">
                      LOGIN
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Preview */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="font-mono text-xl text-[#22c55e] mb-2">WHAT_YOU_GET</h2>
                <p className="font-mono text-sm text-[#94a3b8]">PROFESSIONAL_TRADING_TOOLS</p>
              </div>

              <div className="space-y-4">
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Zap className="h-5 w-5 text-[#22c55e] mt-0.5" />
                      <div>
                        <h3 className="font-mono text-sm font-bold text-[#cbd5e1]">AI_TRADE_ANALYSIS</h3>
                        <p className="font-mono text-xs text-[#94a3b8] mt-1">
                          Advanced algorithms analyze player performance, matchups, and market trends
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="h-5 w-5 text-[#22c55e] mt-0.5" />
                      <div>
                        <h3 className="font-mono text-sm font-bold text-[#cbd5e1]">REAL_TIME_INSIGHTS</h3>
                        <p className="font-mono text-xs text-[#94a3b8] mt-1">
                          Live roster moves, injury reports, and market sentiment analysis
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="h-5 w-5 text-[#22c55e] mt-0.5" />
                      <div>
                        <h3 className="font-mono text-sm font-bold text-[#cbd5e1]">SECURE_PLATFORM</h3>
                        <p className="font-mono text-xs text-[#94a3b8] mt-1">
                          Bank-level security with encrypted data and secure API connections
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-[#22c55e]">FREE_TIER_INCLUDES:</span>
                  <Badge variant="outline" className="text-[#22c55e] border-[#22c55e] font-mono text-xs">
                    NO_COST
                  </Badge>
                </div>
                <ul className="space-y-1 font-mono text-xs text-[#cbd5e1]">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-[#22c55e]" />
                    <span>5 trade scans per week</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-[#22c55e]" />
                    <span>Basic trade proposals</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-[#22c55e]" />
                    <span>League integration</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
