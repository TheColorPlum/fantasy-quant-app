"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Terminal, Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    setIsLoading(true)
    setError("")

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
        setError(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setEmail("demo@tradeup.com")
    setPassword("demo123456")
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "demo@tradeup.com", password: "demo123456" }),
      })

      const data = await response.json()

      if (data.success) {
        router.push("/dashboard")
      } else {
        setError("Demo login failed")
      }
    } catch (error) {
      console.error("Demo login error:", error)
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
              STATUS: <span className="text-[#fbbf24]">LOGIN</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] terminal-glow">
            <CardHeader className="text-center">
              <CardTitle className="font-mono text-2xl text-[#22c55e]">ACCESS_TERMINAL</CardTitle>
              <CardDescription className="font-mono text-sm text-[#94a3b8]">AUTHENTICATE_USER</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
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
                      AUTHENTICATING...
                    </>
                  ) : (
                    "ACCESS_TERMINAL"
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#2a2a2a]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#1a1a1a] px-2 text-[#94a3b8] font-mono">OR</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full border-[#2a2a2a] text-[#cbd5e1] hover:bg-[#2a2a2a] font-mono bg-transparent"
                >
                  DEMO_LOGIN
                </Button>

                <div className="text-center">
                  <span className="font-mono text-sm text-[#94a3b8]">NEW_USER? </span>
                  <Link href="/signup" className="font-mono text-sm text-[#22c55e] hover:text-[#16a34a]">
                    CREATE_ACCOUNT
                  </Link>
                </div>
              </div>

              {/* Demo credentials info */}
              <div className="mt-6 p-3 bg-[#0f0f0f] rounded border border-[#2a2a2a]">
                <p className="font-mono text-xs text-[#94a3b8] mb-2">DEMO_CREDENTIALS:</p>
                <p className="font-mono text-xs text-[#cbd5e1]">EMAIL: demo@tradeup.com</p>
                <p className="font-mono text-xs text-[#cbd5e1]">PASS: demo123456</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
