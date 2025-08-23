"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Eye, Lock, Share2, ExternalLink } from "lucide-react"
import { useProposalsStore, type Proposal } from "@/lib/proposals-store"
import { useRouter } from "next/navigation"

interface ApiProposal {
  id: string;
  leagueId: string;
  league: { id: string; name: string; season: number };
  fromTeam: { id: string; name: string; espnTeamId: number };
  toTeam: { id: string; name: string; espnTeamId: number };
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valueDelta: { you: number; them: number };
  needDelta: {
    you: { byPos: Record<string, number>; before: number; after: number };
    them: { byPos: Record<string, number>; before: number; after: number };
  };
  rationale: string;
  generationMode: 'balanced' | 'strict';
  items: Array<{
    id: string;
    playerId: string;
    playerName: string;
    position: string;
    value: number;
    direction: 'give' | 'get';
  }>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  userAccess?: {
    canSend: boolean;
    canAcceptReject: boolean;
    canExpire: boolean;
  };
}

const VIEWER_TEAM_ID = "team1"

const TEAM_NAMES: Record<string, string> = {
  team1: "Your Team",
  team2: "Fantasy Kings",
  team3: "Gridiron Heroes",
}

export default function ProposalsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  // State for token-based viewing
  const [tokenProposal, setTokenProposal] = useState<ApiProposal | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [isTokenView, setIsTokenView] = useState(false)

  // State for authenticated user viewing
  const [userProposals, setUserProposals] = useState<ApiProposal[]>([])
  const [userLoading, setUserLoading] = useState(false)
  const [userError, setUserError] = useState<string | null>(null)

  const [selectedProposal, setSelectedProposal] = useState<ApiProposal | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  // Load proposal by token
  useEffect(() => {
    if (token) {
      setIsTokenView(true)
      setTokenLoading(true)
      setTokenError(null)
      
      // Fetch proposal by token (need to create this endpoint)
      fetch(`/api/proposals/token/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.proposal) {
            setTokenProposal(data.proposal)
          } else {
            setTokenError(data.error || 'Proposal not found')
          }
        })
        .catch(error => {
          setTokenError('Failed to load proposal')
          console.error('Token fetch error:', error)
        })
        .finally(() => {
          setTokenLoading(false)
        })
    }
  }, [token])

  // Load user proposals (authenticated mode)
  useEffect(() => {
    if (!token && !isTokenView) {
      setUserLoading(true)
      setUserError(null)
      
      fetch('/api/proposals')
        .then(res => res.json())
        .then(data => {
          if (data.proposals) {
            setUserProposals(data.proposals)
          } else {
            setUserError(data.error || 'Failed to load proposals')
          }
        })
        .catch(error => {
          setUserError('Failed to load proposals')
          console.error('Proposals fetch error:', error)
        })
        .finally(() => {
          setUserLoading(false)
        })
    }
  }, [token, isTokenView])

  // Legacy store compatibility (keeping for backward compatibility)
  useEffect(() => {
    useProposalsStore.persist.rehydrate()
  }, [])

  const hydrated = useProposalsStore((s) => s._hydrated)
  const EMPTY: Proposal[] = []
  const legacyProposals = useProposalsStore((s) => (s._hydrated ? s.proposals : EMPTY))
  const accept = useProposalsStore((s) => s.accept)
  const decline = useProposalsStore((s) => s.decline)
  const send = useProposalsStore((s) => s.send)

  // Derive inbox/outbox for authenticated users
  const [inbox, setInbox] = useState<ApiProposal[]>([])
  const [outbox, setOutbox] = useState<ApiProposal[]>([])

  const sortByCreatedDesc = useCallback((a: ApiProposal, b: ApiProposal) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(), [])

  useEffect(() => {
    if (userProposals.length > 0) {
      // Filter based on user's teams - for now using mock logic
      const inb = userProposals
        .filter((p) => p.status === 'sent') // Incoming proposals
        .slice()
        .sort(sortByCreatedDesc)
      const outb = userProposals
        .filter((p) => ['draft', 'sent', 'accepted', 'rejected'].includes(p.status)) // All user's proposals
        .slice()
        .sort(sortByCreatedDesc)
      setInbox(inb)
      setOutbox(outb)
    }
  }, [userProposals, sortByCreatedDesc])

  const copyMessage = useCallback((message: string, id: string) => {
    if (!message) return
    navigator.clipboard.writeText(message)
    setTimeout(() => {}, 2000)
  }, [])

  const onAccept = useCallback((id: string) => {
    // API call to accept proposal
    fetch(`/api/proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'accepted' })
    }).then(() => {
      // Reload proposals
      window.location.reload()
    })
  }, [])

  const onDecline = useCallback((id: string) => {
    // API call to reject proposal
    fetch(`/api/proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' })
    }).then(() => {
      // Reload proposals
      window.location.reload()
    })
  }, [])

  const onSend = useCallback((id: string) => {
    // API call to send proposal
    fetch(`/api/proposals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' })
    }).then(() => {
      // Reload proposals
      window.location.reload()
    })
  }, [])

  const onCounter = useCallback(
    (proposalId: string) => {
      router.push(`/trades?counter=${proposalId}`)
    },
    [router],
  )

  const openDetail = useCallback((p: ApiProposal) => {
    setSelectedProposal(p)
    setDetailDialogOpen(true)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "sent":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "accepted":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      case "rejected":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      case "expired":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  // Render token view (read-only)
  if (isTokenView) {
    if (tokenLoading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading proposal...</p>
          </div>
        </div>
      )
    }

    if (tokenError || !tokenProposal) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center max-w-md">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Proposal Not Found</h1>
            <p className="text-muted-foreground mb-4">
              {tokenError || 'This share link may have been revoked or expired.'}
            </p>
            <Button onClick={() => router.push('/proposals')} variant="outline">
              View Your Proposals
            </Button>
          </div>
        </div>
      )
    }

    // Render single proposal view
    const proposal = tokenProposal
    const giveItems = proposal.items.filter(item => item.direction === 'give')
    const getItems = proposal.items.filter(item => item.direction === 'get')

    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-background/60 backdrop-blur">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Trade Proposal</h1>
                <p className="text-sm text-muted-foreground">
                  {proposal.fromTeam.name} → {proposal.toTeam.name} | {proposal.league.name} ({proposal.league.season})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-6">
          <Alert className="mb-6">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              You are viewing a read-only shared proposal. No actions can be taken from this view.
            </AlertDescription>
          </Alert>

          <Card className="bg-card border-border mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold">Trade Details</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">{proposal.fromTeam.name} Gives</h4>
                  <div className="space-y-2">
                    {giveItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <span>{item.playerName} ({item.position})</span>
                        <span className="font-mono text-sm">${item.value.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                    Total Value: ${giveItems.reduce((sum, item) => sum + item.value, 0).toFixed(1)}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">{proposal.toTeam.name} Gets</h4>
                  <div className="space-y-2">
                    {getItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                        <span>{item.playerName} ({item.position})</span>
                        <span className="font-mono text-sm">${item.value.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                    Total Value: ${getItems.reduce((sum, item) => sum + item.value, 0).toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium mb-2">Analysis</h4>
                <p className="text-sm text-muted-foreground mb-4">{proposal.rationale}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Value Impact:</span>
                    <div className="mt-1">
                      <span className={proposal.valueDelta.you > 0 ? 'text-green-600' : 'text-red-600'}>
                        {proposal.fromTeam.name}: {proposal.valueDelta.you > 0 ? '+' : ''}${proposal.valueDelta.you.toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className={proposal.valueDelta.them > 0 ? 'text-green-600' : 'text-red-600'}>
                        {proposal.toTeam.name}: {proposal.valueDelta.them > 0 ? '+' : ''}${proposal.valueDelta.them.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Need Improvement:</span>
                    <div className="mt-1">
                      <span className={proposal.needDelta.you.after < proposal.needDelta.you.before ? 'text-green-600' : 'text-red-600'}>
                        {proposal.fromTeam.name}: {(proposal.needDelta.you.after - proposal.needDelta.you.before).toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className={proposal.needDelta.them.after < proposal.needDelta.them.before ? 'text-green-600' : 'text-red-600'}>
                        {proposal.toTeam.name}: {(proposal.needDelta.them.after - proposal.needDelta.them.before).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                Generated: {new Date(proposal.createdAt).toLocaleString()} | 
                Mode: {proposal.generationMode} | 
                {proposal.expiresAt && ` Expires: ${new Date(proposal.expiresAt).toLocaleString()}`}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Render authenticated user view
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
