export interface TradeContext {
  whyItWorks: string
  timingAdvice: {
    bestTiming: string
    reasoning: string
    riskFactors: string[]
  }
  personalizedMessage: string
  negotiationBackup?: string
}

export interface TeamAnalysis {
  record: string
  rank: number
  recentPerformance: "hot" | "cold" | "average"
  keyNeeds: string[]
  desperation: "low" | "medium" | "high"
  recentEvents: string[]
}

// Mock team analysis data
const mockTeamAnalyses: Record<string, TeamAnalysis> = {
  TEAM_MAHOMES: {
    record: "8-3",
    rank: 1,
    recentPerformance: "hot",
    keyNeeds: ["WR depth", "RB consistency"],
    desperation: "low",
    recentEvents: ["Won last 3 games", "Kelce questionable with ankle"],
  },
  TEAM_ALLEN: {
    record: "7-4",
    rank: 2,
    recentPerformance: "average",
    keyNeeds: ["RB upgrade", "TE depth"],
    desperation: "medium",
    recentEvents: ["Lost close game last week", "Diggs dealing with hamstring"],
  },
  TEAM_BURROW: {
    record: "5-6",
    rank: 8,
    recentPerformance: "cold",
    keyNeeds: ["WR1", "QB consistency"],
    desperation: "high",
    recentEvents: ["Lost 3 of last 4", "Burrow struggling with accuracy"],
  },
}

export async function generateTradeContext(
  tradePartner: string,
  userGives: Array<{ name: string; position: string; value: number; trend: number }>,
  userGets: Array<{ name: string; position: string; value: number; trend: number }>,
  valueDifferential: number,
): Promise<TradeContext> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const partnerAnalysis = mockTeamAnalyses[tradePartner] || mockTeamAnalyses["TEAM_BURROW"]

  // Generate context based on team analysis
  const whyItWorks = generateWhyItWorks(partnerAnalysis, userGives, userGets, valueDifferential)
  const timingAdvice = generateTimingAdvice(partnerAnalysis, userGives, userGets)
  const personalizedMessage = generatePersonalizedMessage(partnerAnalysis, userGives, userGets, whyItWorks)
  const negotiationBackup = generateNegotiationBackup(partnerAnalysis, userGives, userGets)

  return {
    whyItWorks,
    timingAdvice,
    personalizedMessage,
    negotiationBackup,
  }
}

function generateWhyItWorks(
  analysis: TeamAnalysis,
  userGives: any[],
  userGets: any[],
  valueDifferential: number,
): string {
  const desperation =
    analysis.desperation === "high"
      ? "desperate for wins"
      : analysis.desperation === "medium"
        ? "looking to improve"
        : "in a strong position"

  const givingPlayer = userGives[0]
  const gettingPlayer = userGets[0]

  return `${analysis.record} ${analysis.recentPerformance === "cold" ? "and struggling lately" : ""}, they're ${desperation}. ${givingPlayer.name} fills their ${analysis.keyNeeds[0]} need while ${gettingPlayer.name} gives you the ${gettingPlayer.position} production you're targeting. ${Math.abs(valueDifferential) < 3 ? "Values align well" : valueDifferential > 0 ? "You're getting good value" : "You're paying a slight premium but addressing a key need"}.`
}

function generateTimingAdvice(
  analysis: TeamAnalysis,
  userGives: any[],
  userGets: any[],
): { bestTiming: string; reasoning: string; riskFactors: string[] } {
  const player = userGets[0]

  return {
    bestTiming:
      analysis.recentPerformance === "cold"
        ? "Send immediately while they're motivated to make changes"
        : `Wait until after ${player.name}'s next tough matchup`,
    reasoning:
      analysis.recentPerformance === "cold"
        ? "Recent struggles make them more open to roster changes"
        : "A difficult matchup might lower their confidence in current players",
    riskFactors: [
      "Avoid sending after their big wins",
      "Don't wait too long - other managers might make offers",
      analysis.desperation === "high" ? "Strike while they're desperate" : "Be patient with timing",
    ],
  }
}

function generatePersonalizedMessage(
  analysis: TeamAnalysis,
  userGives: any[],
  userGets: any[],
  whyItWorks: string,
): string {
  const givingPlayer = userGives[0]
  const gettingPlayer = userGets[0]

  const opener =
    analysis.recentPerformance === "cold"
      ? `Tough stretch lately - I know how frustrating those close losses can be.`
      : analysis.recentPerformance === "hot"
        ? `Great run you're on! Looking to make a move that could help us both.`
        : `Hey! Been thinking about a trade that could work for both our teams.`

  const proposal = `What do you think about swapping my ${givingPlayer.name} for your ${gettingPlayer.name}?`

  const reasoning =
    analysis.keyNeeds.length > 0
      ? `I know you've been looking for ${analysis.keyNeeds[0]}, and ${givingPlayer.name} could be exactly what you need there.`
      : `${givingPlayer.name} has been solid and could give you some good production.`

  const closer =
    analysis.desperation === "high"
      ? `With the playoff push coming up, this could be the move that gets us both where we need to be. Let me know what you think!`
      : `Fair deal that helps both our lineups. Interested?`

  return `${opener} ${proposal} ${reasoning} ${closer}`
}

function generateNegotiationBackup(analysis: TeamAnalysis, userGives: any[], userGets: any[]): string {
  return `If they hesitate, offer to throw in a bench player or suggest a different player of similar value. Their ${analysis.keyNeeds[0]} need gives you negotiating leverage.`
}
