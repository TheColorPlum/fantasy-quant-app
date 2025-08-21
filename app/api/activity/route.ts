import { NextResponse } from "next/server"

type Item = {
  id: string
  type: "add" | "drop" | "claim" | "trade"
  team: string
  player: string
  position?: string
  nflTeam?: string
  ts: string
  faabSpent?: number
}

const TEAMS = [
  "Team Mahomes",
  "Team Allen",
  "Team Burrow",
  "Team Herbert",
  "Team Jackson",
  "Team Rodgers",
  "Team Jefferson",
  "Team Kelce",
]
const PLAYERS = [
  ["Nico Collins", "WR", "HOU"],
  ["Jaylen Warren", "RB", "PIT"],
  ["Tua Tagovailoa", "QB", "MIA"],
  ["Dalton Kincaid", "TE", "BUF"],
  ["Tank Dell", "WR", "HOU"],
  ["Chuba Hubbard", "RB", "CAR"],
  ["Rashee Rice", "WR", "KC"],
  ["Zach Charbonnet", "RB", "SEA"],
  ["Romeo Doubs", "WR", "GB"],
  ["Sam LaPorta", "TE", "DET"],
] as const

function generateActivity(count = 120): Item[] {
  const now = Date.now()
  const out: Item[] = []
  for (let i = 0; i < count; i++) {
    const type = (["add", "drop", "claim", "trade"] as const)[Math.floor(Math.random() * 4)]
    const team = TEAMS[Math.floor(Math.random() * TEAMS.length)]
    const [name, pos, nfl] = PLAYERS[Math.floor(Math.random() * PLAYERS.length)]
    const offset = Math.floor(Math.random() * 72 * 60 * 60 * 1000) // last 72h
    const ts = new Date(now - offset).toISOString()
    const item: Item =
      type === "trade"
        ? {
            id: `t${i}`,
            type,
            team,
            player: `${name} ⇄ ${PLAYERS[Math.floor(Math.random() * PLAYERS.length)][0]}`,
            ts,
          }
        : {
            id: `${type[0]}${i}`,
            type,
            team,
            player: name,
            position: pos,
            nflTeam: nfl,
            ts,
            ...(type === "claim" ? { faabSpent: Math.floor(Math.random() * 25) } : {}),
          }
    out.push(item)
  }
  return out.sort((a, b) => (a.ts > b.ts ? -1 : 1))
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get("type") || "all") as "all" | "add" | "drop" | "claim" | "trade"
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 40)))

  let data = generateActivity(150)
  if (type !== "all") data = data.filter((d) => d.type === type)
  return NextResponse.json(data.slice(0, limit))
}
