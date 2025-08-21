"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { TrendingUp, ChevronDown, Copy, Target, BarChart3, TrendingDown, Edit, Send, Check } from "lucide-react"

interface TradeProposal {
  id: string
  partner: string
  confidence: number
  yourPlayers: Array<{
    name: string
    position: string
    value: number
    trend: number
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
      valueDifferential: 2.7,
      reasoning: "Partner needs RB depth after CMC injury. You’re deep at RB and need WR1 upside.",
      message:
        "Hey! Saw CMC went down and you might need some RB help. I've got Saquon who's been crushing it lately. Would you consider Saquon + Lockett for Diggs + Pollard?",
      context: {
        whyItWorks:
          "Positional scarcity and timing. Saquon provides immediate RB impact. You upgrade from Lockett to Diggs.",
        personalizedMessage:
          "Hey! Saw CMC went down and you might need some RB help. I've got Saquon—would you consider Saquon + Lockett for Diggs + Pollard?",
        timingAdvice: {
          bestTiming: "Send immediately",
          reasoning: "CMC injury creates urgency.",
          riskFactors: ["They add another RB", "Saquon cools off", "Diggs playoff schedule is tough"],
        },
        negotiationBackup: "Offer a bench WR if needed.",
      },
    },
    {
      id: "2",
      partner: "Trade Masters",
      confidence: 82,
      yourPlayers: [{ name: "Calvin Ridley", position: "WR", value: 18.4, trend: 0.6, projectedPoints: 13.9 }],
      theirPlayers: [{ name: "Josh Jacobs", position: "RB", value: 21.2, trend: 0.1, projectedPoints: 15.6 }],
      valueDifferential: 2.8,
      reasoning: "They’re stacked at RB but thin at WR. Ridley trending up — good timing.",
      message:
        "What's up! You're deep at RB. Ridley for Jacobs straight up? Ridley's targets are up and he can be a solid WR2.",
      context: {
        whyItWorks: "You gain +2.8 value and balance positions.",
        personalizedMessage:
          "What's up! You're deep at RB. Ridley for Jacobs straight up? Ridley's targets are up and he can be a solid WR2.",
        timingAdvice: {
          bestTiming: "Within 24 hours",
          reasoning: "Ridley just had a big game — strike while hot.",
          riskFactors: ["Ridley regression", "Jacobs soft schedule", "They want add-ons"],
        },
        negotiationBackup: "Add a bench piece if they hesitate.",
      },
    },
  ]

  const copyMessage = (message: string, proposalId: string) => {
    navigator.clipboard.writeText(message)
    setCopiedMessage(proposalId)
    setTimeout(() => setCopiedMessage(null), 2000)
  }

  const calculateTotalValue = (players: Array<{ value: number }>) =>
    players.reduce((sum, player) => sum + player.value, 0)

  const getTrendIcon = (trend: number) => {
    if (trend > 0.3) return <TrendingUp className="h-3 w-3" style={{ color: "#00FF85" }} />
    if (trend < -0.3) return <TrendingDown className="h-3 w-3" style={{ color: "#FF3B30" }} />
    return <div className="h-3 w-3 rounded-full" style={{ background: "#94A3B8" }} />
  }

  const getPositionStyle = (position: string) => {
    switch (position) {
      case "QB":
        return { color: "#FF3B30", borderColor: "#FF3B30" }
      case "RB":
        return { color: "#00FF85", borderColor: "#00FF85" }
      case "WR":
        return { color: "#38BDF8", borderColor: "#38BDF8" }
      case "TE":
        return { color: "#F59E0B", borderColor: "#F59E0B" }
      case "K":
        return { color: "#94A3B8", borderColor: "#94A3B8" }
      case "DST":
        return { color: "#8B5CF6", borderColor: "#8B5CF6" }
      default:
        return { color: "#94A3B8", borderColor: "#94A3B8" }
    }
  }

  const handleModifyTrade = (proposal: TradeProposal) => {
    setModifyingProposal(proposal)
    setCustomMessage(proposal.message)
    setModifyDialogOpen(true)
  }

  const handleSendTrade = async (proposalId: string) => {
    setSendingTrade(proposalId)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setSentTrades((prev) => new Set([...prev, proposalId]))
    setSendingTrade(null)
  }

  const handleSaveModification = () => {
    if (modifyingProposal) {
      console.log("Updated message:", customMessage)
      setModifyDialogOpen(false)
      setModifyingProposal(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0E0F11", color: "#E5E7EB" }}>
      <div className="py-8">
        <div className="max-w-[1280px] mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-mono text-2xl font-bold uppercase" style={{ color: "#00FF85" }}>
              Trade Proposals
            </h1>
            <p className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
              Proposals:{" "}
              <span className="font-semibold" style={{ color: "#00FF85" }}>
                {proposals.length}
              </span>
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card style={{ background: "#121417", borderColor: "#2E2E2E" }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                      Total Value Gain
                    </p>
                    <p className="font-mono text-2xl font-bold" style={{ color: "#00FF85" }}>
                      +{proposals.reduce((sum, p) => sum + p.valueDifferential, 0).toFixed(1)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8" style={{ color: "#00FF85" }} />
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: "#121417", borderColor: "#2E2E2E" }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                      Avg Value Delta
                    </p>
                    <p className="font-mono text-2xl font-bold" style={{ color: "#00FF85" }}>
                      +{(proposals.reduce((sum, p) => sum + p.valueDifferential, 0) / proposals.length).toFixed(1)}
                    </p>
                  </div>
                  <Target className="h-8 w-8" style={{ color: "#00FF85" }} />
                </div>
              </CardContent>
            </Card>

            <Card style={{ background: "#121417", borderColor: "#2E2E2E" }}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                      Positive Trades
                    </p>
                    <p className="font-mono text-2xl font-bold" style={{ color: "#00FF85" }}>
                      {proposals.filter((p) => p.valueDifferential > 0).length}/{proposals.length}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8" style={{ color: "#00FF85" }} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Proposals List */}
            <div className="lg:col-span-2 space-y-6">
              {proposals.map((proposal) => (
                <Card
                  key={proposal.id}
                  style={{
                    background: "#121417",
                    borderColor: sentTrades.has(proposal.id) ? "rgba(46,46,46,0.7)" : "#2E2E2E",
                  }}
                  className={`cursor-pointer transition-all ${sentTrades.has(proposal.id) ? "opacity-70" : ""}`}
                  onClick={() => setSelectedProposal(proposal)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5" style={{ color: "#00FF85" }} />
                        <CardTitle className="font-mono" style={{ color: "#D1D5DB" }}>
                          {proposal.partner}
                        </CardTitle>
                        {sentTrades.has(proposal.id) ? (
                          <Badge
                            className="font-mono text-[10px]"
                            style={{
                              background: "rgba(0,255,133,0.12)",
                              color: "#00FF85",
                              borderColor: "rgba(0,255,133,0.22)",
                            }}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Sent
                          </Badge>
                        ) : (
                          <Badge
                            className="font-mono text-[10px]"
                            style={{
                              background:
                                proposal.valueDifferential > 0 ? "rgba(0,255,133,0.12)" : "rgba(255,59,48,0.12)",
                              color: proposal.valueDifferential > 0 ? "#00FF85" : "#FF3B30",
                              borderColor:
                                proposal.valueDifferential > 0 ? "rgba(0,255,133,0.22)" : "rgba(255,59,48,0.22)",
                            }}
                          >
                            {proposal.valueDifferential > 0 ? "+" : ""}
                            {proposal.valueDifferential.toFixed(1)} Value
                          </Badge>
                        )}
                      </div>
                      <Collapsible open={expandedProposal === proposal.id}>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedProposal(expandedProposal === proposal.id ? null : proposal.id)
                            }}
                            className="font-mono text-[11px]"
                            style={{ color: "#9AA4B2" }}
                          >
                            {expandedProposal === proposal.id ? "Collapse" : "Expand"}
                            <ChevronDown
                              className={`ml-2 h-4 w-4 transition-transform ${expandedProposal === proposal.id ? "rotate-180" : ""}`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      </Collapsible>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Value Differential */}
                    <div className="text-center font-mono">
                      <div className="text-[11px] mb-1" style={{ color: "#9AA4B2" }}>
                        Value Differential
                      </div>
                      <div
                        className="font-bold text-3xl"
                        style={{ color: proposal.valueDifferential > 0 ? "#00FF85" : "#FF3B30" }}
                      >
                        {proposal.valueDifferential > 0 ? "+" : ""}
                        {proposal.valueDifferential.toFixed(1)}
                      </div>
                      <div className="text-[11px]" style={{ color: "#9AA4B2" }}>
                        Fantasy Points
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[11px]" style={{ color: "#9AA4B2" }}>
                            You Trade:
                          </p>
                          <p className="font-mono text-[11px]" style={{ color: "#FF3B30" }}>
                            -{calculateTotalValue(proposal.yourPlayers).toFixed(1)} pts
                          </p>
                        </div>
                        <div className="space-y-1">
                          {proposal.yourPlayers.map((player, index) => (
                            <div
                              key={index}
                              className="font-mono text-sm px-3 py-2 rounded-[2px] border flex items-center justify-between"
                              style={{ color: "#D1D5DB", background: "#0E0F11", borderColor: "#2E2E2E" }}
                            >
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="font-semibold">{player.name}</span>
                                  <Badge
                                    variant="outline"
                                    className="ml-2 font-mono text-[10px]"
                                    style={getPositionStyle(player.position)}
                                  >
                                    {player.position}
                                  </Badge>
                                </div>
                                {getTrendIcon(player.trend)}
                              </div>
                              <div className="text-[11px]" style={{ color: "#9AA4B2" }}>
                                {player.value.toFixed(1)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[11px]" style={{ color: "#9AA4B2" }}>
                            You Receive:
                          </p>
                          <p className="font-mono text-[11px]" style={{ color: "#00FF85" }}>
                            +{calculateTotalValue(proposal.theirPlayers).toFixed(1)} pts
                          </p>
                        </div>
                        <div className="space-y-1">
                          {proposal.theirPlayers.map((player, index) => (
                            <div
                              key={index}
                              className="font-mono text-sm px-3 py-2 rounded-[2px] border flex items-center justify-between"
                              style={{
                                color: "#00FF85",
                                background: "rgba(0,255,133,0.06)",
                                borderColor: "rgba(0,255,133,0.22)",
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div>
                                  <span className="font-semibold">{player.name}</span>
                                  <Badge
                                    variant="outline"
                                    className="ml-2 font-mono text-[10px]"
                                    style={getPositionStyle(player.position)}
                                  >
                                    {player.position}
                                  </Badge>
                                </div>
                                {getTrendIcon(player.trend)}
                              </div>
                              <div className="text-[11px]" style={{ color: "#9AA4B2" }}>
                                {player.value.toFixed(1)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Reasoning */}
                    <div className="rounded-[2px] p-4" style={{ background: "#0E0F11", border: "1px solid #2E2E2E" }}>
                      <p className="font-mono text-[11px] mb-2" style={{ color: "#9AA4B2" }}>
                        Trade Logic
                      </p>
                      <p className="font-mono text-sm" style={{ color: "#D1D5DB" }}>
                        {proposal.reasoning}
                      </p>
                    </div>

                    {/* Expanded Details */}
                    <Collapsible open={expandedProposal === proposal.id}>
                      <CollapsibleContent className="space-y-4">
                        <div
                          className="rounded-[2px] p-4"
                          style={{ background: "#0E0F11", border: "1px solid #2E2E2E" }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-mono text-[11px]" style={{ color: "#9AA4B2" }}>
                              Trade Message
                            </p>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyMessage(proposal.message, proposal.id)
                              }}
                              size="sm"
                              variant="ghost"
                              className="font-mono text-[11px] h-auto p-1"
                              style={{ color: "#00FF85" }}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              {copiedMessage === proposal.id ? "Copied!" : "Copy"}
                            </Button>
                          </div>
                          <p className="font-mono text-sm leading-relaxed" style={{ color: "#D1D5DB" }}>
                            {proposal.message}
                          </p>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      {sentTrades.has(proposal.id) ? (
                        <Button
                          disabled
                          className="flex-1 font-mono font-semibold"
                          style={{ background: "rgba(0,255,133,0.18)", color: "#00FF85" }}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Trade Sent
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSendTrade(proposal.id)
                            }}
                            disabled={sendingTrade === proposal.id}
                            className="flex-1 font-mono font-semibold"
                            style={{ background: "#00FF85", color: "#000" }}
                          >
                            {sendingTrade === proposal.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Send Trade
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleModifyTrade(proposal)
                            }}
                            variant="outline"
                            className="font-mono"
                            style={{ borderColor: "#2E2E2E", color: "#D1D5DB", background: "transparent" }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modify
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Intelligence Panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <Card style={{ background: "#121417", borderColor: "#2E2E2E" }}>
                  <CardHeader>
                    <CardTitle className="font-mono uppercase text-sm" style={{ color: "#00FF85" }}>
                      Trade Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProposal ? (
                      <div className="space-y-4">
                        <div
                          className="rounded-[2px] p-4"
                          style={{ background: "#0E0F11", border: "1px solid #2E2E2E" }}
                        >
                          <p className="font-mono text-[11px] mb-2" style={{ color: "#9AA4B2" }}>
                            Why It Works
                          </p>
                          <p className="font-mono text-sm" style={{ color: "#D1D5DB" }}>
                            {selectedProposal.context.whyItWorks}
                          </p>
                        </div>
                        <div
                          className="rounded-[2px] p-4"
                          style={{ background: "#0E0F11", border: "1px solid #2E2E2E" }}
                        >
                          <p className="font-mono text-[11px] mb-2" style={{ color: "#9AA4B2" }}>
                            Timing Advice
                          </p>
                          <p className="font-mono text-sm mb-1" style={{ color: "#00FF85" }}>
                            {selectedProposal.context.timingAdvice.bestTiming}
                          </p>
                          <p className="font-mono text-[11px]" style={{ color: "#D1D5DB" }}>
                            {selectedProposal.context.timingAdvice.reasoning}
                          </p>
                        </div>
                        {selectedProposal.context.negotiationBackup && (
                          <div
                            className="rounded-[2px] p-4"
                            style={{ background: "#0E0F11", border: "1px solid #2E2E2E" }}
                          >
                            <p className="font-mono text-[11px] mb-2" style={{ color: "#9AA4B2" }}>
                              Negotiation Backup
                            </p>
                            <p className="font-mono text-sm" style={{ color: "#D1D5DB" }}>
                              {selectedProposal.context.negotiationBackup}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="font-mono text-sm" style={{ color: "#9AA4B2" }}>
                          Select a proposal to view details
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

      {/* Modify Dialog */}
      <Dialog open={modifyDialogOpen} onOpenChange={setModifyDialogOpen}>
        <DialogContent
          className="max-w-2xl"
          style={{ background: "#121417", borderColor: "#2E2E2E", color: "#E5E7EB" }}
        >
          <DialogHeader>
            <DialogTitle className="font-mono uppercase text-sm" style={{ color: "#00FF85" }}>
              Modify Trade: {modifyingProposal?.partner}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {modifyingProposal && (
              <div className="rounded-[2px] p-4" style={{ background: "#0E0F11", border: "1px solid #2E2E2E" }}>
                <div className="grid grid-cols-2 gap-4 font-mono text-sm">
                  <div>
                    <p className="text-[11px] mb-2" style={{ color: "#9AA4B2" }}>
                      You Trade
                    </p>
                    {modifyingProposal.yourPlayers.map((player, index) => (
                      <div key={index} className="flex items-center gap-2" style={{ color: "#D1D5DB" }}>
                        <span>{player.name}</span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                          style={getPositionStyle(player.position)}
                        >
                          {player.position}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[11px] mb-2" style={{ color: "#9AA4B2" }}>
                      You Receive
                    </p>
                    {modifyingProposal.theirPlayers.map((player, index) => (
                      <div key={index} className="flex items-center gap-2" style={{ color: "#00FF85" }}>
                        <span>{player.name}</span>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px]"
                          style={getPositionStyle(player.position)}
                        >
                          {player.position}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                Custom Message
              </Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[120px] resize-none font-mono text-sm"
                style={{ background: "#0E0F11", borderColor: "#2E2E2E", color: "#E5E7EB" }}
                placeholder="Customize your trade message..."
                maxLength={500}
              />
              <p className="font-mono text-[11px]" style={{ color: "#9AA4B2" }}>
                {customMessage.length}/500 characters
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveModification}
                className="flex-1 font-mono font-semibold"
                style={{ background: "#00FF85", color: "#000" }}
              >
                Save Changes
              </Button>
              <Button
                onClick={() => setModifyDialogOpen(false)}
                variant="outline"
                className="font-mono"
                style={{ borderColor: "#2E2E2E", color: "#D1D5DB", background: "transparent" }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
