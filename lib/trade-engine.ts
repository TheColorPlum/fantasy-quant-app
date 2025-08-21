// Advanced trade analysis engine
import type { Player } from "./database"
import type { SandboxPlayer } from "./sandbox" // Import SandboxPlayer type

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
    const validation = validateTrade(userGives as SandboxPlayer[], userGets as SandboxPlayer[]) // Validate trade

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
        return risk + (injuryMultiplier[player.injuryStatus] || 0)
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
      (player) => player.byeWeek > currentWeek && player.byeWeek <= currentWeek + 4,
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
    const aggressiveness = calcAggressiveness(userGives as SandboxPlayer[], userGets as SandboxPlayer[]) // Calculate aggressiveness

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
