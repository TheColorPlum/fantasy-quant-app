"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Terminal, Power, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

function getPageBadge(pathname: string) {
  switch (pathname) {
    case "/dashboard":
      return "DASHBOARD"
    case "/trades":
      return "FIND_TRADES"
    case "/proposals":
      return "MY_PROPOSALS"
    case "/rosters":
      return "VIEW_ROSTERS"
    case "/players":
      return "ALL_PLAYERS"
    case "/settings":
      return "SETTINGS"
    case "/activity":
      return "ACTIVITY"
    default:
      return "TRADEUP"
  }
}

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Trades", href: "/trades" },
  { label: "Players", href: "/players" },
  { label: "Rosters", href: "/rosters" },
  { label: "Proposals", href: "/proposals" },
  { label: "Activity", href: "/activity" },
  { label: "Settings", href: "/settings" },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
      try {
        if ("caches" in window) {
          const keys = await caches.keys()
          await Promise.all(keys.map((k) => caches.delete(k)))
        }
      } catch {}
      localStorage.removeItem("demo")
      toast({ description: "You’ve been logged out." })
      router.replace("/login")
    } catch {
      router.replace("/login")
    }
  }

  return (
    <header className="border-b" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
      {/* Top bar */}
      <div className="px-0">
        <div className="mx-auto max-w-[1280px] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Terminal className="h-6 w-6" style={{ color: "#00FF85" }} />
                <span className="text-xl font-bold font-mono text-white">TRADEUP</span>
              </Link>
              <Badge
                variant="outline"
                className="font-mono text-[10px] uppercase rounded-[2px]"
                style={{ color: "#00FF85", borderColor: "#00FF85", background: "transparent" }}
              >
                {getPageBadge(pathname)}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-2 py-1 rounded-[2px] border text-xs"
                style={{ borderColor: "#2E2E2E", background: "#121417", color: "#B0B6C0" }}
              >
                <User size={14} />
                <span className="uppercase">You</span>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="h-8 border rounded-[2px] font-mono text-xs uppercase bg-transparent"
                style={{ borderColor: "#2E2E2E", color: "#B0B6C0", background: "transparent" }}
              >
                <Power className="mr-1 h-3.5 w-3.5" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary navigation row */}
      <div className="border-t" style={{ borderColor: "#2E2E2E", background: "#0E0F11" }}>
        <div className="mx-auto max-w-[1280px] px-4">
          <nav aria-label="Primary" className="-mx-4 overflow-x-auto">
            <ul className="flex items-center gap-1 px-4 py-2">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "inline-flex items-center rounded-[2px] border px-2.5 py-1.5 text-xs uppercase whitespace-nowrap transition-colors",
                        "hover:bg-[#121417]",
                        active ? "font-medium" : "opacity-90",
                      ].join(" ")}
                      style={{
                        borderColor: active ? "#00FF85" : "#2E2E2E",
                        color: active ? "#00FF85" : "#B0B6C0",
                        background: "transparent",
                      }}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
