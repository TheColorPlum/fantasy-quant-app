import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ProposalStatus = "draft" | "sent" | "accepted" | "declined" | "countered"

export interface PlayerRef {
  id: string
  name: string
  position: string
  team: string
  value?: number
}

export interface Proposal {
  id: string
  fromTeamId: string
  toTeamId: string
  give: PlayerRef[]
  get: PlayerRef[]
  valueDifferential: number
  confidence: number
  message?: string
  createdAt: string
  status: ProposalStatus
  counterOf?: string // if this is a counter proposal
}

interface ProposalsState {
  proposals: Proposal[]
  createDraft: (proposal: Omit<Proposal, "id" | "createdAt" | "status">) => string
  send: (id: string) => void
  accept: (id: string) => void
  decline: (id: string) => void
  counter: (id: string, newProposal: Omit<Proposal, "id" | "createdAt" | "status" | "counterOf">) => string
  removeDraft: (id: string) => void
  getInboxProposals: (teamId: string) => Proposal[]
  getOutboxProposals: (teamId: string) => Proposal[]
}

export const useProposalsStore = create<ProposalsState>()(
  persist(
    (set, get) => ({
      proposals: [
        // Mock data for demonstration
        {
          id: "1",
          fromTeamId: "team2",
          toTeamId: "team1",
          give: [
            { id: "p1", name: "Josh Jacobs", position: "RB", team: "LV", value: 85 },
            { id: "p2", name: "DeAndre Hopkins", position: "WR", team: "TEN", value: 72 },
          ],
          get: [{ id: "p3", name: "Saquon Barkley", position: "RB", team: "NYG", value: 92 }],
          valueDifferential: -35,
          confidence: 78,
          message:
            "Hey! I think this could work well for both of us. You get depth at RB and WR, I get an elite RB1. Your team has been struggling with consistency at RB, and Jacobs has been solid all season. Hopkins gives you a reliable WR2 option. What do you think?",
          createdAt: "2024-01-15T10:30:00Z",
          status: "sent",
        },
        {
          id: "2",
          fromTeamId: "team1",
          toTeamId: "team3",
          give: [{ id: "p4", name: "Travis Kelce", position: "TE", team: "KC", value: 88 }],
          get: [
            { id: "p5", name: "Mark Andrews", position: "TE", team: "BAL", value: 82 },
            { id: "p6", name: "Courtland Sutton", position: "WR", team: "DEN", value: 68 },
          ],
          valueDifferential: 12,
          confidence: 85,
          message:
            "Looking to get some WR depth while still having a solid TE. Andrews has been consistent and Sutton could be a nice flex play.",
          createdAt: "2024-01-14T15:45:00Z",
          status: "draft",
        },
      ],

      createDraft: (proposal) => {
        const id = `draft_${Date.now()}`
        const newProposal: Proposal = {
          ...proposal,
          id,
          createdAt: new Date().toISOString(),
          status: "draft",
        }
        set((state) => ({
          proposals: [...state.proposals, newProposal],
        }))
        return id
      },

      send: (id) => {
        set((state) => ({
          proposals: state.proposals.map((p) => (p.id === id ? { ...p, status: "sent" as ProposalStatus } : p)),
        }))
      },

      accept: (id) => {
        set((state) => ({
          proposals: state.proposals.map((p) => (p.id === id ? { ...p, status: "accepted" as ProposalStatus } : p)),
        }))
      },

      decline: (id) => {
        set((state) => ({
          proposals: state.proposals.map((p) => (p.id === id ? { ...p, status: "declined" as ProposalStatus } : p)),
        }))
      },

      counter: (id, newProposal) => {
        const counterId = `counter_${Date.now()}`
        const counterProposal: Proposal = {
          ...newProposal,
          id: counterId,
          createdAt: new Date().toISOString(),
          status: "draft",
          counterOf: id,
        }

        set((state) => ({
          proposals: [
            ...state.proposals.map((p) => (p.id === id ? { ...p, status: "countered" as ProposalStatus } : p)),
            counterProposal,
          ],
        }))
        return counterId
      },

      removeDraft: (id) => {
        set((state) => ({
          proposals: state.proposals.filter((p) => p.id !== id),
        }))
      },

      getInboxProposals: (teamId) => {
        return get().proposals.filter((p) => p.toTeamId === teamId)
      },

      getOutboxProposals: (teamId) => {
        return get().proposals.filter((p) => p.fromTeamId === teamId)
      },
    }),
    {
      name: "proposals-storage",
    },
  ),
)
