"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Clock, AlertTriangle, MessageSquare } from "lucide-react"

interface TradeContext {
  whyItWorks: string
  personalizedMessage: string
  timingAdvice: {
    bestTiming: string
    reasoning: string
    riskFactors: string[]
  }
  negotiationBackup?: string
}

interface TradeContextCardProps {
  context: TradeContext | null
  isLoading?: boolean
  onCopyMessage?: (message: string) => void
  isPremium?: boolean
}

export function TradeContextCard({
  context,
  isLoading = false,
  onCopyMessage,
  isPremium = false,
}: TradeContextCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="font-mono text-[#22c55e]">TRADE_INTELLIGENCE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-[#2a2a2a] rounded w-3/4"></div>
                <div className="h-4 bg-[#2a2a2a] rounded w-1/2"></div>
                <div className="h-4 bg-[#2a2a2a] rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!context) {
    return (
      <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
        <CardHeader>
          <CardTitle className="font-mono text-[#22c55e]">TRADE_INTELLIGENCE</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="font-mono text-sm text-[#94a3b8]">
              SELECT_A_PROPOSAL
              <br />
              TO_VIEW_DETAILS
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-mono text-[#22c55e]">TRADE_INTELLIGENCE</CardTitle>
          {isPremium && (
            <Badge className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20 font-mono text-xs">PREMIUM</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Why It Works */}
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <MessageSquare className="h-4 w-4 text-[#22c55e]" />
            <p className="font-mono text-xs text-[#94a3b8]">WHY_IT_WORKS:</p>
          </div>
          <p className="font-mono text-sm text-[#cbd5e1] leading-relaxed">{context.whyItWorks}</p>
        </div>

        {/* Timing Advice */}
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-[#f59e0b]" />
            <p className="font-mono text-xs text-[#94a3b8]">TIMING_ADVICE:</p>
          </div>
          <p className="font-mono text-sm text-[#22c55e] mb-2">{context.timingAdvice.bestTiming}</p>
          <p className="font-mono text-xs text-[#cbd5e1] mb-3">{context.timingAdvice.reasoning}</p>

          {context.timingAdvice.riskFactors.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-3 w-3 text-[#ef4444]" />
                <p className="font-mono text-xs text-[#ef4444]">RISK_FACTORS:</p>
              </div>
              {context.timingAdvice.riskFactors.map((risk, index) => (
                <p key={index} className="font-mono text-xs text-[#94a3b8] ml-5">
                  • {risk}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Negotiation Backup */}
        {context.negotiationBackup && (
          <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
            <p className="font-mono text-xs text-[#94a3b8] mb-2">NEGOTIATION_BACKUP:</p>
            <p className="font-mono text-sm text-[#cbd5e1] leading-relaxed">{context.negotiationBackup}</p>
          </div>
        )}

        {/* Copy Message Button */}
        {onCopyMessage && (
          <Button
            onClick={() => onCopyMessage(context.personalizedMessage)}
            variant="outline"
            size="sm"
            className="w-full border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e] hover:text-black bg-transparent font-mono"
          >
            <Copy className="mr-2 h-4 w-4" />
            COPY_MESSAGE
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
