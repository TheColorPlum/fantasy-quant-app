"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, TrendingUp, Check } from "lucide-react"

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (data.success) {
        router.push("/dashboard")
        router.refresh()
      } else {
        setError(data.error || "Registration failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-8 w-8 text-green-400" />
            <h1 className="text-2xl font-bold text-green-400 font-mono">TRADEUP</h1>
          </div>
          <p className="text-slate-400 text-sm">This is your (fantasy) quant!</p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-slate-100">Create Account</CardTitle>
            <CardDescription className="text-slate-400">Join the fantasy trading revolution</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-red-900/20 border-red-800">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-slate-100 placeholder:text-slate-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-slate-100 placeholder:text-slate-500"
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="bg-gray-800 border-gray-700 text-slate-100 placeholder:text-slate-500"
                  placeholder="Create a password (min 8 characters)"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-black font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-green-400 hover:text-green-300">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Features preview */}
            <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-xs text-slate-400 mb-3">What you get:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-slate-300">5 free trade scans per day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-slate-300">AI-powered trade analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-slate-300">Multi-platform league support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-slate-300">Personalized trade messages</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
