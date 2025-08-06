"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Terminal, LogOut, Heart, Check, X, Clock, Send, MessageSquare } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DonateModal } from "@/components/donate-modal"

interface TradeProposal {
  id: string
  type: "sent" | "received"
  partner: string
  status: "pending" | "accepted" | "declined"
  yourPlayers: Array<{
    name: string
    position: string
  }>
  theirPlayers: Array<{
    name: string
    position: string
  }>
  dateSent: string
  message?: string
}

export default function MyProposalsPage() {
  const [showDonateModal, setShowDonateModal] = useState(false)
  const router = useRouter()

  // Mock proposals data
  const proposals: TradeProposal[] = [
    {
      id: "1",
      type: "sent",
      partner: "Fantasy Legends",
      status: "pending",
      yourPlayers: [
        { name: "Saquon Barkley", position: "RB" },
        { name: "Tyler Lockett", position: "WR" },
      ],
      theirPlayers: [
        { name: "Stefon Diggs", position: "WR" },
        { name: "Tony Pollard", position: "RB" },
      ],
      dateSent: "2024-01-15",
      message: "Hey! Saw CMC went down and you might need some RB help. I've got Saquon who's been crushing it lately. Would you consider Saquon + Lockett for Diggs + Pollard?",
    },
    {
      id: "2",
      type: "received",
      partner: "Trade Masters",
      status: "pending",
      yourPlayers: [
        { name: "Calvin Ridley", position: "WR" },
      ],
      theirPlayers: [
        { name: "Josh Jacobs", position: "RB" },
      ],
      dateSent: "2024-01-14",
      message: "Interested in swapping Ridley for Jacobs? I need WR depth and you could use RB help.",
    },
    {
      id: "3",
      type: "sent",
      partner: "Playoff Bound",
      status: "accepted",
      yourPlayers: [
        { name: "George Kittle", position: "TE" },
      ],
      theirPlayers: [
        { name: "Travis Kelce", position: "TE" },
      ],
      dateSent: "2024-01-12",
      message: "Straight TE swap - Kittle for Kelce. What do you think?",
    },
    {
      id: "4",
      type: "received",
      partner: "Defense Dynasty",
      status: "declined",
      yourPlayers: [
        { name: "Justin Jefferson", position: "WR" },
      ],
      theirPlayers: [
        { name: "Derrick Henry", position: "RB" },
        { name: "Mike Evans", position: "WR" },
      ],
      dateSent: "2024-01-10",
      message: "Jefferson for Henry + Evans - interested?",
    },
  ]

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
        return "text-[#cbd5e1] border-[#cbd5e1]"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20 font-mono text-xs">
          <Clock className="mr-1 h-3 w-3" />
          PENDING
        </Badge>
      case "accepted":
        return <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 font-mono text-xs">
          <Check className="mr-1 h-3 w-3" />
          ACCEPTED
        </Badge>
      case "declined":
        return <Badge className="bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20 font-mono text-xs">
          <X className="mr-1 h-3 w-3" />
          DECLINED
        </Badge>
      default:
        return null
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleAcceptTrade = (proposalId: string) => {
    // In a real app, this would make an API call to accept the trade
    console.log("Accepting trade:", proposalId)
  }

  const handleDeclineTrade = (proposalId: string) => {
    // In a real app, this would make an API call to decline the trade
    console.log("Declining trade:", proposalId)
  }

  const sentProposals = proposals.filter(p => p.type === "sent")
  const receivedProposals = proposals.filter(p => p.type === "received")
  const pendingReceived = receivedProposals.filter(p => p.status === "pending")

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
                MY_PROPOSALS
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="font-mono text-sm text-[#94a3b8]">
                PENDING: <span className="text-[#f59e0b] font-semibold">{pendingReceived.length}</span>
              </div>
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

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-mono text-3xl font-bold text-[#22c55e] mb-2">MY_PROPOSALS</h1>
            <p className="font-mono text-sm text-[#94a3b8]">MANAGE_SENT_AND_RECEIVED_TRADES</p>
          </div>

          {/* Tabs for Sent/Received */}
          <Tabs defaultValue="received" className="space-y-6">
            <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
              <TabsTrigger 
                value="received" 
                className="font-mono text-sm data-[state=active]:bg-[#22c55e] data-[state=active]:text-black"
              >
                RECEIVED ({receivedProposals.length})
              </TabsTrigger>
              <TabsTrigger 
                value="sent" 
                className="font-mono text-sm data-[state=active]:bg-[#22c55e] data-[state=active]:text-black"
              >
                SENT ({sentProposals.length})
              </TabsTrigger>
            </TabsList>

            {/* Received Proposals */}
            <TabsContent value="received" className="space-y-6">
              {receivedProposals.length > 0 ? (
                receivedProposals.map((proposal) => (
                  <Card key={proposal.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-mono text-[#cbd5e1] flex items-center space-x-3">
                          <MessageSquare className="h-5 w-5 text-[#22c55e]" />
                          <span>FROM: {proposal.partner}</span>
                        </CardTitle>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(proposal.status)}
                          <div className="font-mono text-xs text-[#94a3b8]">{proposal.dateSent}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Trade Details */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="font-mono text-xs text-[#94a3b8]">YOU_GIVE:</p>
                          <div className="space-y-1">
                            {proposal.yourPlayers.map((player, index) => (
                              <div
                                key={index}
                                className="font-mono text-sm text-[#ef4444] bg-[#ef4444]/5 px-3 py-2 rounded border border-[#ef4444]/20 flex items-center space-x-2"
                              >
                                <Badge
                                  variant="outline"
                                  className={`font-mono text-xs ${getPositionColor(player.position)}`}
                                >
                                  {player.position}
                                </Badge>
                                <span>{player.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="font-mono text-xs text-[#94a3b8]">YOU_GET:</p>
                          <div className="space-y-1">
                            {proposal.theirPlayers.map((player, index) => (
                              <div
                                key={index}
                                className="font-mono text-sm text-[#22c55e] bg-[#22c55e]/5 px-3 py-2 rounded border border-[#22c55e]/20 flex items-center space-x-2"
                              >
                                <Badge
                                  variant="outline"
                                  className={`font-mono text-xs ${getPositionColor(player.position)}`}
                                >
                                  {player.position}
                                </Badge>
                                <span>{player.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      {proposal.message && (
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                          <p className="font-mono text-xs text-[#94a3b8] mb-2">MESSAGE:</p>
                          <p className="font-mono text-sm text-[#cbd5e1]">{proposal.message}</p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {proposal.status === "pending" && (
                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => handleAcceptTrade(proposal.id)}
                            className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            ACCEPT_TRADE
                          </Button>
                          <Button
                            onClick={() => handleDeclineTrade(proposal.id)}
                            variant="outline"
                            className="flex-1 border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white bg-transparent font-mono"
                          >
                            <X className="mr-2 h-4 w-4" />
                            DECLINE
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardContent className="pt-6 text-center py-12">
                    <MessageSquare className="h-16 w-16 text-[#2a2a2a] mx-auto mb-4" />
                    <p className="font-mono text-sm text-[#94a3b8]">
                      No received proposals yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Sent Proposals */}
            <TabsContent value="sent" className="space-y-6">
              {sentProposals.length > 0 ? (
                sentProposals.map((proposal) => (
                  <Card key={proposal.id} className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-mono text-[#cbd5e1] flex items-center space-x-3">
                          <Send className="h-5 w-5 text-[#22c55e]" />
                          <span>TO: {proposal.partner}</span>
                        </CardTitle>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(proposal.status)}
                          <div className="font-mono text-xs text-[#94a3b8]">{proposal.dateSent}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Trade Details */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="font-mono text-xs text-[#94a3b8]">YOU_OFFERED:</p>
                          <div className="space-y-1">
                            {proposal.yourPlayers.map((player, index) => (
                              <div
                                key={index}
                                className="font-mono text-sm text-[#ef4444] bg-[#ef4444]/5 px-3 py-2 rounded border border-[#ef4444]/20 flex items-center space-x-2"
                              >
                                <Badge
                                  variant="outline"
                                  className={`font-mono text-xs ${getPositionColor(player.position)}`}
                                >
                                  {player.position}
                                </Badge>
                                <span>{player.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="font-mono text-xs text-[#94a3b8]">FOR:</p>
                          <div className="space-y-1">
                            {proposal.theirPlayers.map((player, index) => (
                              <div
                                key={index}
                                className="font-mono text-sm text-[#22c55e] bg-[#22c55e]/5 px-3 py-2 rounded border border-[#22c55e]/20 flex items-center space-x-2"
                              >
                                <Badge
                                  variant="outline"
                                  className={`font-mono text-xs ${getPositionColor(player.position)}`}
                                >
                                  {player.position}
                                </Badge>
                                <span>{player.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      {proposal.message && (
                        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                          <p className="font-mono text-xs text-[#94a3b8] mb-2">YOUR_MESSAGE:</p>
                          <p className="font-mono text-sm text-[#cbd5e1]">{proposal.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <CardContent className="pt-6 text-center py-12">
                    <Send className="h-16 w-16 text-[#2a2a2a] mx-auto mb-4" />
                    <p className="font-mono text-sm text-[#94a3b8] mb-4">
                      No sent proposals yet
                    </p>
                    <Link href="/trades">
                      <Button className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-semibold">
                        FIND_TRADES
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Donate Modal */}
      <DonateModal open={showDonateModal} onOpenChange={setShowDonateModal} />
    </div>
  )
}
