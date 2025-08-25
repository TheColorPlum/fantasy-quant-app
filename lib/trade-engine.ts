// Advanced trade analysis engine
import type { SandboxPlayer } from "./sandbox-store" // Import SandboxPlayer type

// Basic Player interface for trade analysis
export interface Player {
  id: string
  name: string
  position: string
  value: number
  injuryStatus?: "healthy" | "questionable" | "doubtful" | "out" | "ir"
  byeWeek?: number
  nflTeam?: string
}

export interface TradeScenario {
  userGives: Player[]
  userGets: Player[]
  partner: string
  confidence: number
  reasoning: string
  riskLevel: "low" | "medium" | "high"
  timeframe: "immediate" | "short-term" | "long-term"
  aggressiveness: number // Added aggressiveness field
}

export interface TradeMetrics {
  valueDifferential: number
  positionScarcity: Record<string, number>
  injuryRisk: number
  scheduleStrength: number
  byeWeekImpact: number
}

export class TradeAnalysisEngine {
  private positionValues = {
    QB: 1.0,
    RB: 1.2,
    WR: 1.1,
    TE: 0.9,
    K: 0.3,
    DST: 0.4,
  }

  async analyzeTradeScenario(
    userGives: Player[],
    userGets: Player[],
    partner: string,
    leagueContext?: any,
  ): Promise<{
    metrics: TradeMetrics
    scenario: TradeScenario
    recommendations: string[]
    validation: {
      isValid: boolean
      errors: string[]
      warnings: string[]
    }
  }> {
    const metrics = this.calculateTradeMetrics(userGives, userGets)
    const scenario = this.generateTradeScenario(userGives, userGets, partner, metrics)
    const recommendations = this.generateRecommendations(scenario, metrics)
    const validation = validateTrade(userGives as unknown as SandboxPlayer[], userGets as unknown as SandboxPlayer[]) // Validate trade

    return { metrics, scenario, recommendations, validation }
  }

  private calculateTradeMetrics(userGives: Player[], userGets: Player[]): TradeMetrics {
    const givesValue = userGives.reduce((sum, player) => sum + player.value, 0)
    const getsValue = userGets.reduce((sum, player) => sum + player.value, 0)
    const valueDifferential = getsValue - givesValue

    // Calculate position scarcity
    const positionScarcity: Record<string, number> = {}
    const allPlayers = [...userGives, ...userGets]

    for (const player of allPlayers) {
      positionScarcity[player.position] = (positionScarcity[player.position] || 0) + 1
    }

    // Calculate injury risk
    const injuryRisk =
      allPlayers.reduce((risk, player) => {
        const injuryMultiplier = {
          healthy: 0,
          questionable: 0.2,
          doubtful: 0.5,
          out: 1.0,
          ir: 1.0,
        }
        return risk + (injuryMultiplier[player.injuryStatus as keyof typeof injuryMultiplier] || 0)
      }, 0) / allPlayers.length

    // Mock schedule strength and bye week impact
    const scheduleStrength = Math.random() * 0.4 + 0.3 // 0.3-0.7
    const byeWeekImpact = this.calculateByeWeekImpact(allPlayers)

    return {
      valueDifferential,
      positionScarcity,
      injuryRisk,
      scheduleStrength,
      byeWeekImpact,
    }
  }

  private calculateByeWeekImpact(players: Player[]): number {
    const currentWeek = 12 // Mock current week
    const upcomingByes = players.filter(
      (player) => player.byeWeek && player.byeWeek > currentWeek && player.byeWeek <= currentWeek + 4,
    ).length

    return upcomingByes / players.length
  }

  private generateTradeScenario(
    userGives: Player[],
    userGets: Player[],
    partner: string,
    metrics: TradeMetrics,
  ): TradeScenario {
    const confidence = this.calculateConfidence(metrics)
    const riskLevel = this.assessRiskLevel(metrics)
    const timeframe = this.determineTimeframe(userGives, userGets)
    const aggressiveness = calcAggressiveness(userGives as unknown as SandboxPlayer[], userGets as unknown as SandboxPlayer[]) // Calculate aggressiveness

    const reasoning = this.generateReasoning(userGives, userGets, metrics)

    return {
      userGives,
      userGets,
      partner,
      confidence,
      reasoning,
      riskLevel,
      timeframe,
      aggressiveness,
    }
  }

