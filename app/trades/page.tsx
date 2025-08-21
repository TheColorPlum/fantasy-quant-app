"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { AlertCircle, Search } from "lucide-react"
import { useSandboxStore, type SandboxPlayer } from "@/lib/sandbox-store"
import { calcAggressiveness, validateTrade } from "@/lib/trade-engine"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { useProposalsStore, type PlayerRef } from "@/lib/proposals-store"

const VIEWER_TEAM_ID = "team1"

const mockTeams = [
  { id: "team1", name: "The Destroyers", owner: "Mike Johnson" },
  { id: "team2", name: "Fantasy Kings", owner: "Sarah Wilson" },
  { id: "team3", name: "Gridiron Heroes", owner: "Alex Chen" },
]

const mockYourRoster: SandboxPlayer[] = [
  { id: "your1", name: "Josh Allen", position: "QB", nflTeam: "BUF", value: 28.5 },
  { id: "your2", name: "Saquon Barkley", position: "RB", nflTeam: "PHI", value: 35.2 },
  { id: "your3", name: "CeeDee Lamb", position: "WR", nflTeam: "DAL", value: 42.1 },
  { id: "your4", name: "Mark Andrews", position: "TE", nflTeam: "BAL", value: 18.9 },
  { id: "your5", name: "Chuba Hubbard", position: "RB", nflTeam: "CAR", value: 11.8 },
  { id: "your6", name: "Kendrick Bourne", position: "WR", nflTeam: "NE", value: 6.7 },
]

const mockPartnerRoster: SandboxPlayer[] = [
  { id: "partner1", name: "Lamar Jackson", position: "QB", nflTeam: "BAL", value: 31.2 },
  { id: "partner2", name: "Christian McCaffrey", position: "RB", nflTeam: "SF", value: 52.1 },
  { id: "partner3", name: "Justin Jefferson", position: "WR", nflTeam: "MIN", value: 48.9 },
  { id: "partner4", name: "Travis Kelce", position: "TE", nflTeam: "KC", value: 32.1 },
  { id: "partner5", name: "Breece Hall", position: "RB", nflTeam: "NYJ", value: 28.7 },
  { id: "partner6", name: "Amon-Ra St. Brown", position: "WR", nflTeam: "DET", value: 25.4 },
]

function posColor(pos: SandboxPlayer["position"]) {
  switch (pos) {
    case "QB":
      return "#FF3B30"
    case "RB":
      return "#00FF85"
    case "WR":
      return "#38BDF8"
    case "TE":
      return "#F59E0B"
    case "K":
      return "#94A3B8"
    case "DST":
      return "#8B5CF6"
  }
}

function toPlayerRef(p: SandboxPlayer): PlayerRef {
  return { id: p.id, name: p.name, position: p.position, value: p.value }
}

