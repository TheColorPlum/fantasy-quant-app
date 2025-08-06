import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, TrendingUp, FileText, Users, Search } from 'lucide-react'

export function QuickActions() {
  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a] mb-8">
      <CardHeader>
        <CardTitle className="text-[#cbd5e1] font-mono">QUICK_ACTIONS</CardTitle>
        <CardDescription className="text-[#94a3b8] font-mono text-sm">
          Navigate to key sections of the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/trades">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#22c55e]" />
                    FIND_TRADES
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#22c55e]" />
                </CardTitle>
                <CardDescription className="text-[#94a3b8] font-mono text-sm">
                  Scan for trade opportunities
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/proposals">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-[#22c55e]" />
                    MY_PROPOSALS
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#22c55e]" />
                </CardTitle>
                <CardDescription className="text-[#94a3b8] font-mono text-sm">
                  View and manage your trade proposals
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/rosters">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#22c55e]" />
                    VIEW_ROSTERS
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#22c55e]" />
                </CardTitle>
                <CardDescription className="text-[#94a3b8] font-mono text-sm">
                  Analyze all league rosters and values
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/players">
            <Card className="bg-[#0f0f0f] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-[#22c55e]" />
                    ALL_PLAYERS
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#22c55e]" />
                </CardTitle>
                <CardDescription className="text-[#94a3b8] font-mono text-sm">
                  Browse and analyze all league players
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