  private calculateConfidence(metrics: TradeMetrics): number {
    let confidence = 75 // Base confidence

    // Adjust for value differential
    if (metrics.valueDifferential > 5) confidence += 15
    else if (metrics.valueDifferential > 0) confidence += 5
    else if (metrics.valueDifferential < -5) confidence -= 15
    else if (metrics.valueDifferential < 0) confidence -= 5

    // Adjust for injury risk
    confidence -= metrics.injuryRisk * 20

    // Adjust for bye week impact
    confidence -= metrics.byeWeekImpact * 10

    return Math.max(50, Math.min(95, confidence))
  }

  private assessRiskLevel(metrics: TradeMetrics): "low" | "medium" | "high" {
    let riskScore = 0

    if (metrics.injuryRisk > 0.3) riskScore += 2
    else if (metrics.injuryRisk > 0.1) riskScore += 1

    if (metrics.byeWeekImpact > 0.5) riskScore += 2
    else if (metrics.byeWeekImpact > 0.25) riskScore += 1

    if (Math.abs(metrics.valueDifferential) > 10) riskScore += 1

    if (riskScore >= 4) return "high"
    if (riskScore >= 2) return "medium"
    return "low"
  }

  private determineTimeframe(userGives: Player[], userGets: Player[]): "immediate" | "short-term" | "long-term" {
    const avgAge = [...userGives, ...userGets].length // Mock age calculation
    const injuredPlayers = [...userGives, ...userGets].filter((p) => p.injuryStatus !== "healthy").length

    if (injuredPlayers > 0) return "long-term"
    if (avgAge > 6) return "short-term" // Mock logic
    return "immediate"
  }

  private generateReasoning(userGives: Player[], userGets: Player[], metrics: TradeMetrics): string {
    const reasons = []

    if (metrics.valueDifferential > 5) {
      reasons.push("Significant value advantage in your favor")
    } else if (metrics.valueDifferential > 0) {
      reasons.push("Slight value edge in your favor")
    } else if (metrics.valueDifferential < -5) {
      reasons.push("Paying premium for target players")
    }

    if (metrics.injuryRisk > 0.2) {
      reasons.push("Elevated injury risk requires monitoring")
    }

    if (metrics.byeWeekImpact > 0.3) {
      reasons.push("Bye week timing may impact short-term performance")
    }

    const positionUpgrades = this.identifyPositionUpgrades(userGives, userGets)
    if (positionUpgrades.length > 0) {
      reasons.push(`Upgrades at ${positionUpgrades.join(", ")}`)
    }

    return reasons.join(". ") || "Balanced trade with strategic value"
  }

  private identifyPositionUpgrades(userGives: Player[], userGets: Player[]): string[] {
    const givesByPosition = this.groupByPosition(userGives)
    const getsByPosition = this.groupByPosition(userGets)
    const upgrades = []

    for (const position of Object.keys(getsByPosition)) {
      const getsValue = getsByPosition[position].reduce((sum, p) => sum + p.value, 0)
      const givesValue = (givesByPosition[position] || []).reduce((sum, p) => sum + p.value, 0)

      if (getsValue > givesValue * 1.1) {
        upgrades.push(position)
      }
    }

    return upgrades
  }

  private groupByPosition(players: Player[]): Record<string, Player[]> {
    return players.reduce(
      (acc, player) => {
        if (!acc[player.position]) acc[player.position] = []
        acc[player.position].push(player)
        return acc
      },
      {} as Record<string, Player[]>,
    )
  }

  private generateRecommendations(scenario: TradeScenario, metrics: TradeMetrics): string[] {
    const recommendations = []

    if (scenario.confidence > 85) {
      recommendations.push("Strong trade opportunity - execute immediately")
    } else if (scenario.confidence > 70) {
      recommendations.push("Solid trade with good upside potential")
    } else {
      recommendations.push("Proceed with caution - consider alternatives")
    }

    if (scenario.riskLevel === "high") {
      recommendations.push("High risk trade - monitor injury reports closely")
    }

    if (metrics.byeWeekImpact > 0.3) {
      recommendations.push("Plan for bye week coverage in coming weeks")
    }

    if (metrics.valueDifferential < -5) {
      recommendations.push("Consider adding a bench player to balance value")
    }

    return recommendations
  }
}

