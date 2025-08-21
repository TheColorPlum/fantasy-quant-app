"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ProposalStatus = "draft" | "sent" | "accepted" | "declined" | "countered"

export type PlayerRef = {
  id: string
  name: string
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST"
  value: number
}

export interface Proposal {
  id: string
  fromTeamId: string
  toTeamId: string
  partner: string // display name used by the UI
  yourPlayers: PlayerRef[] // "You Give" (viewer perspective)
  theirPlayers: PlayerRef[] // "You Get"
  valueDifferential: number
  confidence: number // %
  reasoning?: string
  message?: string
  createdAt: string // ISO string
  status: ProposalStatus
  counterOf?: string // original id if this is a counter
}

type State = {
  _hydrated: boolean // true after persist rehydrate finishes
  proposals: Proposal[]

  getById: (id: string) => Proposal | undefined

  createDraft: (p: Omit<Proposal, "id" | "status" | "createdAt">) => string
  send: (id: string) => void
  accept: (id: string) => void
  decline: (id: string) => void
  counter: (origId: string, p: Omit<Proposal, "id" | "status" | "createdAt" | "counterOf">) => string
  removeDraft: (id: string) => void
}

export const useProposalsStore = create<State>()(
  persist(
    (set, get) => ({
      _hydrated: false,
      proposals: [],

      getById: (id) => get().proposals.find((p) => p.id === id),

      createDraft: (base) => {
        const id = crypto.randomUUID()
        const draft: Proposal = {
          ...base,
          id,
          status: "draft",
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ proposals: [draft, ...s.proposals] }))
        return id
      },

      send: (id) => set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, status: "sent" } : p)) })),

      accept: (id) =>
        set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, status: "accepted" } : p)) })),

      decline: (id) =>
        set((s) => ({ proposals: s.proposals.map((p) => (p.id === id ? { ...p, status: "declined" } : p)) })),

      counter: (origId, base) => {
        const id = crypto.randomUUID()
        const counter: Proposal = {
          ...base,
          id,
          status: "sent",
          createdAt: new Date().toISOString(),
          counterOf: origId,
        }
        set((s) => ({ proposals: [counter, ...s.proposals] }))
        return id
      },

      removeDraft: (id) =>
        set((s) => ({ proposals: s.proposals.filter((p) => !(p.id === id && p.status === "draft")) })),
    }),
    {
      name: "fantasy:proposals@v1",
      version: 1,
      partialize: (s) => ({ proposals: s.proposals }),
      // Important: avoid snapshot changes during render
      skipHydration: true,
      onRehydrateStorage: () => () => {
        // Flip after merge from storage completes
        useProposalsStore.setState({ _hydrated: true })
      },
    },
  ),
)
