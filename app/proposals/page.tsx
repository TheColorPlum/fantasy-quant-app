"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TrendingUp, ChevronDown, Copy, Target, BarChart3, TrendingDown, Edit, Send, Check } from 'lucide-react'

interface TradeProposal {
  id: string
  partner: string
  confidence: number
  yourPlayers: Array<{
    name: string
    position: string
    value: number
    trend: number // -1 to 1, where 1 is trending up, -1 is trending down
    projectedPoints: number
  }>
  theirPlayers: Array<{
    name: string
    position: string
    value: number
    trend: number
    projectedPoints: number
  }>
  reasoning: string
  message: string
  valueDifferential: number // Simple calculation: their total value - your total value
  context: {
    whyItWorks: string
    personalizedMessage: string
    timingAdvice: {
      bestTiming: string
      reasoning: string
      riskFactors: string[]
    }
    negotiationBackup?: string
  }
}

export default function ProposalsPage() {
  const [expandedProposal, setExpandedProposal] = useState<string | null>(null)
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<TradeProposal | null>(null)
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false)
  const [modifyingProposal, setModifyingProposal] = useState<TradeProposal | null>(null)
  const [customMessage, setCustomMessage] = useState("")
  const [sentTrades, setSentTrades] = useState<Set<string>>(new Set())
  const [sendingTrade, setSendingTrade] = useState<string | null>(null)

  const proposals: TradeProposal[] = [
    {
      id: "1",
      partner: "Fantasy Legends",
      confidence: 87,
      yourPlayers: [
        { name: "Saquon Barkley", position: "RB", value: 24.3, trend: 0.8, projectedPoints: 18.7 },
        { name: "Tyler Lockett", position: "WR", value: 16.8, trend: -0.2, projectedPoints: 14.2 },
      ],
      theirPlayers: [
        { name: "Stefon Diggs", position: "WR", value: 28.1, trend: 0.3, projectedPoints: 19.4 },
        { name: "Tony Pollard", position: "RB", value: 15.7, trend: -0.4, projectedPoints: 12.8 },
      ],
      valueDifferential: 2.7, // (28.1 + 15.7) - (24.3 + 16.8) = 2.7
      reasoning: "Partner desperately needs RB depth after CMC injury. You're loaded at RB and need WR1 upside.",
      message:
        "Hey! Saw CMC went down and you might need some RB help. I've got Saquon who's been crushing it lately. Would you consider Saquon + Lockett for Diggs + Pollard? Gives you a proven RB1 and I get the WR upgrade I need for playoffs.",
      context: {
        whyItWorks:
          "This trade capitalizes on positional scarcity and timing. Your partner just lost CMC and is desperate for RB production. Saquon has been elite (RB3 overall) and provides immediate impact. Meanwhile, you upgrade from Lockett (WR24) to Diggs (WR8), giving you a true WR1 for playoffs. The value differential heavily favors you (+2.7 points), and Pollard provides decent RB depth as a sweetener.",
        personalizedMessage:
          "Hey! Saw CMC went down and you might need some RB help. I've got Saquon who's been crushing it lately. Would you consider Saquon + Lockett for Diggs + Pollard? Gives you a proven RB1 and I get the WR upgrade I need for playoffs.",
        timingAdvice: {
          bestTiming: "Send immediately",
          reasoning:
            "CMC injury creates maximum urgency. Partner likely panicking about RB depth and will overpay for security.",
          riskFactors: [
            "Partner might acquire another RB before you send",
            "Saquon's recent performance might cool off",
            "Diggs has tough playoff schedule vs top defenses",
          ],
        },
        negotiationBackup:
          "If they hesitate, emphasize Saquon's recent dominance (3 straight 20+ point games) and offer to throw in your best bench WR to sweeten the deal. You could also pivot to a straight Saquon for Diggs swap if they're reluctant to include Pollard.",
      },
    },
    {
      id: "2",
      partner: "Trade Masters",
      confidence: 82,
      yourPlayers: [{ name: "Calvin Ridley", position: "WR", value: 18.4, trend: 0.6, projectedPoints: 13.9 }],
      theirPlayers: [{ name: "Josh Jacobs", position: "RB", value: 21.2, trend: 0.1, projectedPoints: 15.6 }],
      valueDifferential: 2.8, // 21.2 - 18.4 = 2.8
      reasoning:
        "They're stacked at RB but thin at WR. Ridley's target share trending up, perfect buy-low opportunity.",
      message:
        "What's up! I've been watching your team and noticed you're pretty deep at RB. I could use some help there - would you be interested in Ridley for Jacobs straight up? Ridley's been getting more targets lately and could be a nice WR2 for you.",
      context: {
        whyItWorks:
          "You're gaining +2.8 value points in this trade. Jacobs has been consistent (RB12 overall) with a safe floor, while Ridley is trending up with increased target share. Your partner has 4 startable RBs but only 2 reliable WRs, creating natural trade synergy. The position scarcity heavily favors RBs in your league format.",
        personalizedMessage:
          "What's up! I've been watching your team and noticed you're pretty deep at RB. I could use some help there - would you be interested in Ridley for Jacobs straight up? Ridley's been getting more targets lately and could be a nice WR2 for you.",
        timingAdvice: {
          bestTiming: "Send within 24 hours",
          reasoning: "Ridley just had a big game, maximizing his perceived value. Strike while his stock is high.",
          riskFactors: [
            "Ridley's target share could regress",
            "Jacobs has favorable upcoming schedule",
            "Partner might want more than 1-for-1",
          ],
        },
        negotiationBackup:
          "If they want more, offer to add your best bench player or pivot to a package deal. You could also wait for Ridley to have another big game to increase his trade value.",
      },
    },
    {
      id: "3",
      partner: "Playoff Bound",
      confidence: 79,
      yourPlayers: [
        { name: "George Kittle", position: "TE", value: 19.6, trend: 0.2, projectedPoints: 14.8 },
        { name: "Courtland Sutton", position: "WR", value: 17.2, trend: -0.1, projectedPoints: 13.1 },
      ],
      theirPlayers: [
        { name: "Travis Kelce", position: "TE", value: 22.4, trend: -0.3, projectedPoints: 16.2 },
        { name: "Rhamondre Stevenson", position: "RB", value: 16.8, trend: 0.4, projectedPoints: 12.9 },
      ],
      valueDifferential: 2.4, // (22.4 + 16.8) - (19.6 + 17.2) = 2.4
      reasoning: "TE upgrade worth the slight downgrade elsewhere. Kelce's playoff schedule is elite.",
      message:
        "Hope you're doing well! I know we're both fighting for playoff position. I'd love to get Kelce for his playoff schedule - would you consider Kittle + Sutton for Kelce + Stevenson? Kittle's been solid and Sutton gives you another reliable WR option.",
      context: {
        whyItWorks:
          "Kelce's playoff schedule (weeks 15-17) is elite - facing bottom-5 defenses vs TEs. The TE position upgrade from Kittle to Kelce (+2.8 value) outweighs the slight downgrade from Sutton to Stevenson. You're essentially trading WR depth for TE dominance, which is valuable given TE scarcity. Net value gain of +2.4 points.",
        personalizedMessage:
          "Hope you're doing well! I know we're both fighting for playoff position. I'd love to get Kelce for his playoff schedule - would you consider Kittle + Sutton for Kelce + Stevenson? Kittle's been solid and Sutton gives you another reliable WR option.",
        timingAdvice: {
          bestTiming: "Send before Week 13",
          reasoning:
            "Playoff positioning becomes clearer soon. Strike while both teams are still fighting for seeding.",
          riskFactors: [
            "Kelce's age concerns might surface",
            "Kittle's injury history could be a deterrent",
            "Stevenson's workload might decrease",
          ],
        },
        negotiationBackup:
          "Emphasize Kelce's playoff matchups and your need for TE consistency. If they hesitate, offer to swap Stevenson for a different player or add a future draft pick consideration.",
      },
    },
    {
      id: "4",
      partner: "Defense Dynasty",
      confidence: 74,
      yourPlayers: [{ name: "Miami Dolphins", position: "DST", value: 8.2, trend: -0.6, projectedPoints: 7.4 }],
      theirPlayers: [{ name: "San Francisco 49ers", position: "DST", value: 12.1, trend: 0.4, projectedPoints: 9.8 }],
      valueDifferential: 3.9, // 12.1 - 8.2 = 3.9
      reasoning:
        "49ers defense has elite playoff schedule while Dolphins face tough offenses. Solid upgrade opportunity.",
      message:
        "Hey! I noticed you've been streaming defenses lately. I've got the 49ers DST and they have a great playoff schedule - would you be interested in swapping for the Dolphins? 49ers face some weaker offenses down the stretch.",
      context: {
        whyItWorks:
          "The 49ers defense has a significantly better playoff schedule, facing bottom-10 offenses in weeks 15-17. Miami's defense has been inconsistent and faces high-powered offenses like Buffalo and the Jets. The +3.9 value differential makes this a clear upgrade, and your partner has been streaming defenses, indicating they're not attached to any particular unit.",
        personalizedMessage:
          "Hey! I noticed you've been streaming defenses lately. I've got the 49ers DST and they have a great playoff schedule - would you be interested in swapping for the Dolphins? 49ers face some weaker offenses down the stretch.",
        timingAdvice: {
          bestTiming: "Send before Week 12",
          reasoning:
            "Playoff schedules become more important as we approach fantasy playoffs. Strike before they realize the value.",
          riskFactors: [
            "49ers might have injury concerns",
            "Partner might prefer streaming approach",
            "Dolphins could have a bounce-back game",
          ],
        },
        negotiationBackup:
          "If they're hesitant, emphasize the specific matchups: 49ers face Arizona, Chicago, and Detroit in playoffs while Dolphins face Buffalo, Dallas, and Baltimore. You could also offer to throw in a bench player to sweeten the deal.",
      },
    },
  ]

  const copyMessage = (message: string, proposalId: string) => {
    navigator.clipboard.writeText(message)
    setCopiedMessage(proposalId)
    setTimeout(() => setCopiedMessage(null), 2000)
  }

  const calculateTotalValue = (players: Array<{ value: number }>) => {
    return players.reduce((sum, player) => sum + player.value, 0)
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0.3) return <TrendingUp className="h-3 w-3 text-[#22c55e]" />
    if (trend < -0.3) return <TrendingDown className="h-3 w-3 text-[#ef4444]" />
    return <div className="h-3 w-3 rounded-full bg-[#94a3b8]" />
  }

  const getPositionColor = (position: string) => {
    switch (position) {
      case "QB":
        return "text-[#ef4444] border-[#ef4444]"
      case "RB":
        return "text-[#22c55e] border-[#22c55e]"
      case "WR":
        return "text-[#3b82f6] border-[#3b82f6]"
      case "TE":
        return "text-[#f59e0b] border-[#f59e0b]"
      case "K":
        return "text-[#94a3b8] border-[#94a3b8]"
      case "DST":
        return "text-[#8b5cf6] border-[#8b5cf6]"
      default:
        return "text-[#94a3b8] border-[#94a3b8]"
    }
  }

  const handleModifyTrade = (proposal: TradeProposal) => {
    setModifyingProposal(proposal)
    setCustomMessage(proposal.message)
    setModifyDialogOpen(true)
  }

  const handleSendTrade = async (proposalId: string) => {
    setSendingTrade(proposalId)

    // Simulate sending trade to fantasy platform
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setSentTrades((prev) => new Set([...prev, proposalId]))
    setSendingTrade(null)
  }

  const handleSaveModification = () => {
    if (modifyingProposal) {
      // In a real app, this would update the proposal with the custom message
      console.log("Updated message:", customMessage)
      setModifyDialogOpen(false)
      setModifyingProposal(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-mono text-3xl font-bold text-[#22c55e] mb-2">TRADE_PROPOSALS</h1>
            <p className="font-mono text-sm text-[#94a3b8]">
              PROPOSALS: <span className="text-[#22c55e] font-semibold">{proposals.length}</span>
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-[#94a3b8]">TOTAL_VALUE_GAIN</p>
                    <p className="font-mono text-2xl font-bold text-[#22c55e]">
                      +{proposals.reduce((sum, p) => sum + p.valueDifferential, 0).toFixed(1)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-[#22c55e]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-[#94a3b8]">AVG_VALUE_DELTA</p>
                    <p className="font-mono text-2xl font-bold text-[#22c55e]">
                      +{(proposals.reduce((sum, p) => sum + p.valueDifferential, 0) / proposals.length).toFixed(1)}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-[#22c55e]" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm text-[#94a3b8]">POSITIVE_TRADES</p>
                    <p className="font-mono text-2xl font-bold text-[#22c55e]">
                      {proposals.filter((p) => p.valueDifferential > 0).length}/{proposals.length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-[#22c55e]" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Trade Proposals List */}
            <div className="lg:col-span-2 space-y-6">
              {proposals.map((proposal) => (
                <Card
                  key={proposal.id}
                  className={`bg-[#1a1a1a] border-[#2a2a2a] terminal-glow cursor-pointer transition-all ${
                    selectedProposal?.id === proposal.id ? "border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.3)]" : ""
                  } ${sentTrades.has(proposal.id) ? "opacity-60" : ""}`}
                  onClick={() => setSelectedProposal(proposal)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Target className="h-5 w-5 text-[#22c55e]" />
                        <CardTitle className="font-mono text-[#cbd5e1]">{proposal.partner}</CardTitle>
                        {sentTrades.has(proposal.id) ? (
                          <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 font-mono text-xs">
                            <Check className="mr-1 h-3 w-3" />
                            SENT
                          </Badge>
                        ) : (
                          <Badge
                            className={`font-mono text-xs ${
                              proposal.valueDifferential > 2
                                ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20"
                                : proposal.valueDifferential > 0
                                  ? "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"
                                  : "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20"
                            }`}
                          >
                            {proposal.valueDifferential > 0 ? "+" : ""}
                            {proposal.valueDifferential.toFixed(1)} VALUE
                          </Badge>
                        )}
                      </div>
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedProposal(expandedProposal === proposal.id ? null : proposal.id)
                            }}
                            className="font-mono text-xs text-[#94a3b8] hover:text-[#22c55e]"
                          >
                            {expandedProposal === proposal.id ? "COLLAPSE" : "EXPAND"}
                            <ChevronDown
                              className={`ml-2 h-4 w-4 transition-transform ${
                                expandedProposal === proposal.id ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Trade Value Summary */}
                    <div className="text-center font-mono">
                      <div className="text-[#94a3b8] text-xs mb-1">VALUE_DIFFERENTIAL</div>
                      <div
                        className={`font-bold text-3xl ${
                          proposal.valueDifferential > 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                        }`}
                      >
                        {proposal.valueDifferential > 0 ? "+" : ""}
                        {proposal.valueDifferential.toFixed(1)}
                      </div>
                      <div className="text-[#94a3b8] text-xs">FANTASY POINTS</div>
                    </div>

                    {/* Trade Details */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-xs text-[#94a3b8]">YOU_TRADE:</p>
                          <p className="font-mono text-xs text-[#ef4444]">
                            -{calculateTotalValue(proposal.yourPlayers).toFixed(1)} PTS
                          </p>
                        </div>
                        <div className="space-y-1">
                          {proposal.yourPlayers.map((player, index) => (
                            <div
                              key={index}
                              className="font-mono text-sm text-[#cbd5e1] bg-[#0f0f0f] px-3 py-2 rounded border border-[#2a2a2a] flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2">
                                <div>
                                  <span className="font-semibold">{player.name}</span>
                                  <Badge
                                    variant="outline"
                                    className={`ml-2 font-mono text-xs ${getPositionColor(player.position)}`}
                                  >
                                    {player.position}
                                  </Badge>
                                </div>
                                {getTrendIcon(player.trend)}
                              </div>
                              <div className="text-xs text-[#94a3b8]">{player.value.toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-xs text-[#94a3b8]">YOU_RECEIVE:</p>
                          <p className="font-mono text-xs text-[#22c55e]">
                            +{calculateTotalValue(proposal.theirPlayers).toFixed(1)} PTS
                          </p>
                        </div>
                        <div className="space-y-1">
                          {proposal.theirPlayers.map((player, index) => (
                            <div
                              key={index}
                              className="font-mono text-sm text-[#22c55e] bg-[#22c55e]/5 px-3 py-2 rounded border border-[#22c55e]/20 flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-2">
                                <div>
                                  <span className="font-semibold">{player.name}</span>
                                  <Badge
                                    variant="outline"
                                    className={`ml-2 font-mono text-xs ${getPositionColor(player.position)}`}
                                  >
                                    {player.position}
                                  </Badge>
                                </div>
                                {getTrendIcon(player.trend)}
                              </div>
                              <div className="text-xs text-[#94a3b8]">{player.value.toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                      <p className="font-mono text-xs text-[#94a3b8] mb-2">TRADE_LOGIC:</p>
                      <p className="font-mono text-sm text-[#cbd5e1]">{proposal.reasoning}</p>
                    </div>

                    {/* Expanded Details */}
                    <Collapsible open={expandedProposal === proposal.id}>
                      <CollapsibleContent className="space-y-4">
                        {/* Message */}
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-mono text-xs text-[#94a3b8]">TRADE_MESSAGE:</p>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyMessage(proposal.message, proposal.id)
                              }}
                              size="sm"
                              variant="ghost"
                              className="font-mono text-xs text-[#22c55e] hover:text-[#16a34a] h-auto p-1"
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              {copiedMessage === proposal.id ? "COPIED!" : "COPY"}
                            </Button>
                          </div>
                          <p className="font-mono text-sm text-[#cbd5e1] leading-relaxed">{proposal.message}</p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      {sentTrades.has(proposal.id) ? (
                        <Button
                          disabled
                          className="flex-1 bg-[#22c55e]/20 text-[#22c55e] font-mono font-semibold cursor-not-allowed"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          TRADE_SENT
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSendTrade(proposal.id)
                            }}
                            disabled={sendingTrade === proposal.id}
                            className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold"
                          >
                            {sendingTrade === proposal.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                                SENDING...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                SEND_TRADE
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleModifyTrade(proposal)
                            }}
                            variant="outline"
                            className="border-[#2a2a2a] text-[#cbd5e1] hover:bg-[#2a2a2a] bg-transparent font-mono"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            MODIFY
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trade Intelligence Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardHeader>
                    <CardTitle className="font-mono text-[#22c55e]">TRADE_INTELLIGENCE</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProposal ? (
                      <div className="space-y-4">
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                          <p className="font-mono text-xs text-[#94a3b8] mb-2">WHY_IT_WORKS:</p>
                          <p className="font-mono text-sm text-[#cbd5e1] leading-relaxed">
                            {selectedProposal.context.whyItWorks}
                          </p>
                        </div>

                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                          <p className="font-mono text-xs text-[#94a3b8] mb-2">TIMING_ADVICE:</p>
                          <p className="font-mono text-sm text-[#22c55e] mb-2">
                            {selectedProposal.context.timingAdvice.bestTiming}
                          </p>
                          <p className="font-mono text-xs text-[#cbd5e1]">
                            {selectedProposal.context.timingAdvice.reasoning}
                          </p>
                        </div>

                        {selectedProposal.context.negotiationBackup && (
                          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                            <p className="font-mono text-xs text-[#94a3b8] mb-2">NEGOTIATION_BACKUP:</p>
                            <p className="font-mono text-sm text-[#cbd5e1] leading-relaxed">
                              {selectedProposal.context.negotiationBackup}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="font-mono text-sm text-[#94a3b8]">
                          SELECT_A_PROPOSAL
                          <br />
                          TO_VIEW_DETAILS
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modify Trade Dialog */}
      <Dialog open={modifyDialogOpen} onOpenChange={setModifyDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-[#22c55e]">MODIFY_TRADE: {modifyingProposal?.partner}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Trade Summary */}
            {modifyingProposal && (
              <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                  <div>
                    <p className="text-[#94a3b8] mb-2">YOU_TRADE:</p>
                    {modifyingProposal.yourPlayers.map((player, index) => (
                      <div key={index} className="text-[#cbd5e1] flex items-center space-x-2">
                        <span>{player.name}</span>
                        <Badge variant="outline" className={`font-mono text-xs ${getPositionColor(player.position)}`}>
                          {player.position}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[#94a3b8] mb-2">YOU_RECEIVE:</p>
                    {modifyingProposal.theirPlayers.map((player, index) => (
                      <div key={index} className="text-[#22c55e] flex items-center space-x-2">
                        <span>{player.name}</span>
                        <Badge variant="outline" className={`font-mono text-xs ${getPositionColor(player.position)}`}>
                          {player.position}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Custom Message */}
            <div className="space-y-2">
              <Label className="font-mono text-sm text-[#94a3b8]">CUSTOM_MESSAGE:</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="bg-[#0f0f0f] border-[#2a2a2a] text-white font-mono text-sm min-h-[120px] resize-none"
                placeholder="Customize your trade message..."
                maxLength={500}
              />
              <p className="font-mono text-xs text-[#94a3b8]">{customMessage.length}/500 characters</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSaveModification}
                className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold"
              >
                SAVE_CHANGES
              </Button>
              <Button
                onClick={() => setModifyDialogOpen(false)}
                variant="outline"
                className="border-[#2a2a2a] text-[#cbd5e1] hover:bg-[#2a2a2a] bg-transparent font-mono"
              >
                CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
