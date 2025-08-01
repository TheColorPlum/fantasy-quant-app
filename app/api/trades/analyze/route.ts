import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const analyzeTradeSchema = z.object({
  partner: z.string().min(1),
  userGives: z.array(
    z.object({
      name: z.string(),
      position: z.string(),
      value: z.number(),
      trend: z.number(),
    }),
  ),
  userGets: z.array(
    z.object({
      name: z.string(),
      position: z.string(),
      value: z.number(),
      trend: z.number(),
    }),
  ),
  valueDifferential: z.number(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partner, userGives, userGets, valueDifferential } = analyzeTradeSchema.parse(body)

    // Simulate AI analysis delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock trade context generation
    const context = {
      whyItWorks: `This trade leverages ${partner}'s positional needs while capitalizing on value inefficiencies. Your ${userGives.map((p) => p.name).join(" + ")} package addresses their roster construction gaps, while ${userGets.map((p) => p.name).join(" + ")} fills your strategic requirements with favorable risk-adjusted returns.`,

      personalizedMessage: `Hey ${partner}! I've been analyzing our rosters and think we could both benefit from a trade. I'd like to offer my ${userGives.map((p) => `${p.name} (${p.position})`).join(" + ")} for your ${userGets.map((p) => `${p.name} (${p.position})`).join(" + ")}. The values are pretty close (${valueDifferential > 0 ? `+${valueDifferential}` : valueDifferential} differential) and it helps both our lineups. What do you think?`,

      timingAdvice: {
        bestTiming: "Tuesday 2:00-4:00 PM EST",
        reasoning:
          "Historical data shows 73% higher acceptance rate when sent after Monday lineup decisions but before Wednesday waiver processing. Target owner typically checks app during lunch hours on weekdays.",
        riskFactors: [
          "Upcoming bye weeks may affect perceived player value",
          "Recent injury news could impact negotiation leverage",
          "League trade deadline approaching in 3 weeks",
        ],
      },

      negotiationBackup: `If they counter or hesitate, try: "I understand if you want to think about it. Would you be more interested if I threw in ${userGives[0]?.name || "a bench player"} instead? Or we could do a different structure - what positions are you most looking to upgrade?"`,
    }

    return NextResponse.json({
      success: true,
      context,
      scanUsed: true,
      remainingScans: 4, // Mock remaining scans
    })
  } catch (error) {
    console.error("Trade analysis error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to analyze trade" }, { status: 500 })
  }
}
