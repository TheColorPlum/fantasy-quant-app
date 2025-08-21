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

  const ProposalCard = ({ proposal, isInbox }: { proposal: Proposal; isInbox: boolean }) => (
    <Card className="bg-card border-border">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{isInbox ? "From" : "To"}</span>
            <span className="font-medium">{getPartnerName(proposal, isInbox)}</span>
            <Badge variant="outline" className={`rounded-md ${getStatusColor(proposal.status)}`}>
              {proposal.status}
            </Badge>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Value Differential</p>
              <p className={`font-mono ${proposal.valueDifferential >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {proposal.valueDifferential >= 0 ? "+" : ""}
                {proposal.valueDifferential.toFixed(1)}
              </p>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="font-mono">{proposal.confidence}%</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">You Give</p>
            <div className="flex flex-wrap gap-2">
              {proposal.give.map((p) => (
                <Badge key={p.id} className="rounded-md" variant="secondary">
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">You Get</p>
            <div className="flex flex-wrap gap-2">
              {proposal.get.map((p) => (
                <Badge key={p.id} className="rounded-md" variant="secondary">
                  {p.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          {proposal.message && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-md bg-transparent"
              onClick={() => copyMessage(proposal.message!, proposal.id)}
            >
              {copiedMessage === proposal.id ? "Copied!" : "Copy"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="rounded-md bg-transparent"
            onClick={() => openDetail(proposal)}
          >
            <Eye className="mr-1 h-3 w-3" />
            Details
          </Button>
          {isInbox && proposal.status === "sent" ? (
            <>
              <Button size="sm" className="rounded-md" onClick={() => onAccept(proposal.id)}>
                Accept
              </Button>
              <Button variant="secondary" size="sm" className="rounded-md" onClick={() => onCounter(proposal.id)}>
                Counter
              </Button>
              <Button variant="destructive" size="sm" className="rounded-md" onClick={() => onDecline(proposal.id)}>
                Decline
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" className="rounded-md" onClick={() => onCounter(proposal.id)}>
              Edit/Counter
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Proposals</h1>
              <p className="text-sm text-muted-foreground">Review and respond to trade proposals (Inbox & Outbox)</p>
            </div>
            <Button onClick={() => router.push("/trades")} className="rounded-md">
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="outbox">Outbox</TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-6">
            <div className="space-y-4">
              {inbox.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No proposals in your inbox</p>
                </div>
              ) : (
                inbox.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} isInbox={true} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="outbox" className="mt-6">
            <div className="space-y-4">
              {outbox.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No proposals in your outbox</p>
                </div>
              ) : (
                outbox.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} isInbox={false} />)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          if (open !== detailDialogOpen) setDetailDialogOpen(open)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proposal Details</DialogTitle>
          </DialogHeader>
          {selectedProposal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">You Give</h4>
                  <div className="space-y-2">
                    {selectedProposal.give.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{player.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {player.position}
                          </Badge>
                        </div>
                        {player.value && <span className="font-mono text-sm">{player.value}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">You Get</h4>
                  <div className="space-y-2">
                    {selectedProposal.get.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{player.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {player.position}
                          </Badge>
                        </div>
                        {player.value && <span className="font-mono text-sm">{player.value}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {selectedProposal.message && (
                <div>
                  <h4 className="font-medium mb-2">Message</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded">{selectedProposal.message}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => onCounter(selectedProposal.id)}>Counter in Builder</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
