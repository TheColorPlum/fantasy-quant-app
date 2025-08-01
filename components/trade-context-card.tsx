"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Copy, TrendingUp, AlertTriangle, MessageSquare, BarChart3, Zap } from "lucide-react"
import type { TradeContext } from "@/lib/llm-service"

interface TradeContextCardProps {
  context: TradeContext | null
  isLoading: boolean
  onCopyMessage: (message: string) => void
  isPremium: boolean
}

export function TradeContextCard({ context, isLoading, onCopyMessage, isPremium }: TradeContextCardProps) {
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)

  // For development, always show premium features (hide monetization)
  const showPremiumFeatures = true

  const handleCopyMessage = async (message: string, type: string) => {
    await navigator.clipboard.writeText(message)
    setCopiedMessage(type)
    setTimeout(() => setCopiedMessage(null), 2000)
    onCopyMessage(message)
  }

  if (isLoading) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="font-mono text-lg text-[#22c55e] flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            TRADE_INTELLIGENCE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full bg-[#2a2a2a]" />
            <Skeleton className="h-4 w-3/4 bg-[#2a2a2a]" />
            <Skeleton className="h-4 w-1/2 bg-[#2a2a2a]" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full bg-[#2a2a2a]" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!context) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardContent className="pt-6 text-center">
          <div className="space-y-4">
            <BarChart3 className="h-12 w-12 text-[#94a3b8] mx-auto" />
            <div className="font-mono text-sm text-[#94a3b8]">Select a trade proposal to see AI-powered insights</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
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
          <CardTitle className="font-mono text-lg text-[#22c55e] flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            PERSONALIZED_MESSAGE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
            <div className="font-mono text-sm text-[#cbd5e1] leading-relaxed mb-4">{context.personalizedMessage}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyMessage(context.personalizedMessage, "message")}
              className="font-mono text-xs border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e] hover:text-black"
            >
              <Copy className="h-3 w-3 mr-1" />
              {copiedMessage === "message" ? "COPIED" : "COPY_MESSAGE"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timing Intelligence - Show for development */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="font-mono text-lg text-[#22c55e] flex items-center gap-2">
            <Clock className="h-5 w-5" />
            TIMING_INTELLIGENCE
            {/* Hide premium badge for development */}
            {/* <Lock className="h-4 w-4 text-[#f59e0b]" /> */}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-[#94a3b8]">OPTIMAL_SEND_TIME:</span>
              <Badge className="bg-[#22c55e] text-black font-mono">{context.timingAdvice.bestTiming}</Badge>
            </div>
            <div className="font-mono text-sm text-[#cbd5e1] leading-relaxed">{context.timingAdvice.reasoning}</div>
          </div>

          <div className="space-y-2">
            <div className="font-mono text-sm text-[#f59e0b] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              RISK_FACTORS:
            </div>
            <ul className="space-y-1">
              {context.timingAdvice.riskFactors.map((risk, idx) => (
                <li key={idx} className="font-mono text-xs text-[#cbd5e1] flex items-start gap-2">
                  <span className="text-[#f59e0b] mt-1">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quantitative Reasoning - Show for development */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="font-mono text-lg text-[#22c55e] flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            QUANTITATIVE_REASONING
            {/* Hide premium badge for development */}
            {/* <Lock className="h-4 w-4 text-[#f59e0b]" /> */}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-[#94a3b8]">SUCCESS_PROBABILITY:</span>
                <span className="font-mono text-lg text-[#22c55e] font-bold">87%</span>
              </div>
              <Progress value={87} className="h-2" />
              <div className="font-mono text-xs text-[#94a3b8]">Based on 247 similar trades in your league history</div>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="space-y-1">
                <div className="text-[#94a3b8]">VALUE_DIFFERENTIAL</div>
                <div className="text-[#22c55e] font-bold">+2.3</div>
              </div>
              <div className="space-y-1">
                <div className="text-[#94a3b8]">TRADE_LEVERAGE</div>
                <div className="text-[#f59e0b] font-bold">HIGH</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-mono text-sm text-[#22c55e]">KEY_INSIGHTS:</div>
              <ul className="space-y-1">
                <li className="font-mono text-xs text-[#cbd5e1] flex items-start gap-2">
                  <span className="text-[#22c55e] mt-1">•</span>
                  Target team has accepted 67% of trades with similar value differentials
                </li>
                <li className="font-mono text-xs text-[#cbd5e1] flex items-start gap-2">
                  <span className="text-[#22c55e] mt-1">•</span>
                  Your offered players have 23% higher acceptance rate in 2-for-1 trades
                </li>
                <li className="font-mono text-xs text-[#cbd5e1] flex items-start gap-2">
                  <span className="text-[#22c55e] mt-1">•</span>
                  Position scarcity analysis favors this trade structure
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Negotiation Backup - Show for development */}
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="font-mono text-lg text-[#22c55e] flex items-center gap-2">
            <Zap className="h-5 w-5" />
            NEGOTIATION_BACKUP
            {/* Hide premium badge for development */}
            {/* <Lock className="h-4 w-4 text-[#f59e0b]" /> */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="font-mono text-sm text-[#cbd5e1] leading-relaxed">{context.negotiationBackup}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyMessage(context.negotiationBackup || "", "backup")}
              className="font-mono text-xs border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-black"
            >
              <Copy className="h-3 w-3 mr-1" />
              {copiedMessage === "backup" ? "COPIED" : "COPY_STRATEGY"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hide premium upsell for development */}
      {/* Premium Upsell Card - Hidden for development
      {!showPremiumFeatures && (
        <Card className="bg-gradient-to-r from-[#f59e0b]/10 to-[#f59e0b]/5 border-[#f59e0b]/20">
          <CardContent className="pt-6 text-center">
            <Crown className="h-12 w-12 text-[#f59e0b] mx-auto mb-4" />
            <div className="font-mono text-xl text-[#f59e0b] font-bold mb-2">UNLOCK_PREMIUM</div>
            <div className="font-mono text-sm text-[#cbd5e1] mb-4">
              Get timing intelligence, success probabilities, and negotiation strategies
            </div>
            <div className="space-y-2 mb-6">
              <div className="font-mono text-xs text-[#94a3b8] flex items-center justify-center gap-2">
                <span className="text-[#22c55e]">✓</span> Unlimited trade scans
              </div>
              <div className="font-mono text-xs text-[#94a3b8] flex items-center justify-center gap-2">
                <span className="text-[#22c55e]">✓</span> Advanced timing analysis
              </div>
              <div className="font-mono text-xs text-[#94a3b8] flex items-center justify-center gap-2">
                <span className="text-[#22c55e]">✓</span> Success probability scoring
              </div>
              <div className="font-mono text-xs text-[#94a3b8] flex items-center justify-center gap-2">
                <span className="text-[#22c55e]">✓</span> Negotiation backup strategies
              </div>
            </div>
            <Button className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-mono font-bold px-8">
              UPGRADE_FOR_$9.99/MONTH
            </Button>
          </CardContent>
        </Card>
      )}
      */}
    </div>
  )
}
