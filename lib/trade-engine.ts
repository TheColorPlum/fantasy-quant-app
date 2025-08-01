// Advanced trade analysis engine
import type { Player } from "./database"

export interface TradeScenario {
  userGives: Player[]
  userGets: Player[]
  partner: string
  confidence: number
  reasoning: string
  riskLevel: "low" | "medium" | "high"
  timeframe: "immediate" | "short-term" | "long-term"
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
  }> {
    const metrics = this.calculateTradeMetrics(userGives, userGets)
    const scenario = this.generateTradeScenario(userGives, userGets, partner, metrics)
    const recommendations = this.generateRecommendations(scenario, metrics)

    return { metrics, scenario, recommendations }
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

    const reasoning = this.generateReasoning(userGives, userGets, metrics)

    return {
      userGives,
      userGets,
      partner,
      confidence,
      reasoning,
      riskLevel,
      timeframe,
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
