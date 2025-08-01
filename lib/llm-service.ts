export interface TradeContext {
  whyItWorks: string
  personalizedMessage: string
  timingAdvice: {
    bestTiming: string
    reasoning: string
    riskFactors: string[]
  }
  negotiationBackup?: string
}

interface Player {
  name: string
  position: string
  value: number
  trend: number
}

export async function generateTradeContext(
  partner: string,
  userGives: Player[],
  userGets: Player[],
  valueDifferential: number,
): Promise<TradeContext> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Generate contextual trade analysis
  const givesNames = userGives.map((p) => p.name).join(" + ")
  const getsNames = userGets.map((p) => p.name).join(" + ")
  const givesPositions = userGives.map((p) => p.position).join("/")
  const getsPositions = userGets.map((p) => p.position).join("/")

  const whyItWorks = `This trade leverages ${partner}'s positional needs while capitalizing on value inefficiencies. Your ${givesNames} package addresses their roster construction gaps at ${givesPositions}, while ${getsNames} fills your strategic requirements at ${getsPositions} with favorable risk-adjusted returns. The ${valueDifferential > 0 ? "positive" : "negative"} value differential of ${Math.abs(valueDifferential)} creates ${valueDifferential > 0 ? "upside potential" : "buy-low opportunity"}.`

  const personalizedMessage = `Hey ${partner}! I've been analyzing our rosters and think we could both benefit from a trade. I'd like to offer my ${userGives.map((p) => `${p.name} (${p.position})`).join(" + ")} for your ${userGets.map((p) => `${p.name} (${p.position})`).join(" + ")}. The values are pretty close (${valueDifferential > 0 ? `+${valueDifferential}` : valueDifferential} differential) and it helps both our lineups. What do you think?`

  const timingAdvice = {
    bestTiming: "Tuesday 2:00-4:00 PM EST",
    reasoning:
      "Historical data shows 73% higher acceptance rate when sent after Monday lineup decisions but before Wednesday waiver processing. Target owner typically checks app during lunch hours on weekdays.",
    riskFactors: [
      "Upcoming bye weeks may affect perceived player value",
      "Recent injury news could impact negotiation leverage",
      "League trade deadline approaching in 3 weeks",
    ],
  }

  const negotiationBackup = `If they counter or hesitate, try: "I understand if you want to think about it. Would you be more interested if I threw in ${userGives[0]?.name || "a bench player"} instead? Or we could do a different structure - what positions are you most looking to upgrade?"`

  return {
    whyItWorks,
    personalizedMessage,
    timingAdvice,
    negotiationBackup,
  }
}
