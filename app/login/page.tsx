"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data?.success) {
        const linked = localStorage.getItem("leagueLinked") === "true"
        router.push(linked ? "/dashboard" : "/league-setup")
      } else {
        setError(data?.error || "Login failed")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0f0f0f", color: "white" }}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="rounded-[2px] border" style={{ borderColor: "#2E2E2E", background: "#121417" }}>
            <CardHeader className="text-center">
              <CardTitle className="font-mono text-2xl" style={{ color: "#22C55E" }}>
                ACCESS_TERMINAL
              </CardTitle>
              <CardDescription className="font-mono text-sm" style={{ color: "#94A3B8" }}>
                AUTHENTICATE_USER
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="email" className="font-mono text-sm" style={{ color: "#cbd5e1" }}>
                    EMAIL
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-[2px] border"
                    style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#cbd5e1" }}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="font-mono text-sm" style={{ color: "#cbd5e1" }}>
                    PASSWORD
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-[2px] border"
                    style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#cbd5e1" }}
                    required
                  />
                </div>
                {error && (
                  <Alert className="border" style={{ borderColor: "#ef4444", background: "rgba(239,68,68,0.1)" }}>
                    <AlertDescription className="font-mono text-sm" style={{ color: "#ef4444" }}>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-[2px]"
                  style={{ background: "#22C55E", color: "#000" }}
                >
                  {isLoading ? "AUTHENTICATING…" : "ACCESS_TERMINAL"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <span className="font-mono text-sm" style={{ color: "#94A3B8" }}>
                  NEW_USER?{" "}
                </span>
                <Link href="/signup" className="font-mono text-sm" style={{ color: "#22C55E" }}>
                  CREATE_ACCOUNT
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
