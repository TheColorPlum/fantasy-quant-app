"use client"

import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Terminal, Heart, LogOut } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { DonateModal } from '@/components/donate-modal'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [showDonateModal, setShowDonateModal] = useState(false)

  // Hide header on auth pages, landing page, and dashboard
  const hideHeader = ['/', '/login', '/signup', '/auth/login', '/auth/register', '/dashboard'].includes(pathname)

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const getPageBadge = () => {
    switch (pathname) {
      case '/trades':
        return 'FIND_TRADES'
      case '/proposals':
        return 'MY_PROPOSALS'
      case '/rosters':
        return 'VIEW_ROSTERS'
      case '/players':
        return 'ALL_PLAYERS'
      case '/settings':
        return 'SETTINGS'
      case '/upgrade':
        return 'UPGRADE'
      default:
        return 'TRADEUP'
    }
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {!hideHeader && (
            <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                      <Terminal className="h-6 w-6 text-[#22c55e]" />
                      <span className="text-xl font-bold font-mono text-white">TRADEUP</span>
                    </Link>
                    <Badge variant="outline" className="text-[#22c55e] border-[#22c55e] font-mono text-xs">
                      {getPageBadge()}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={() => setShowDonateModal(true)}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-black bg-transparent"
                    >
                      <Heart className="mr-1 h-3 w-3" />
                      DONATE
                    </Button>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs border-[#94a3b8] text-[#94a3b8] hover:bg-[#94a3b8] hover:text-black bg-transparent"
                    >
                      <LogOut className="mr-1 h-3 w-3" />
                      LOGOUT
                    </Button>
                  </div>
                </div>
              </div>
            </header>
          )}
          {children}
          <Toaster />
          <DonateModal open={showDonateModal} onOpenChange={setShowDonateModal} />
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
