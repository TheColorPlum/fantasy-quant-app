"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type SandboxPlayer = {
  id: string
  name: string
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST"
  nflTeam: string
  value: number
}

type SandboxState = {
  give: SandboxPlayer[]
  get: SandboxPlayer[]
  addGive: (p: SandboxPlayer) => void
  addGet: (p: SandboxPlayer) => void
  remove: (side: "give" | "get", id: string) => void
  reset: () => void
}

export const useSandboxStore = create<SandboxState>()(
  persist(
    (set, get) => ({
      give: [],
      get: [],
      addGive: (p) => set((s) => (s.give.some((x) => x.id === p.id) ? s : { ...s, give: [...s.give, p] })),
      addGet: (p) => set((s) => (s.get.some((x) => x.id === p.id) ? s : { ...s, get: [...s.get, p] })),
      remove: (side, id) =>
        set((s) =>
          side === "give"
            ? { ...s, give: s.give.filter((x) => x.id !== id) }
            : { ...s, get: s.get.filter((x) => x.id !== id) },
        ),
      reset: () => set({ give: [], get: [] }),
    }),
    {
      name: "tradeup:sandbox",
      partialize: (s) => ({ give: s.give, get: s.get }),
      version: 1,
    },
  ),
)
