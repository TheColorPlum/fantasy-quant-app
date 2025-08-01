"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Terminal, TrendingUp, TrendingDown, Copy, ChevronDown, ChevronUp, Filter } from "lucide-react"
import Link from "next/link"
import { TradeContextCard } from "@/components/trade-context-card"
import { generateTradeContext, type TradeContext } from "@/lib/llm-service"

interface TradeProposal {
  id: string
  partner: string
  type: "FAIR_VALUE" | "BUY_LOW_SELL_HIGH" | "ARBITRAGE_OPPORTUNITY"
  userGives: Array<{ name: string; position: string; value: number; trend: number }>
  userGets: Array<{ name: string; position: string; value: number; trend: number }>
  valueDifferential: number
  confidence: number
  reasoning: string
  message: string
  volatilityIndex: number
  correlationScore: number
}

const mockProposals: TradeProposal[] = [
  {
    id: "1",
    partner: "TEAM_MAHOMES",
    type: "BUY_LOW_SELL_HIGH",
    userGives: [{ name: "Davante Adams", position: "WR", value: 42.8, trend: -5.2 }],
    userGets: [{ name: "Josh Jacobs", position: "RB", value: 45.1, trend: 8.7 }],
    valueDifferential: 2.3,
    confidence: 87.3,
    reasoning:
      "Adams showing negative momentum (-5.2% weekly decline) while maintaining premium valuation. Jacobs demonstrates positive trajectory (+8.7% uptick) with undervalued market position. Correlation analysis indicates inverse performance patterns, suggesting optimal arbitrage window.",
    message:
      "Hey Team Mahomes! I noticed you're stacked at RB and could use WR depth. Want to swap my Davante Adams for your Josh Jacobs? Values are close and it helps both our lineups. Let me know if you're interested!",
    volatilityIndex: 0.73,
    correlationScore: -0.42,
  },
  {
    id: "2",
    partner: "TEAM_ALLEN",
    type: "FAIR_VALUE",
    userGives: [{ name: "Travis Kelce", position: "TE", value: 38.9, trend: 2.1 }],
    userGets: [{ name: "Stefon Diggs", position: "WR", value: 39.2, trend: 1.8 }],
    valueDifferential: 0.3,
    confidence: 91.7,
    reasoning:
      "Near-perfect value alignment with minimal differential (0.77%). Both assets showing stable positive momentum. Position swap addresses mutual portfolio optimization needs while maintaining risk-neutral stance.",
    message:
      "Hi Team Allen! Looking at our rosters, I think we could both benefit from a position swap. My Travis Kelce for your Stefon Diggs? Pretty even trade that fills needs for both teams. Thoughts?",
    volatilityIndex: 0.45,
    correlationScore: 0.12,
  },
  {
    id: "3",
    partner: "TEAM_BURROW",
    type: "ARBITRAGE_OPPORTUNITY",
    userGives: [
      { name: "Alvin Kamara", position: "RB", value: 31.4, trend: -2.8 },
      { name: "Tyler Lockett", position: "WR", value: 18.7, trend: -1.2 },
    ],
    userGets: [{ name: "Derrick Henry", position: "RB", value: 52.8, trend: 12.4 }],
    valueDifferential: 2.7,
    confidence: 79.2,
    reasoning:
      "Multi-asset consolidation opportunity. Combined position value ($50.1M) for premium single asset ($52.8M) represents 5.4% value capture. Henry's momentum surge (+12.4%) indicates continued appreciation potential.",
    message:
      "Team Burrow - I've got a proposal that might interest you. My Alvin Kamara + Tyler Lockett for your Derrick Henry? You get depth at two positions, I consolidate for a stud RB. Fair deal?",
    volatilityIndex: 0.89,
    correlationScore: 0.34,
  },
]

