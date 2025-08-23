"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface SyncChipProps extends React.HTMLAttributes<HTMLButtonElement> {
  leagueId: string
  lastSyncedAt: Date | null
  onSync?: (result: any) => void
}

export const SyncChip = React.forwardRef<HTMLButtonElement, SyncChipProps>(
  ({ className, leagueId, lastSyncedAt, onSync, ...props }, ref) => {
    const [isLoading, setIsLoading] = React.useState(false)

    // Format the time since last sync
    const getTimeSinceSync = (syncedAt: Date | null): string => {
      if (!syncedAt) return "Never synced"
      
      const now = new Date()
      const diffMs = now.getTime() - syncedAt.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMinutes / 60)
      
      if (diffHours >= 1) {
        return `Synced ${diffHours}h ago`
      } else {
        return `Synced ${diffMinutes}m ago`
      }
    }

    const handleSync = async () => {
      setIsLoading(true)
      
      try {
        const response = await fetch(`/api/leagues/${leagueId}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        const result = await response.json()
        
        if (onSync) {
          onSync(result)
        }
      } catch (error) {
        console.error('Failed to sync league:', error)
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <Button
        ref={ref}
        variant="outline"
        size="sm"
        className={cn(
          "inline-flex items-center gap-2 text-xs h-7 px-2 text-muted-foreground hover:text-foreground",
          className
        )}
        disabled={isLoading}
        onClick={handleSync}
        {...props}
      >
        <RefreshCw 
          className={cn(
            "h-3 w-3",
            isLoading && "animate-spin"
          )} 
        />
        {isLoading ? "Syncing..." : getTimeSinceSync(lastSyncedAt)}
      </Button>
    )
  }
)
SyncChip.displayName = "SyncChip"