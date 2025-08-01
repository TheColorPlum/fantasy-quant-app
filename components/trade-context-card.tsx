"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Lock, Copy, Clock, TrendingUp, BarChart3, MessageSquare, ChevronDown, ChevronUp, Zap } from "lucide-react"

export interface TradeContext {
  whyItWorks: string
  personalizedMessage: string
  timingIntelligence?: {
    optimalSendTime: string
    reasoning: string
    riskFactors: string[]
  }
  quantitativeReasoning?: {
    successProbability: number
    valueDifferential: number
    keyInsights: string[]
  }
  negotiationBackup?: {
    backupStrategies: string[]
    leveragePoints: string[]
  }
}

interface TradeContextCardProps {
  context: TradeContext | null
  isLoading: boolean
  onCopyMessage: (message: string) => void
  isPremium: boolean
}

export function TradeContextCard({ context, isLoading, onCopyMessage, isPremium }: TradeContextCardProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  if (isLoading) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-[#2a2a2a] rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-[#2a2a2a] rounded w-1/2"></div>
            </div>
            <div className="font-mono text-sm text-[#94a3b8] text-center">ANALYZING_TRADE_DYNAMICS...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!context) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardContent className="pt-6 text-center">
          <div className="font-mono text-sm text-[#94a3b8] mb-4">
            Configure your trade above to see AI-powered insights
          </div>
          <BarChart3 className="h-12 w-12 text-[#2a2a2a] mx-auto" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Why This Works - Always Free */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="font-mono text-lg text-[#22c55e] flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            WHY_THIS_WORKS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="font-mono text-sm text-[#cbd5e1] leading-relaxed">{context.whyItWorks}</div>
        </CardContent>
      </Card>

      {/* Personalized Message - Always Free */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-lg text-[#22c55e] flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              PERSONALIZED_MESSAGE
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopyMessage(context.personalizedMessage)}
              className="font-mono text-xs border-[#2a2a2a] hover:bg-[#2a2a2a] text-[#cbd5e1]"
            >
              <Copy className="h-3 w-3 mr-1" />
              COPY
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={context.personalizedMessage}
            readOnly
            className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-sm resize-none text-[#cbd5e1]"
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Timing Intelligence - Premium */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] relative">
        <CardHeader>
          <CardTitle className="font-mono text-lg text-[#f59e0b] flex items-center gap-2">
            <Clock className="h-5 w-5" />
            TIMING_INTELLIGENCE
            <Lock className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPremium && context.timingIntelligence ? (
            <div className="space-y-4">
              <div>
                <div className="font-mono text-sm text-[#94a3b8] mb-2">OPTIMAL_SEND_TIME:</div>
                <div className="font-mono text-lg text-[#22c55e] font-bold">
                  {context.timingIntelligence.optimalSendTime}
                </div>
              </div>

              <div>
                <div className="font-mono text-sm text-[#94a3b8] mb-2">REASONING:</div>
                <div className="font-mono text-sm text-[#cbd5e1]">{context.timingIntelligence.reasoning}</div>
              </div>

              <div>
                <div className="font-mono text-sm text-[#94a3b8] mb-2">RISK_FACTORS:</div>
                <div className="space-y-1">
                  {context.timingIntelligence.riskFactors.map((risk, idx) => (
                    <div key={idx} className="font-mono text-xs text-[#f59e0b] flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#f59e0b] rounded-full"></div>
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="opacity-30 space-y-4">
                <div>
                  <div className="font-mono text-sm text-[#94a3b8] mb-2">OPTIMAL_SEND_TIME:</div>
                  <div className="font-mono text-lg text-[#22c55e] font-bold">Tuesday 2:00 PM EST</div>
                </div>
                <div>
                  <div className="font-mono text-sm text-[#94a3b8] mb-2">REASONING:</div>
                  <div className="font-mono text-sm text-[#cbd5e1]">
                    Historical data shows 73% higher acceptance rate when sent after Monday lineup decisions...
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/80">
                <div className="text-center">
                  <Lock className="h-8 w-8 text-[#f59e0b] mx-auto mb-2" />
                  <div className="font-mono text-sm text-[#f59e0b] font-bold mb-1">PREMIUM_FEATURE</div>
                  <div className="font-mono text-xs text-[#94a3b8] mb-3">Unlock optimal timing insights</div>
                  <Button size="sm" className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-mono font-bold">
                    UPGRADE
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quantitative Reasoning - Premium */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-lg text-[#f59e0b] flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              QUANTITATIVE_REASONING
              <Lock className="h-4 w-4" />
            </CardTitle>
            {isPremium && context.quantitativeReasoning && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection("quant")}
                className="font-mono text-xs text-[#cbd5e1]"
              >
                {expandedSections.quant ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                DETAILS
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isPremium && context.quantitativeReasoning ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-sm text-[#94a3b8] mb-2">SUCCESS_PROBABILITY:</div>
                  <div className="font-mono text-2xl text-[#22c55e] font-bold mb-2">
                    {context.quantitativeReasoning.successProbability}%
                  </div>
                  <Progress value={context.quantitativeReasoning.successProbability} className="h-2 bg-[#2a2a2a]" />
                </div>
                <div>
                  <div className="font-mono text-sm text-[#94a3b8] mb-2">VALUE_DIFFERENTIAL:</div>
                  <div
                    className={`font-mono text-2xl font-bold mb-2 ${
                      context.quantitativeReasoning.valueDifferential >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                    }`}
                  >
                    {context.quantitativeReasoning.valueDifferential > 0 ? "+" : ""}
                    {context.quantitativeReasoning.valueDifferential}
                  </div>
                </div>
              </div>

              {expandedSections.quant && (
                <div>
                  <div className="font-mono text-sm text-[#94a3b8] mb-2">KEY_INSIGHTS:</div>
                  <div className="space-y-2">
                    {context.quantitativeReasoning.keyInsights.map((insight, idx) => (
                      <div key={idx} className="font-mono text-xs text-[#cbd5e1] flex items-start gap-2">
                        <div className="w-1 h-1 bg-[#22c55e] rounded-full mt-2 flex-shrink-0"></div>
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="opacity-30 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-mono text-sm text-[#94a3b8] mb-2">SUCCESS_PROBABILITY:</div>
                    <div className="font-mono text-2xl text-[#22c55e] font-bold mb-2">87%</div>
                    <Progress value={87} className="h-2 bg-[#2a2a2a]" />
                  </div>
                  <div>
                    <div className="font-mono text-sm text-[#94a3b8] mb-2">VALUE_DIFFERENTIAL:</div>
                    <div className="font-mono text-2xl text-[#22c55e] font-bold mb-2">+2.3</div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/80">
                <div className="text-center">
                  <Lock className="h-8 w-8 text-[#f59e0b] mx-auto mb-2" />
                  <div className="font-mono text-sm text-[#f59e0b] font-bold mb-1">PREMIUM_FEATURE</div>
                  <div className="font-mono text-xs text-[#94a3b8] mb-3">Unlock statistical analysis</div>
                  <Button size="sm" className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-mono font-bold">
                    UPGRADE
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Negotiation Backup - Premium */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] relative">
        <CardHeader>
          <CardTitle className="font-mono text-lg text-[#f59e0b] flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            NEGOTIATION_BACKUP
            <Lock className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPremium && context.negotiationBackup ? (
            <div className="space-y-4">
              <div>
                <div className="font-mono text-sm text-[#94a3b8] mb-2">BACKUP_STRATEGIES:</div>
                <div className="space-y-2">
                  {context.negotiationBackup.backupStrategies.map((strategy, idx) => (
                    <div key={idx} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded p-3">
                      <div className="font-mono text-sm text-[#cbd5e1] flex items-center justify-between">
                        {strategy}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopyMessage(strategy)}
                          className="font-mono text-xs"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-mono text-sm text-[#94a3b8] mb-2">LEVERAGE_POINTS:</div>
                <div className="space-y-1">
                  {context.negotiationBackup.leveragePoints.map((point, idx) => (
                    <div key={idx} className="font-mono text-xs text-[#22c55e] flex items-center gap-2">
                      <div className="w-1 h-1 bg-[#22c55e] rounded-full"></div>
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="opacity-30 space-y-4">
                <div>
                  <div className="font-mono text-sm text-[#94a3b8] mb-2">BACKUP_STRATEGIES:</div>
                  <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded p-3">
                    <div className="font-mono text-sm text-[#cbd5e1]">
                      "If they counter, try offering your WR2 instead..."
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/80">
                <div className="text-center">
                  <Lock className="h-8 w-8 text-[#f59e0b] mx-auto mb-2" />
                  <div className="font-mono text-sm text-[#f59e0b] font-bold mb-1">PREMIUM_FEATURE</div>
                  <div className="font-mono text-xs text-[#94a3b8] mb-3">Unlock negotiation strategies</div>
                  <Button size="sm" className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-mono font-bold">
                    UPGRADE
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium Upsell Card */}
      {!isPremium && (
        <Card className="bg-gradient-to-r from-[#f59e0b]/10 to-[#f59e0b]/5 border-[#f59e0b]/20">
          <CardContent className="pt-6 text-center">
            <Zap className="h-12 w-12 text-[#f59e0b] mx-auto mb-4" />
            <div className="font-mono text-xl text-[#f59e0b] font-bold mb-2">UNLOCK_FULL_POTENTIAL</div>
            <div className="font-mono text-sm text-[#cbd5e1] mb-4">
              Get timing intelligence, success probabilities, and negotiation backup strategies
            </div>
            <Button className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-mono font-bold px-8">
              UPGRADE_TO_PREMIUM
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