export default function TradesPage() {
  const searchParams = useSearchParams()
  const counterId = searchParams.get("counter")

  const getById = useProposalsStore((s) => s.getById)
  const createDraft = useProposalsStore((s) => s.createDraft)
  const send = useProposalsStore((s) => s.send)

  const { give, get, message, partnerTeamId, addGive, addGet, remove, setMessage, setPartnerTeamId, reset } =
    useSandboxStore()

  const [selectedTeam, setSelectedTeam] = useState("team2")
  const [yourRosterSearch, setYourRosterSearch] = useState("")
  const [partnerRosterSearch, setPartnerRosterSearch] = useState("")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!counterId) return
    const p = getById(counterId)
    if (!p) return

    // Prefill: reverse sides for counter (they offered you X for Y)
    reset()
    p.theirPlayers.forEach((pl) =>
      addGive({
        id: pl.id,
        name: pl.name,
        position: pl.position,
        nflTeam: "",
        value: pl.value,
      }),
    )
    p.yourPlayers.forEach((pl) =>
      addGet({
        id: pl.id,
        name: pl.name,
        position: pl.position,
        nflTeam: "",
        value: pl.value,
      }),
    )
    setPartnerTeamId(p.fromTeamId)
    setSelectedTeam(p.fromTeamId)
    setMessage(`Re: your proposal - here's my counter offer...`)
  }, [counterId, getById, reset, addGive, addGet, setPartnerTeamId, setMessage])

  const aggressiveness = calcAggressiveness(give, get)
  const validation = validateTrade(give, get)

  const filteredYourRoster = mockYourRoster.filter(
    (p) =>
      p.name.toLowerCase().includes(yourRosterSearch.toLowerCase()) &&
      !give.some((gp) => gp.id === p.id) &&
      !get.some((gp) => gp.id === p.id),
  )

  const filteredPartnerRoster = mockPartnerRoster.filter(
    (p) =>
      p.name.toLowerCase().includes(partnerRosterSearch.toLowerCase()) &&
      !give.some((gp) => gp.id === p.id) &&
      !get.some((gp) => gp.id === p.id),
  )

  const onSaveDraft = () => {
    if (!validation.isValid) return

    const partnerName = mockTeams.find((t) => t.id === selectedTeam)?.name || "Unknown Team"
    createDraft({
      fromTeamId: VIEWER_TEAM_ID,
      toTeamId: selectedTeam,
      partner: partnerName,
      yourPlayers: give.map(toPlayerRef),
      theirPlayers: get.map(toPlayerRef),
      valueDifferential: Number(
        (get.reduce((s, p) => s + p.value, 0) - give.reduce((s, p) => s + p.value, 0)).toFixed(1),
      ),
      confidence: 75, // placeholder heuristic
      message,
    })

    toast({
      title: "Draft Saved",
      description: "Your trade draft has been saved locally.",
    })
  }

  const handleSendProposal = async () => {
    if (!validation.isValid) return

    setIsSubmitting(true)
    try {
      const partnerName = mockTeams.find((t) => t.id === selectedTeam)?.name || "Unknown Team"
      const id = createDraft({
        fromTeamId: VIEWER_TEAM_ID,
        toTeamId: selectedTeam,
        partner: partnerName,
        yourPlayers: give.map(toPlayerRef),
        theirPlayers: get.map(toPlayerRef),
        valueDifferential: Number(
          (get.reduce((s, p) => s + p.value, 0) - give.reduce((s, p) => s + p.value, 0)).toFixed(1),
        ),
        confidence: 75,
        message,
      })

      send(id)

      toast({
        title: "Proposal Sent",
        description: `Proposal sent to ${partnerName}.`,
      })

      reset()
      setConfirmDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Propose Trade</h1>
              <p className="text-sm text-muted-foreground">
                Build a trade using your roster and targets. Save as draft or send.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Team Selector */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">Team Selector</CardTitle>
              <CardDescription>Choose your trading partner</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select partner team" />
                </SelectTrigger>
                <SelectContent>
                  {mockTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.owner})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Your Roster */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">Your Roster</CardTitle>
              <CardDescription>Pick assets to include</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search your roster..."
                    value={yourRosterSearch}
                    onChange={(e) => setYourRosterSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Pos</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredYourRoster.map((player) => (
                        <TableRow key={player.id} className="hover:bg-muted/30 cursor-pointer">
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="rounded-md"
                              style={{ borderColor: posColor(player.position), color: posColor(player.position) }}
                            >
                              {player.position}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-right">{player.value.toFixed(1)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-md bg-transparent"
                              onClick={() => addGive(player)}
                            >
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partner Roster */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">Partner Needs / Roster</CardTitle>
              <CardDescription>Available players from partner team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search partner roster..."
                    value={partnerRosterSearch}
                    onChange={(e) => setPartnerRosterSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Pos</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPartnerRoster.map((player) => (
                        <TableRow key={player.id} className="hover:bg-muted/30 cursor-pointer">
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="rounded-md"
                              style={{ borderColor: posColor(player.position), color: posColor(player.position) }}
                            >
                              {player.position}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-right">{player.value.toFixed(1)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-md bg-transparent"
                              onClick={() => addGet(player)}
                            >
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Trade Sandbox */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">Trade Sandbox</CardTitle>
              <CardDescription>Review your proposed trade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Give Section */}
                <div>
                  <h4 className="font-medium mb-3">You Give</h4>
                  <div className="space-y-2">
                    {give.map((player) => (
                      <div key={player.id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="rounded-md"
                            style={{ borderColor: posColor(player.position), color: posColor(player.position) }}
                          >
                            {player.position}
                          </Badge>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm">{player.value.toFixed(1)}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-md bg-transparent"
                            onClick={() => remove("give", player.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {give.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-4 border rounded-md border-dashed">
                        No players selected
                      </div>
                    )}
                  </div>
                </div>

                {/* Get Section */}
                <div>
                  <h4 className="font-medium mb-3">You Get</h4>
                  <div className="space-y-2">
                    {get.map((player) => (
                      <div key={player.id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="rounded-md"
                            style={{ borderColor: posColor(player.position), color: posColor(player.position) }}
                          >
                            {player.position}
                          </Badge>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm">{player.value.toFixed(1)}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-md bg-transparent"
                            onClick={() => remove("get", player.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    {get.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-4 border rounded-md border-dashed">
                        No players selected
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals and Aggressiveness */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Give Total:</span>
                    <span className="font-mono">{give.reduce((sum, p) => sum + p.value, 0).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Get Total:</span>
                    <span className="font-mono">{get.reduce((sum, p) => sum + p.value, 0).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Value Difference:</span>
                    <span
                      className={`font-mono ${get.reduce((sum, p) => sum + p.value, 0) - give.reduce((sum, p) => sum + p.value, 0) > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {(get.reduce((sum, p) => sum + p.value, 0) - give.reduce((sum, p) => sum + p.value, 0)).toFixed(
                        1,
                      )}
                    </span>
                  </div>

                  {/* Aggressiveness Meter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Aggressiveness</span>
                      <span className="font-mono text-sm">{Math.round(aggressiveness * 100)}%</span>
                    </div>
                    <Progress value={aggressiveness * 100} />
                  </div>
                </div>

                {/* Validation Messages */}
                {validation.errors.length > 0 && (
                  <div className="space-y-2">
                    {validation.errors.map((error, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className="space-y-2">
                    {validation.warnings.map((warning, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compose & Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold tracking-tight">Compose & Actions</CardTitle>
              <CardDescription>Add a message and send your proposal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Message to manager (optional)</label>
                  <Textarea
                    placeholder="Add a personal message to your trade proposal..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={onSaveDraft} className="flex-1 bg-transparent">
                    Save Draft
                  </Button>
                  <Button onClick={() => setConfirmDialogOpen(true)} disabled={!validation.isValid} className="flex-1">
                    Send Proposal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Trade Proposal</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Send this trade proposal to {mockTeams.find((t) => t.id === selectedTeam)?.name}?
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <strong>You Give:</strong> {give.map((p) => p.name).join(", ")}
              </div>
              <div>
                <strong>You Get:</strong> {get.map((p) => p.name).join(", ")}
              </div>
              {message && (
                <div>
                  <strong>Message:</strong> {message}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendProposal} disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
