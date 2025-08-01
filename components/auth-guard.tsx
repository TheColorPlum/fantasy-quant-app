"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AuthUser {
  id: string
  email: string
  name: string
  isPremium: boolean
  scansRemaining: number
}

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/user/profile")
        const data = await response.json()

        if (data.success) {
          setUser(data.user)
        } else if (requireAuth) {
          router.push("/auth/login")
          return
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        if (requireAuth) {
          router.push("/auth/login")
          return
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requireAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null // Will redirect to login
  }

  return <>{children}</>
}
