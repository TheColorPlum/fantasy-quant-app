import Link from "next/link"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight } from 'lucide-react'

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Link href="/trades">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
              FIND_TRADES
              <ChevronRight className="h-5 w-5 text-[#22c55e]" />
            </CardTitle>
            <CardDescription className="text-[#94a3b8] font-mono text-sm">
              Scan all teams for winning opportunities
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>

      <Link href="/proposals">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
              MY_PROPOSALS
              <ChevronRight className="h-5 w-5 text-[#22c55e]" />
            </CardTitle>
            <CardDescription className="text-[#94a3b8] font-mono text-sm">
              View and manage your trade proposals
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>

      <Link href="/rosters">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
              VIEW_ROSTERS
              <ChevronRight className="h-5 w-5 text-[#22c55e]" />
            </CardTitle>
            <CardDescription className="text-[#94a3b8] font-mono text-sm">
              Analyze all league rosters and values
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>

      <Link href="/players">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#22c55e] transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[#cbd5e1] font-mono">
              ALL_PLAYERS
              <ChevronRight className="h-5 w-5 text-[#22c55e]" />
            </CardTitle>
            <CardDescription className="text-[#94a3b8] font-mono text-sm">
              Browse and analyze all league players
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
    </div>
  )
}
