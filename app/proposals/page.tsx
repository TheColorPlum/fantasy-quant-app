"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Eye } from "lucide-react"
import { useProposalsStore, type Proposal } from "@/lib/proposals-store"
import { useRouter } from "next/navigation"

const VIEWER_TEAM_ID = "team1"

const TEAM_NAMES: Record<string, string> = {
  team1: "Your Team",
  team2: "Fantasy Kings",
  team3: "Gridiron Heroes",
}

export default function ProposalsPage() {
  const router = useRouter()

  // 1) Trigger rehydrate after first client render
  useEffect(() => {
    useProposalsStore.persist.rehydrate()
  }, [])

  // 2) Hydration flag
  const hydrated = useProposalsStore((s) => s._hydrated)

  // 3) Stable snapshot before hydration (EMPTY never changes)
  const EMPTY: Proposal[] = []
  const proposals = useProposalsStore((s) => (s._hydrated ? s.proposals : EMPTY))

  // 4) Actions
  const accept = useProposalsStore((s) => s.accept)
  const decline = useProposalsStore((s) => s.decline)
  const send = useProposalsStore((s) => s.send)

  // 5) Derive inbox/outbox when proposals changes
  const [inbox, setInbox] = useState<Proposal[]>([])
  const [outbox, setOutbox] = useState<Proposal[]>([])

  const sortByCreatedDesc = useCallback((a: Proposal, b: Proposal) => b.createdAt.localeCompare(a.createdAt), [])

  useEffect(() => {
    const inb = proposals
      .filter((p) => p.toTeamId === VIEWER_TEAM_ID)
      .slice()
      .sort(sortByCreatedDesc)
    const outb = proposals
      .filter((p) => p.fromTeamId === VIEWER_TEAM_ID)
      .slice()
      .sort(sortByCreatedDesc)
    setInbox(inb)
    setOutbox(outb)
  }, [proposals, sortByCreatedDesc])

  // 6) Your existing local UI state & handlers (unchanged except wiring)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)

  const copyMessage = useCallback((message: string, id: string) => {
    if (!message) return
    navigator.clipboard.writeText(message)
    setCopiedMessage(id)
    setTimeout(() => setCopiedMessage(null), 2000)
  }, [])

  const onAccept = useCallback((id: string) => accept(id), [accept])
  const onDecline = useCallback((id: string) => decline(id), [decline])
  const onSend = useCallback((id: string) => send(id), [send])
  const onCounter = useCallback(
    (proposalId: string) => {
      router.push(`/trades?counter=${proposalId}`)
    },
    [router],
  )

  const openDetail = useCallback((p: Proposal) => {
    setSelectedProposal(p)
    setDetailDialogOpen(true)
  }, [])

  const getStatusColor = (status: Proposal["status"]) => {
    switch (status) {
      case "draft":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "sent":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "accepted":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "declined":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "countered":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getPartnerName = (proposal: Proposal, isInbox: boolean) => {
    const partnerId = isInbox ? proposal.fromTeamId : proposal.toTeamId
    return TEAM_NAMES[partnerId] || proposal.partner || "Unknown Team"
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Proposals</h1>
              <p className="text-sm text-muted-foreground">Inbox & Outbox</p>
            </div>
            <Button onClick={() => router.push("/trades")} className="gap-2">
              <Plus className="h-4 w-4" />
              New Proposal
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox">Inbox ({inbox.length})</TabsTrigger>
            <TabsTrigger value="outbox">Outbox ({outbox.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="space-y-4">
            {inbox.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No incoming proposals</p>
                </CardContent>
              </Card>
            ) : (
              inbox.map((proposal) => (
                <Card key={proposal.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">From: {getPartnerName(proposal, true)}</h3>
                        <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDetail(proposal)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {proposal.status === "sent" && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => onCounter(proposal.id)}>
                              Counter
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onDecline(proposal.id)}>
                              Decline
                            </Button>
                            <Button size="sm" onClick={() => onAccept(proposal.id)}>
                              Accept
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">You Get</h4>
                        <div className="space-y-1">
                          {proposal.theirPlayers.map((player) => (
                            <div key={player.id} className="text-sm">
                              {player.name} ({player.position})
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">You Give</h4>
                        <div className="space-y-1">
                          {proposal.yourPlayers.map((player) => (
                            <div key={player.id} className="text-sm">
                              {player.name} ({player.position})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {proposal.message && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm">{proposal.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="outbox" className="space-y-4">
            {outbox.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No outgoing proposals</p>
                </CardContent>
              </Card>
            ) : (
              outbox.map((proposal) => (
                <Card key={proposal.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">To: {getPartnerName(proposal, false)}</h3>
                        <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openDetail(proposal)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {proposal.status === "draft" && (
                          <Button size="sm" onClick={() => onSend(proposal.id)}>
                            Send
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">You Give</h4>
                        <div className="space-y-1">
                          {proposal.yourPlayers.map((player) => (
                            <div key={player.id} className="text-sm">
                              {player.name} ({player.position})
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">You Get</h4>
                        <div className="space-y-1">
                          {proposal.theirPlayers.map((player) => (
                            <div key={player.id} className="text-sm">
                              {player.name} ({player.position})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {proposal.message && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm">{proposal.message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          if (open !== detailDialogOpen) setDetailDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trade Proposal Details</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">You Give</h4>
                  <div className="space-y-2">
                    {selectedProposal.yourPlayers.map((player) => (
                      <div key={player.id} className="flex justify-between items-center p-2 border rounded">
                        <span>
                          {player.name} ({player.position})
                        </span>
                        <span className="font-mono text-sm">{player.value.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">You Get</h4>
                  <div className="space-y-2">
                    {selectedProposal.theirPlayers.map((player) => (
                      <div key={player.id} className="flex justify-between items-center p-2 border rounded">
                        <span>
                          {player.name} ({player.position})
                        </span>
                        <span className="font-mono text-sm">{player.value.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-sm pt-4 border-t">
                <span>Value Difference:</span>
                <span
                  className={`font-mono ${selectedProposal.valueDifferential > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {selectedProposal.valueDifferential > 0 ? "+" : ""}
                  {selectedProposal.valueDifferential.toFixed(1)}
                </span>
              </div>

              {selectedProposal.message && (
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Message</h4>
                  <p className="text-sm">{selectedProposal.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-transparent"
                    onClick={() => copyMessage(selectedProposal.message!, selectedProposal.id)}
                  >
                    {copiedMessage === selectedProposal.id ? "Copied!" : "Copy Message"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
