import { NextResponse } from "next/server"
import { z } from "zod"
import { evaluateTrade, type TradePlayer } from "@/lib/trade-engine"

// Zod schemas for validation
const TradePlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string(),
  value: z.number()
})

const TradeEvaluationRequestSchema = z.object({
  leagueId: z.string().optional(),
  week: z.number().optional(),
  teamA: z.object({
    gives: z.array(TradePlayerSchema),
    gets: z.array(TradePlayerSchema)
  }),
  teamB: z.object({
    gives: z.array(TradePlayerSchema),
    gets: z.array(TradePlayerSchema)
  }),
  // Team context data for need score calculations
  teamData: z.object({
    teamA: z.object({
      id: z.string(),
      players: z.array(TradePlayerSchema),
      needScore: z.number(),
      totalValue: z.number()
    }),
    teamB: z.object({
      id: z.string(),
      players: z.array(TradePlayerSchema),
      needScore: z.number(),
      totalValue: z.number()
    })
  }).optional()
}).strict()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Handle legacy format for backward compatibility
    if (body.youGive && body.youGet) {
      return handleLegacyFormat(body)
    }

    // Validate request body
    const validatedData = TradeEvaluationRequestSchema.parse(body)

    // Use provided team data or create mock data
    const teamData = validatedData.teamData || {
      teamA: {
        id: 'team1',
        players: [...validatedData.teamA.gives, ...validatedData.teamA.gets],
        needScore: 15.0,
        totalValue: 100.0
      },
      teamB: {
        id: 'team2', 
        players: [...validatedData.teamB.gives, ...validatedData.teamB.gets],
        needScore: 18.0,
        totalValue: 95.0
      }
    }

    // Evaluate the trade using the implemented engine
    const result = evaluateTrade({
      teamA: validatedData.teamA,
      teamB: validatedData.teamB
    }, teamData)

    return NextResponse.json({
      fairnessScore: result.fairnessScore,
      rationale: result.rationale,
      valueDeltas: result.valueDeltas,
      needDeltas: result.needDeltas,
      metadata: {
        leagueId: validatedData.leagueId || null,
        week: validatedData.week || null,
        evaluatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Invalid request format",
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error("Trade evaluation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Handle legacy format for backward compatibility
function handleLegacyFormat(body: any) {
  // Minimal mock value map. In a real app you would compute using projections/values.
  const VALUE: Record<string, number> = {
    "1": 28.5,
    "2": 52.1,
    "3": 48.9,
    "4": 32.1,
    "11": 6.7,
    "14": 11.8,
  }

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
