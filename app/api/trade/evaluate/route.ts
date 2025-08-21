import { NextResponse } from "next/server"

type Body = {
  leagueId?: string
  week?: number
  youGive: string[]
  youGet: string[]
}

// Minimal mock value map. In a real app you would compute using projections/values.
const VALUE: Record<string, number> = {
  "1": 28.5,
  "2": 52.1,
  "3": 48.9,
  "4": 32.1,
  "11": 6.7,
  "14": 11.8,
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body
  const sum = (ids: string[]) => ids.reduce((acc, id) => acc + (VALUE[id] ?? 5), 0)
  const give = sum(body.youGive || [])
  const get = sum(body.youGet || [])
  const deltaYou = get - give
  const deltaOpp = give - get

  return NextResponse.json({
    deltaYou: Math.round(deltaYou * 10) / 10,
    deltaOpp: Math.round(deltaOpp * 10) / 10,
    details: {
      leagueId: body.leagueId ?? null,
      week: body.week ?? null,
      youGiveTotal: Math.round(give * 10) / 10,
      youGetTotal: Math.round(get * 10) / 10,
    },
  })
}
