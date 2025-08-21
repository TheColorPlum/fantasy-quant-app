"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { GlobalTicker } from "@/components/global-ticker"

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Hide the app chrome on auth/landing/setup routes (prefix-based)
  const HIDE_PREFIXES = ["/", "/auth", "/login", "/signup", "/forgot", "/reset", "/verify", "/league-setup"]
  const hideHeader = HIDE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      {!hideHeader && <Header />}
      {!hideHeader && <GlobalTicker />}
      <div className="mx-auto max-w-[1280px] px-4">
        <main className={inter.className}>{children}</main>
      </div>
      <Toaster />
    </ThemeProvider>
  )
}