export function calcAggressiveness(give: SandboxPlayer[], get: SandboxPlayer[]): number {
  if (give.length === 0 && get.length === 0) return 0

  const giveValue = give.reduce((sum, p) => sum + p.value, 0)
  const getValue = get.reduce((sum, p) => sum + p.value, 0)

  // Calculate value at risk as percentage of total value being traded
  const totalValue = giveValue + getValue
  if (totalValue === 0) return 0

  // Aggressiveness based on value differential and total value at risk
  const valueDiff = Math.abs(getValue - giveValue)
  const riskFactor = Math.min(totalValue / 100, 1) // Normalize to 0-1 based on total value
  const diffFactor = Math.min(valueDiff / 20, 1) // Normalize value difference

  return Math.min(riskFactor * 0.6 + diffFactor * 0.4, 1)
}

export function validateTrade(
  give: SandboxPlayer[],
  get: SandboxPlayer[],
): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if trade has players on both sides
  if (give.length === 0 || get.length === 0) {
    errors.push("Add at least one player to Give and Get to continue.")
  }

  // Check position balance warnings
  const givePositions = give.reduce(
    (acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const getPositions = get.reduce(
    (acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Check for position imbalances
  Object.keys(givePositions).forEach((pos) => {
    const giving = givePositions[pos] || 0
    const getting = getPositions[pos] || 0

    if (giving > getting && pos === "TE") {
      warnings.push("You're trading away your only TE. Consider adding a replacement.")
    }
    if (giving > getting && pos === "QB") {
      warnings.push("You're trading away QB depth. Consider roster implications.")
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Types for trade evaluation
export interface TradePlayer {
  id: string
  name: string
  position: string
  value: number
}

export interface TradeEvaluationInput {
  teamA: {
    gives: TradePlayer[]
    gets: TradePlayer[]
  }
  teamB: {
    gives: TradePlayer[]
    gets: TradePlayer[]
  }
}

export interface TeamData {
  id: string
  players: TradePlayer[]
  needScore: number
  totalValue: number
}

export interface TradeEvaluationResult {
  fairnessScore: number
  rationale: string
  valueDeltas: {
    teamA: number
    teamB: number
  }
  needDeltas?: {
    teamA: number
    teamB: number
  }
}

/**
 * Evaluate a trade proposal using TDD A10 formulas for fairness scoring and rationale
 * 
 * Implementation of TDD A10 formula:
 * ΔValue_A = Σ Price(get_A) − Σ Price(give_A)
 * ΔValue_B = Σ Price(get_B) − Σ Price(give_B)
 * 
 * Fairness score ∈ [0,1] where 0.5 represents perfectly balanced trades
 * Symmetric evaluation ensures Team A vs Team B gives inverse fairness scores
 */
export function evaluateTrade(
  trade: TradeEvaluationInput,
  teamData: { teamA: TeamData; teamB: TeamData }
): TradeEvaluationResult {
  // Calculate value deltas using TDD A10 formula
  const teamAGiveValue = trade.teamA.gives.reduce((sum, player) => sum + (player.value || 0), 0)
  const teamAGetValue = trade.teamA.gets.reduce((sum, player) => sum + (player.value || 0), 0)
  const teamBGiveValue = trade.teamB.gives.reduce((sum, player) => sum + (player.value || 0), 0)
  const teamBGetValue = trade.teamB.gets.reduce((sum, player) => sum + (player.value || 0), 0)

  const deltaValueA = teamAGetValue - teamAGiveValue
  const deltaValueB = teamBGetValue - teamBGiveValue

  // Calculate fairness score based on trade magnitude and imbalance
  const totalValueExchanged = Math.max(teamAGiveValue, teamAGetValue, teamBGiveValue, teamBGetValue)
  const tradeMagnitude = Math.max(Math.abs(deltaValueA), Math.abs(deltaValueB)) // Largest individual value swing
  
  let fairnessScore = 0.5 // Start with neutral fairness
  
  if (totalValueExchanged > 0 && tradeMagnitude > 0) {
    // Calculate normalized trade magnitude (how big the value swings are)
    const normalizedMagnitude = Math.min(tradeMagnitude / Math.max(totalValueExchanged, 1), 1)
    
    // Determine which side benefits more and adjust fairness accordingly  
    const deltaValueDiff = Math.abs(deltaValueA - deltaValueB)
    
    if (deltaValueDiff > 0.1) { // Any meaningful trade imbalance
      if (deltaValueA > deltaValueB) {
        // Team A benefits more - fairness score > 0.5
        fairnessScore = 0.5 + (normalizedMagnitude * 0.4)
      } else if (deltaValueB > deltaValueA) {
        // Team B benefits more - fairness score < 0.5  
        fairnessScore = 0.5 - (normalizedMagnitude * 0.4)
      }
    } else {
      // Equal trades - slight adjustment based on trade size
      fairnessScore = 0.5 + (normalizedMagnitude * 0.1) // Small positive adjustment for equal but larger trades
    }
  }

  // Ensure fairness score stays within bounds [0, 1]
  fairnessScore = Math.max(0, Math.min(1, fairnessScore))

  // Generate human-readable rationale
  const rationale = generateTradeRationale(trade, deltaValueA, deltaValueB, fairnessScore)

  return {
    fairnessScore,
    rationale,
    valueDeltas: {
      teamA: Number(deltaValueA.toFixed(1)),
      teamB: Number(deltaValueB.toFixed(1))
    }
  }
}

/**
 * Generate human-readable rationale explaining the trade evaluation
 * TODO: Replace with LLM-based explainability for more sophisticated analysis
 */
function generateTradeRationale(
  trade: TradeEvaluationInput,
  deltaValueA: number,
  deltaValueB: number,
  fairnessScore: number
): string {
  // Simplified rationale generation - placeholder for future LLM integration
  const valueDiff = Math.abs(deltaValueA + deltaValueB)
  
  // Basic value analysis
  let valueAnalysis = ""
  if (valueDiff < 2) {
    valueAnalysis = "Values are well-balanced with minimal differential"
  } else if (deltaValueA > deltaValueB + 5) {
    valueAnalysis = `Team A gains significant value advantage (+${deltaValueA.toFixed(1)} vs ${deltaValueB.toFixed(1)})`
  } else if (deltaValueB > deltaValueA + 5) {
    valueAnalysis = `Team B gains significant value advantage (+${deltaValueB.toFixed(1)} vs ${deltaValueA.toFixed(1)})`
  } else {
    valueAnalysis = "Trade shows moderate value imbalance"
  }

  // Basic position analysis
  const positionsInvolved = new Set([
    ...trade.teamA.gives.map(p => p.position),
    ...trade.teamA.gets.map(p => p.position),
    ...trade.teamB.gives.map(p => p.position),
    ...trade.teamB.gets.map(p => p.position)
  ])

  let positionAnalysis = ""
  if (positionsInvolved.size === 1) {
    const position = Array.from(positionsInvolved)[0]
    positionAnalysis = `Straight ${position} swap maintains positional balance`
  } else if (positionsInvolved.size === 2) {
    const positions = Array.from(positionsInvolved)
    positionAnalysis = `Position trade exchanging ${positions[0]} for ${positions[1]}`
  } else {
    positionAnalysis = `Multi-position trade involving ${Array.from(positionsInvolved).join(", ")}`
  }

  // Basic fairness assessment
  let fairnessAnalysis = ""
  if (fairnessScore >= 0.6) {
    fairnessAnalysis = "Trade appears to favor one team"
  } else if (fairnessScore <= 0.4) {
    fairnessAnalysis = "Trade appears to favor the opposing team"
  } else {
    fairnessAnalysis = "Trade appears relatively balanced"
  }

  return `${valueAnalysis}. ${positionAnalysis}. ${fairnessAnalysis}.`
}