export default function ProposalsPage() {
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null)
  const [filter, setFilter] = useState("ALL")
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)
  const [tradeContexts, setTradeContexts] = useState<Record<string, TradeContext>>({})
  const [loadingContexts, setLoadingContexts] = useState<Record<string, boolean>>({})

  const filteredProposals = filter === "ALL" ? mockProposals : mockProposals.filter((p) => p.type === filter)

  const copyMessage = async (message: string, id: string) => {
    await navigator.clipboard.writeText(message)
    setCopiedMessage(id)
    setTimeout(() => setCopiedMessage(null), 2000)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "BUY_LOW_SELL_HIGH":
        return "text-[#22c55e] border-[#22c55e]"
      case "FAIR_VALUE":
        return "text-[#cbd5e1] border-[#cbd5e1]"
      case "ARBITRAGE_OPPORTUNITY":
        return "text-[#f59e0b] border-[#f59e0b]"
      default:
        return "text-[#94a3b8] border-[#94a3b8]"
    }
  }

  const loadTradeContext = async (proposalId: string, proposal: any) => {
    if (tradeContexts[proposalId] || loadingContexts[proposalId]) return

    setLoadingContexts((prev) => ({ ...prev, [proposalId]: true }))

    try {
      const context = await generateTradeContext(
        proposal.partner,
        proposal.userGives,
        proposal.userGets,
        proposal.valueDifferential,
      )
      setTradeContexts((prev) => ({ ...prev, [proposalId]: context }))
    } catch (error) {
      console.error("Failed to load trade context:", error)
    } finally {
      setLoadingContexts((prev) => ({ ...prev, [proposalId]: false }))
    }
  }

  const toggleProposal = (proposalId: string, proposal: any) => {
    const newExpanded = expandedProposal === proposalId ? null : proposalId
    setExpandedProposal(newExpanded)

    if (newExpanded && !tradeContexts[proposalId]) {
      loadTradeContext(proposalId, proposal)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Terminal className="h-6 w-6 text-[#22c55e]" />
                <span className="text-xl font-bold font-mono">TRADEUP</span>
              </Link>
              <Badge variant="outline" className="text-[#22c55e] border-[#22c55e] font-mono text-xs">
                TRADE_PROPOSALS
              </Badge>
            </div>

            <div className="flex items-center space-x-6">
              <div className="font-mono text-sm text-[#94a3b8]">
                SCANS_LEFT: <span className="text-[#f59e0b] font-semibold">2/5</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-xs border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-black bg-transparent"
              >
                UPGRADE_ACCOUNT
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Controls */}
        <Card className="mb-6 bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-[#22c55e]" />
                <span className="font-mono text-sm text-[#cbd5e1]">FILTER_PROPOSALS:</span>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-48 bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm text-[#cbd5e1]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <SelectItem value="ALL" className="font-mono text-[#cbd5e1]">
                      ALL_OPPORTUNITIES
                    </SelectItem>
                    <SelectItem value="BUY_LOW_SELL_HIGH" className="font-mono text-[#cbd5e1]">
                      BUY_LOW_SELL_HIGH
                    </SelectItem>
                    <SelectItem value="FAIR_VALUE" className="font-mono text-[#cbd5e1]">
                      FAIR_VALUE
                    </SelectItem>
                    <SelectItem value="ARBITRAGE_OPPORTUNITY" className="font-mono text-[#cbd5e1]">
                      ARBITRAGE_OPPORTUNITY
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="font-mono text-sm text-[#94a3b8]">
                SHOWING: <span className="text-[#22c55e]">{filteredProposals.length}</span> PROPOSALS
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proposals List */}
        <div className="space-y-6">
          {filteredProposals.map((proposal) => (
            <Card
              key={proposal.id}
              className={`bg-[#1a1a1a] border-[#2a2a2a] ${expandedProposal === proposal.id ? "expanded" : ""}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="font-mono text-lg text-[#22c55e]">{proposal.partner}</CardTitle>
                    <Badge variant="outline" className={`font-mono text-xs ${getTypeColor(proposal.type)}`}>
                      {proposal.type}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="font-mono text-sm text-[#94a3b8]">
                      CONFIDENCE: <span className="text-[#22c55e]">{proposal.confidence}%</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleProposal(proposal.id, proposal)}
                      className="font-mono text-xs text-[#cbd5e1]"
                    >
                      {expandedProposal === proposal.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      DETAILS
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Trade Summary */}
                <div className="grid md:grid-cols-3 gap-4 items-center">
                  <div className="space-y-2">
                    <div className="font-mono text-xs text-[#94a3b8]">YOU_TRADE:</div>
                    {proposal.userGives.map((player, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-[#0f0f0f] border border-[#2a2a2a] rounded p-2"
                      >
                        <div>
                          <div className="font-mono text-sm text-[#cbd5e1]">{player.name}</div>
                          <div className="font-mono text-xs text-[#94a3b8]">{player.position}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm text-[#22c55e]">${player.value}</div>
                          <div
                            className={`font-mono text-xs flex items-center ${player.trend >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                          >
                            {player.trend >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {player.trend > 0 ? "+" : ""}
                            {player.trend}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center">
                    <div className="font-mono text-2xl text-[#22c55e]">⇄</div>
                    <div className="font-mono text-xs text-[#94a3b8] mt-1">
                      VALUE_DELTA:{" "}
                      <span className={proposal.valueDifferential >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>
                        {proposal.valueDifferential > 0 ? "+" : ""}
                        {proposal.valueDifferential}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-mono text-xs text-[#94a3b8]">YOU_RECEIVE:</div>
                    {proposal.userGets.map((player, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-[#0f0f0f] border border-[#2a2a2a] rounded p-2"
                      >
                        <div>
                          <div className="font-mono text-sm text-[#cbd5e1]">{player.name}</div>
                          <div className="font-mono text-xs text-[#94a3b8]">{player.position}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm text-[#22c55e]">${player.value}</div>
                          <div
                            className={`font-mono text-xs flex items-center ${player.trend >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                          >
                            {player.trend >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {player.trend > 0 ? "+" : ""}
                            {player.trend}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedProposal === proposal.id && (
                  <div className="border-t border-[#2a2a2a] pt-4 space-y-4">
                    {/* Add Trade Context Intelligence */}
                    <TradeContextCard
                      context={tradeContexts[proposal.id] || null}
                      isLoading={loadingContexts[proposal.id] || false}
                      onCopyMessage={(message) => copyMessage(message, proposal.id)}
                      isPremium={false} // Set based on user's premium status
                    />
                  </div>
                )}

                {/* Message Section */}
                <div className="border-t border-[#2a2a2a] pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-sm text-[#22c55e]">PERSONALIZED_MESSAGE:</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyMessage(proposal.message, proposal.id)}
                        className="font-mono text-xs border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#cbd5e1]"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        {copiedMessage === proposal.id ? "COPIED" : "COPY"}
                      </Button>
                    </div>
                    <Textarea
                      value={proposal.message}
                      readOnly
                      className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm resize-none text-[#cbd5e1]"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Generate More */}
        <Card className="mt-8 bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="pt-6 text-center">
            <div className="space-y-4">
              <div className="font-mono text-sm text-[#94a3b8]">NEED_MORE_OPPORTUNITIES?</div>
              <Link href="/trade-generator">
                <Button className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold">
                  FIND_NEW_TRADES
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
