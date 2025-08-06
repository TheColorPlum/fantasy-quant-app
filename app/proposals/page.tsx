"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, ChevronDown, Copy, Target, BarChart3, TrendingDown, Edit, Send, Check, MessageSquare, Clock, AlertTriangle, X, Plus, UserPlus } from 'lucide-react'

interface Player {
  id: string
  name: string
  position: string
  value: number
  trend: number
  projectedPoints: number
  team: string
}

interface TradeProposal {
  id: string
  partner: string
  confidence: number
  yourPlayers: Player[]
  theirPlayers: Player[]
  reasoning: string
  message: string
  valueDifferential: number
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
  const [sendTradeDialogOpen, setSendTradeDialogOpen] = useState(false)
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false)
  const [modifyingProposal, setModifyingProposal] = useState<TradeProposal | null>(null)
  const [customMessage, setCustomMessage] = useState("")
  const [sentTrades, setSentTrades] = useState<Set<string>>(new Set())
  const [sendingTrade, setSendingTrade] = useState<string | null>(null)
  const [selectedSendProposal, setSelectedSendProposal] = useState<TradeProposal | null>(null)
  const [partnerHasAccount, setPartnerHasAccount] = useState(true) // Mock - would be determined by API
  
  // Mock available players for modification
  const availablePlayers: Player[] = [
    { id: "p1", name: "Saquon Barkley", position: "RB", value: 24.3, trend: 0.8, projectedPoints: 18.7, team: "your" },
    { id: "p2", name: "Tyler Lockett", position: "WR", value: 16.8, trend: -0.2, projectedPoints: 14.2, team: "your" },
    { id: "p3", name: "Calvin Ridley", position: "WR", value: 18.4, trend: 0.6, projectedPoints: 13.9, team: "your" },
    { id: "p4", name: "George Kittle", position: "TE", value: 19.6, trend: 0.2, projectedPoints: 14.8, team: "your" },
    { id: "p5", name: "Courtland Sutton", position: "WR", value: 17.2, trend: -0.1, projectedPoints: 13.1, team: "your" },
    { id: "p6", name: "Stefon Diggs", position: "WR", value: 28.1, trend: 0.3, projectedPoints: 19.4, team: "their" },
    { id: "p7", name: "Tony Pollard", position: "RB", value: 15.7, trend: -0.4, projectedPoints: 12.8, team: "their" },
    { id: "p8", name: "Josh Jacobs", position: "RB", value: 21.2, trend: 0.1, projectedPoints: 15.6, team: "their" },
    { id: "p9", name: "Travis Kelce", position: "TE", value: 22.4, trend: -0.3, projectedPoints: 16.2, team: "their" },
    { id: "p10", name: "Rhamondre Stevenson", position: "RB", value: 16.8, trend: 0.4, projectedPoints: 12.9, team: "their" },
  ]

  const proposals: TradeProposal[] = [
    {
      id: "1",
      partner: "Fantasy Legends",
      confidence: 87,
      yourPlayers: [
        { id: "p1", name: "Saquon Barkley", position: "RB", value: 24.3, trend: 0.8, projectedPoints: 18.7, team: "your" },
        { id: "p2", name: "Tyler Lockett", position: "WR", value: 16.8, trend: -0.2, projectedPoints: 14.2, team: "your" },
      ],
      theirPlayers: [
        { id: "p6", name: "Stefon Diggs", position: "WR", value: 28.1, trend: 0.3, projectedPoints: 19.4, team: "their" },
        { id: "p7", name: "Tony Pollard", position: "RB", value: 15.7, trend: -0.4, projectedPoints: 12.8, team: "their" },
      ],
      valueDifferential: 2.7,
      reasoning: "Partner desperately needs RB depth after CMC injury. You're loaded at RB and need WR1 upside.",
      message: "Hey! Saw CMC went down and you might need some RB help. I've got Saquon who's been crushing it lately. Would you consider Saquon + Lockett for Diggs + Pollard? Gives you a proven RB1 and I get the WR upgrade I need for playoffs.",
      context: {
        whyItWorks: "This trade capitalizes on positional scarcity and timing. Your partner just lost CMC and is desperate for RB production. Saquon has been elite (RB3 overall) and provides immediate impact. Meanwhile, you upgrade from Lockett (WR24) to Diggs (WR8), giving you a true WR1 for playoffs. The value differential heavily favors you (+2.7 points), and Pollard provides decent RB depth as a sweetener.",
        personalizedMessage: "Hey! Saw CMC went down and you might need some RB help. I've got Saquon who's been crushing it lately. Would you consider Saquon + Lockett for Diggs + Pollard? Gives you a proven RB1 and I get the WR upgrade I need for playoffs.",
        timingAdvice: {
          bestTiming: "Send immediately",
          reasoning: "CMC injury creates maximum urgency. Partner likely panicking about RB depth and will overpay for security.",
          riskFactors: [
            "Partner might acquire another RB before you send",
            "Saquon's recent performance might cool off",
            "Diggs has tough playoff schedule vs top defenses",
          ],
        },
        negotiationBackup: "If they hesitate, emphasize Saquon's recent dominance (3 straight 20+ point games) and offer to throw in your best bench WR to sweeten the deal. You could also pivot to a straight Saquon for Diggs swap if they're reluctant to include Pollard.",
      },
    },
    {
      id: "2",
      partner: "Trade Masters",
      confidence: 82,
      yourPlayers: [{ id: "p3", name: "Calvin Ridley", position: "WR", value: 18.4, trend: 0.6, projectedPoints: 13.9, team: "your" }],
      theirPlayers: [{ id: "p8", name: "Josh Jacobs", position: "RB", value: 21.2, trend: 0.1, projectedPoints: 15.6, team: "their" }],
      valueDifferential: 2.8,
      reasoning: "They're stacked at RB but thin at WR. Ridley's target share trending up, perfect buy-low opportunity.",
      message: "What's up! I've been watching your team and noticed you're pretty deep at RB. I could use some help there - would you be interested in Ridley for Jacobs straight up? Ridley's been getting more targets lately and could be a nice WR2 for you.",
      context: {
        whyItWorks: "You're gaining +2.8 value points in this trade. Jacobs has been consistent (RB12 overall) with a safe floor, while Ridley is trending up with increased target share. Your partner has 4 startable RBs but only 2 reliable WRs, creating natural trade synergy. The position scarcity heavily favors RBs in your league format.",
        personalizedMessage: "What's up! I've been watching your team and noticed you're pretty deep at RB. I could use some help there - would you be interested in Ridley for Jacobs straight up? Ridley's been getting more targets lately and could be a nice WR2 for you.",
        timingAdvice: {
          bestTiming: "Send within 24 hours",
          reasoning: "Ridley just had a big game, maximizing his perceived value. Strike while his stock is high.",
          riskFactors: [
            "Ridley's target share could regress",
            "Jacobs has favorable upcoming schedule",
            "Partner might want more than 1-for-1",
          ],
        },
        negotiationBackup: "If they want more, offer to add your best bench player or pivot to a package deal. You could also wait for Ridley to have another big game to increase his trade value.",
      },
    },
    {
      id: "3",
      partner: "Playoff Bound",
      confidence: 79,
      yourPlayers: [
        { id: "p4", name: "George Kittle", position: "TE", value: 19.6, trend: 0.2, projectedPoints: 14.8, team: "your" },
        { id: "p5", name: "Courtland Sutton", position: "WR", value: 17.2, trend: -0.1, projectedPoints: 13.1, team: "your" },
      ],
      theirPlayers: [
        { id: "p9", name: "Travis Kelce", position: "TE", value: 22.4, trend: -0.3, projectedPoints: 16.2, team: "their" },
        { id: "p10", name: "Rhamondre Stevenson", position: "RB", value: 16.8, trend: 0.4, projectedPoints: 12.9, team: "their" },
      ],
      valueDifferential: 2.4,
      reasoning: "TE upgrade worth the slight downgrade elsewhere. Kelce's playoff schedule is elite.",
      message: "Hope you're doing well! I know we're both fighting for playoff position. I'd love to get Kelce for his playoff schedule - would you consider Kittle + Sutton for Kelce + Stevenson? Kittle's been solid and Sutton gives you another reliable WR option.",
      context: {
        whyItWorks: "Kelce's playoff schedule (weeks 15-17) is elite - facing bottom-5 defenses vs TEs. The TE position upgrade from Kittle to Kelce (+2.8 value) outweighs the slight downgrade from Sutton to Stevenson. You're essentially trading WR depth for TE dominance, which is valuable given TE scarcity. Net value gain of +2.4 points.",
        personalizedMessage: "Hope you're doing well! I know we're both fighting for playoff position. I'd love to get Kelce for his playoff schedule - would you consider Kittle + Sutton for Kelce + Stevenson? Kittle's been solid and Sutton gives you another reliable WR option.",
        timingAdvice: {
          bestTiming: "Send before Week 13",
          reasoning: "Playoff positioning becomes clearer soon. Strike while both teams are still fighting for seeding.",
          riskFactors: [
            "Kelce's age concerns might surface",
            "Kittle's injury history could be a deterrent",
            "Stevenson's workload might decrease",
          ],
        },
        negotiationBackup: "Emphasize Kelce's playoff matchups and your need for TE consistency. If they hesitate, offer to swap Stevenson for a different player or add a future draft pick consideration.",
      },
    },
  ]

  const calculateTotalValue = (players: Player[]) => {
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

  const handleSendTrade = (proposal: TradeProposal) => {
    setSelectedSendProposal(proposal)
    setSendTradeDialogOpen(true)
    // Copy message to clipboard
    navigator.clipboard.writeText(proposal.message)
  }

  const handleModifyTrade = (proposal: TradeProposal) => {
    setModifyingProposal({
      ...proposal,
      yourPlayers: [...proposal.yourPlayers],
      theirPlayers: [...proposal.theirPlayers]
    })
    setModifyDialogOpen(true)
  }

  const handleConfirmSend = async () => {
    if (!selectedSendProposal) return
    
    setSendingTrade(selectedSendProposal.id)
    setSendTradeDialogOpen(false)

    // Simulate sending trade
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setSentTrades((prev) => new Set([...prev, selectedSendProposal.id]))
    setSendingTrade(null)
    setSelectedSendProposal(null)
  }

  const handleSaveModification = () => {
    if (modifyingProposal) {
      // In a real app, this would regenerate the analysis based on new trade composition
      console.log("Saving modified trade:", modifyingProposal)
      setModifyDialogOpen(false)
      setModifyingProposal(null)
    }
  }

  const addPlayerToTrade = (playerId: string, side: 'your' | 'their') => {
    if (!modifyingProposal) return
    
    const player = availablePlayers.find(p => p.id === playerId)
    if (!player) return

    const updatedProposal = { ...modifyingProposal }
    
    if (side === 'your') {
      updatedProposal.yourPlayers = [...updatedProposal.yourPlayers, player]
    } else {
      updatedProposal.theirPlayers = [...updatedProposal.theirPlayers, player]
    }

    // Recalculate value differential
    const yourTotal = calculateTotalValue(updatedProposal.yourPlayers)
    const theirTotal = calculateTotalValue(updatedProposal.theirPlayers)
    updatedProposal.valueDifferential = theirTotal - yourTotal

    setModifyingProposal(updatedProposal)
  }

  const removePlayerFromTrade = (playerId: string, side: 'your' | 'their') => {
    if (!modifyingProposal) return

    const updatedProposal = { ...modifyingProposal }
    
    if (side === 'your') {
      updatedProposal.yourPlayers = updatedProposal.yourPlayers.filter(p => p.id !== playerId)
    } else {
      updatedProposal.theirPlayers = updatedProposal.theirPlayers.filter(p => p.id !== playerId)
    }

    // Recalculate value differential
    const yourTotal = calculateTotalValue(updatedProposal.yourPlayers)
    const theirTotal = calculateTotalValue(updatedProposal.theirPlayers)
    updatedProposal.valueDifferential = theirTotal - yourTotal

    setModifyingProposal(updatedProposal)
  }

  const getAvailablePlayersForSide = (side: 'your' | 'their') => {
    if (!modifyingProposal) return []
    
    const currentPlayerIds = side === 'your' 
      ? modifyingProposal.yourPlayers.map(p => p.id)
      : modifyingProposal.theirPlayers.map(p => p.id)
    
    return availablePlayers.filter(p => 
      p.team === side && !currentPlayerIds.includes(p.id)
    )
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

          <div className="grid grid-cols-1 gap-8">
            {/* Trade Proposals List */}
            <div className="space-y-6">
              {proposals.map((proposal) => (
                <Card
                  key={proposal.id}
                  className={`bg-[#1a1a1a] border-[#2a2a2a] terminal-glow transition-all ${
                    sentTrades.has(proposal.id) ? "opacity-60" : ""
                  }`}
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
                        ${proposal.valueDifferential.toFixed(1)}
                      </div>
                      <div className="text-[#94a3b8] text-xs">DOLLAR VALUE</div>
                    </div>

                    {/* Trade Details */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-xs text-[#94a3b8]">YOU_TRADE:</p>
                          <p className="font-mono text-xs text-[#ef4444]">
                            -${calculateTotalValue(proposal.yourPlayers).toFixed(1)}
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
                              <div className="text-xs text-[#94a3b8]">${player.value.toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-xs text-[#94a3b8]">YOU_RECEIVE:</p>
                          <p className="font-mono text-xs text-[#22c55e]">
                            +${calculateTotalValue(proposal.theirPlayers).toFixed(1)}
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
                              <div className="text-xs text-[#94a3b8]">${player.value.toFixed(1)}</div>
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

                    {/* Action Buttons - Always Visible */}
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
                              handleSendTrade(proposal)
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
                                navigator.clipboard.writeText(proposal.message)
                                setCopiedMessage(proposal.id)
                                setTimeout(() => setCopiedMessage(null), 2000)
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

                        {/* Trade Intelligence */}
                        <div className="space-y-4">
                          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-[#22c55e]" />
                              <p className="font-mono text-xs text-[#94a3b8]">WHY_IT_WORKS:</p>
                            </div>
                            <p className="font-mono text-sm text-[#cbd5e1] leading-relaxed">
                              {proposal.context.whyItWorks}
                            </p>
                          </div>

                          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <Clock className="h-4 w-4 text-[#f59e0b]" />
                              <p className="font-mono text-xs text-[#94a3b8]">TIMING_ADVICE:</p>
                            </div>
                            <p className="font-mono text-sm text-[#22c55e] mb-2">
                              {proposal.context.timingAdvice.bestTiming}
                            </p>
                            <p className="font-mono text-xs text-[#cbd5e1] mb-3">
                              {proposal.context.timingAdvice.reasoning}
                            </p>

                            {proposal.context.timingAdvice.riskFactors.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <AlertTriangle className="h-3 w-3 text-[#ef4444]" />
                                  <p className="font-mono text-xs text-[#ef4444]">RISK_FACTORS:</p>
                                </div>
                                {proposal.context.timingAdvice.riskFactors.map((risk, index) => (
                                  <p key={index} className="font-mono text-xs text-[#94a3b8] ml-5">
                                    • {risk}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>

                          {proposal.context.negotiationBackup && (
                            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                              <p className="font-mono text-xs text-[#94a3b8] mb-2">NEGOTIATION_BACKUP:</p>
                              <p className="font-mono text-sm text-[#cbd5e1] leading-relaxed">
                                {proposal.context.negotiationBackup}
                              </p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Send Trade Dialog */}
      <Dialog open={sendTradeDialogOpen} onOpenChange={setSendTradeDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-[#22c55e]">
              SEND_TRADE: {selectedSendProposal?.partner}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {selectedSendProposal && (
              <>
                {/* Trade Summary */}
                <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                    <div>
                      <p className="text-[#94a3b8] mb-2">YOU_TRADE:</p>
                      {selectedSendProposal.yourPlayers.map((player, index) => (
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
                      {selectedSendProposal.theirPlayers.map((player, index) => (
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

                {/* Message (Already Copied) */}
                <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Check className="h-4 w-4 text-[#22c55e]" />
                    <p className="font-mono text-xs text-[#22c55e]">MESSAGE_COPIED_TO_CLIPBOARD</p>
                  </div>
                  <p className="font-mono text-sm text-[#cbd5e1] leading-relaxed">
                    {selectedSendProposal.message}
                  </p>
                </div>

                {/* Partner Account Status */}
                {partnerHasAccount ? (
                  <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Check className="h-4 w-4 text-[#22c55e]" />
                      <p className="font-mono text-xs text-[#22c55e]">PARTNER_HAS_ACCOUNT</p>
                    </div>
                    <p className="font-mono text-sm text-[#cbd5e1]">
                      This trade will be sent directly to {selectedSendProposal.partner}'s proposals list.
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserPlus className="h-4 w-4 text-[#f59e0b]" />
                      <p className="font-mono text-xs text-[#f59e0b]">PARTNER_NOT_ON_APP</p>
                    </div>
                    <p className="font-mono text-sm text-[#cbd5e1] mb-3">
                      {selectedSendProposal.partner} doesn't have an account yet. You can copy the message and invite them to join.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {partnerHasAccount ? (
                    <Button
                      onClick={handleConfirmSend}
                      className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      CONFIRM_SEND
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedSendProposal.message)
                          // In real app, would copy invite link
                        }}
                        className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        COPY_MESSAGE
                      </Button>
                      <Button
                        onClick={() => {
                          // In real app, would send invite
                          console.log("Sending invite to", selectedSendProposal.partner)
                        }}
                        className="flex-1 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono font-semibold"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        INVITE_TO_APP
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => setSendTradeDialogOpen(false)}
                    variant="outline"
                    className="border-[#2a2a2a] text-[#cbd5e1] hover:bg-[#2a2a2a] bg-transparent font-mono"
                  >
                    CANCEL
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modify Trade Dialog */}
      <Dialog open={modifyDialogOpen} onOpenChange={setModifyDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono text-[#22c55e]">
              MODIFY_TRADE: {modifyingProposal?.partner}
            </DialogTitle>
          </DialogHeader>

          {modifyingProposal && (
            <div className="space-y-6">
              {/* Real-time Value Display */}
              <div className="text-center font-mono bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                <div className="text-[#94a3b8] text-xs mb-1">CURRENT_VALUE_DIFFERENTIAL</div>
                <div
                  className={`font-bold text-3xl ${
                    modifyingProposal.valueDifferential > 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                  }`}
                >
                  {modifyingProposal.valueDifferential > 0 ? "+" : ""}
                  ${modifyingProposal.valueDifferential.toFixed(1)}
                </div>
                <div className="text-[#94a3b8] text-xs">DOLLAR VALUE</div>
              </div>

              {/* Trade Modification Interface */}
              <div className="grid grid-cols-2 gap-6">
                {/* Your Players */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-[#94a3b8]">YOUR_PLAYERS:</p>
                    <p className="font-mono text-xs text-[#ef4444]">
                      -${calculateTotalValue(modifyingProposal.yourPlayers).toFixed(1)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {modifyingProposal.yourPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="font-mono text-sm text-[#cbd5e1] bg-[#0f0f0f] px-3 py-2 rounded border border-[#2a2a2a] flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{player.name}</span>
                          <Badge variant="outline" className={`font-mono text-xs ${getPositionColor(player.position)}`}>
                            {player.position}
                          </Badge>
                          <span className="text-xs text-[#94a3b8]">${player.value.toFixed(1)}</span>
                        </div>
                        <Button
                          onClick={() => removePlayerFromTrade(player.id, 'your')}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add Player Dropdown */}
                  <Select onValueChange={(playerId) => addPlayerToTrade(playerId, 'your')}>
                    <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white font-mono">
                      <SelectValue placeholder="ADD_PLAYER" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      {getAvailablePlayersForSide('your').map((player) => (
                        <SelectItem key={player.id} value={player.id} className="font-mono">
                          {player.name} ({player.position}) - ${player.value.toFixed(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Their Players */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-[#94a3b8]">THEIR_PLAYERS:</p>
                    <p className="font-mono text-xs text-[#22c55e]">
                      +${calculateTotalValue(modifyingProposal.theirPlayers).toFixed(1)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {modifyingProposal.theirPlayers.map((player) => (
                      <div
                        key={player.id}
                        className="font-mono text-sm text-[#22c55e] bg-[#22c55e]/5 px-3 py-2 rounded border border-[#22c55e]/20 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{player.name}</span>
                          <Badge variant="outline" className={`font-mono text-xs ${getPositionColor(player.position)}`}>
                            {player.position}
                          </Badge>
                          <span className="text-xs text-[#94a3b8]">${player.value.toFixed(1)}</span>
                        </div>
                        <Button
                          onClick={() => removePlayerFromTrade(player.id, 'their')}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-[#ef4444] hover:text-[#dc2626] hover:bg-[#ef4444]/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Add Player Dropdown */}
                  <Select onValueChange={(playerId) => addPlayerToTrade(playerId, 'their')}>
                    <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] text-white font-mono">
                      <SelectValue placeholder="ADD_PLAYER" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                      {getAvailablePlayersForSide('their').map((player) => (
                        <SelectItem key={player.id} value={player.id} className="font-mono">
                          {player.name} ({player.position}) - ${player.value.toFixed(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
