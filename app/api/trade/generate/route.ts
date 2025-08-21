import { NextResponse } from "next/server"
import { mockLeagueData } from "@/lib/dummy-data"

type Card = {
  youGive: Array<{ id: string; name: string; pos: string; value: number }>
  youGet: Array<{ id: string; name: string; pos: string; value: number }>
  deltas: { you: number; opp: number }
  badges: { likelihood: "Low" | "Maybe" | "High"; fairness: "Fair" | "Edge" }
  acceptProb: number
  hash: string
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { desiredPosition?: "QB" | "RB" | "WR" | "TE" | "K" | "DST" }
  const desired = body.desiredPosition || "WR"

  const teamA = mockLeagueData.teams[0]
  const teamB = mockLeagueData.teams[1]

  const givePool = teamA.roster.filter((p: any) => p.position === desired)
  const getPool = teamB.roster.filter((p: any) => p.position === desired)

  const pick = <T,>(arr: T[], idx: number) => arr[Math.min(idx, Math.max(0, arr.length - 1))]

  const makeCard = (g: any[], t: any[]): Card => {
    const valG = g.reduce((s, p) => s + p.value, 0)
    const valT = t.reduce((s, p) => s + p.value, 0)
    const you = +(valT - valG).toFixed(1)
    const opp = +(valG - valT).toFixed(1)
    return {
      youGive: g.map((p) => ({ id: p.id ?? p.name, name: p.name, pos: p.position, value: p.value })),
      youGet: t.map((p) => ({ id: p.id ?? p.name, name: p.name, pos: p.position, value: p.value })),
      deltas: { you, opp },
      badges: { likelihood: "Maybe", fairness: "Fair" },
      acceptProb: 0.6,
      hash: Math.random().toString(36).slice(2),
    }
  }

  const cards: Card[] = [
    makeCard([pick(givePool, 0)], [pick(getPool, 0)]),
    makeCard([pick(givePool, 1) ?? pick(givePool, 0)], [pick(getPool, 1) ?? pick(getPool, 0)]),
    makeCard([pick(givePool, 0)], [pick(getPool, 1) ?? pick(getPool, 0)]),
  ]

  return NextResponse.json(cards)
}
