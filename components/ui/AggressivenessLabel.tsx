"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface AggressivenessLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  deltaYou: number
  deltaOpp: number
}

interface AggressivenessLevel {
  label: string
  description: string
  color: string
  bgColor: string
}

const getAggressivenessLevel = (deltaYou: number, deltaOpp: number): AggressivenessLevel => {
  // Calculate the trade balance score (higher = more favorable for you)
  const tradeBalance = deltaYou - deltaOpp
  
  // Risky: You lose value or opponent gains too much
  if (deltaYou < 0 || deltaOpp > 2) {
    return {
      label: "Risky",
      description: "Trade may not be favorable for you",
      color: "text-yellow-600", 
      bgColor: "bg-yellow-50"
    }
  }
  
  // Aggressive: Large gain for you, significant loss for opponent
  if (tradeBalance >= 6) {
    return {
      label: "Aggressive", 
      description: "High-reward trade heavily favoring you",
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  }
  
  // Moderate: Decent gain, reasonable opponent loss
  if (tradeBalance > 2.5 && tradeBalance < 6) {
    return {
      label: "Moderate",
      description: "Good value trade with acceptable opponent impact",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  }
  
  // Balanced: Roughly even trade
  if (Math.abs(tradeBalance) <= 2.5) {
    return {
      label: "Balanced",
      description: "Fair trade with mutual benefit",
      color: "text-green-600", 
      bgColor: "bg-green-50"
    }
  }
  
  // Conservative: Small positive gain for you, small loss for opponent  
  return {
    label: "Conservative",
    description: "Modest improvement with minimal risk",
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  }
}

export const AggressivenessLabel = React.forwardRef<HTMLDivElement, AggressivenessLabelProps>(
  ({ className, deltaYou, deltaOpp, ...props }, ref) => {
    const level = getAggressivenessLevel(deltaYou, deltaOpp)
    
    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)} {...props}>
        <Badge 
          variant="secondary"
          className={cn(
            "rounded-[2px] text-xs font-medium",
            level.color,
            level.bgColor
          )}
        >
          {level.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {level.description}
        </span>
      </div>
    )
  }
)
AggressivenessLabel.displayName = "AggressivenessLabel"