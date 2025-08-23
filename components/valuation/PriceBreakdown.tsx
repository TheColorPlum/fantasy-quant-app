"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export interface ValuationComponents {
  anchor: number
  deltaPerf: number
  vorp: number
  global: number
}

export interface PriceBreakdownProps extends React.HTMLAttributes<HTMLButtonElement> {
  price: number
  components: ValuationComponents
  children?: React.ReactNode
}

interface ComponentDetail {
  key: keyof ValuationComponents
  label: string
  description: string
  color: string
}

const componentDetails: ComponentDetail[] = [
  {
    key: 'anchor',
    label: 'Anchor Value',
    description: 'Base auction value from historical data',
    color: 'text-blue-600'
  },
  {
    key: 'deltaPerf',
    label: 'Performance Delta', 
    description: 'Adjustment based on recent performance trends',
    color: 'text-green-600'
  },
  {
    key: 'vorp',
    label: 'Value Over Replacement',
    description: 'Value compared to replacement player at position',
    color: 'text-purple-600'
  },
  {
    key: 'global',
    label: 'Global Adjustment',
    description: 'League-wide and market adjustment factors',
    color: 'text-orange-600'
  }
]

function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : ''
  const absValue = Math.abs(value)
  const formatted = absValue % 1 === 0 ? absValue.toString() : absValue.toFixed(2).replace(/\.?0+$/, '')
  return `${sign}$${formatted}`
}

export const PriceBreakdown = React.forwardRef<HTMLButtonElement, PriceBreakdownProps>(
  ({ className, price, components, children, ...props }, ref) => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto p-1 font-semibold hover:bg-accent/50 data-[state=open]:bg-accent",
              className
            )}
            data-testid="pricebreakdown-trigger"
            {...props}
          >
            {children || formatCurrency(price)}
            <Info className="ml-1 h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-80"
          align="start"
          side="bottom"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Price Breakdown</h4>
              <p className="text-xs text-muted-foreground">
                How this player's valuation is calculated
              </p>
            </div>
            
            <div className="space-y-3">
              {componentDetails.map(({ key, label, description, color }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className={cn("h-2 w-2 rounded-full", color.replace('text-', 'bg-'))} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-4">
                      {description}
                    </p>
                  </div>
                  <div 
                    className={cn("text-sm font-mono font-semibold", color)}
                    data-testid={`pricebreakdown-${key}`}
                  >
                    {formatCurrency(components[key])}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total Price</span>
                <span 
                  className="text-sm font-mono font-bold"
                  data-testid="pricebreakdown-sum"
                >
                  {formatCurrency(price)}
                </span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)
PriceBreakdown.displayName = "PriceBreakdown"