"use client"

import * as React from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/components/ui/button"

// We'll need to create a toast hook/function
interface ToastOptions {
  title: string
  description: string
  variant?: 'default' | 'destructive'
  duration: number
}

// Import from the useToast hook
import { toast } from '@/hooks/use-toast';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick'> {
  text: string
  successMessage?: string
  onCopy?: (text: string) => void
  children?: React.ReactNode
}

export const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ 
    className, 
    text, 
    successMessage = "Text copied to clipboard",
    onCopy,
    children,
    variant = "outline",
    size = "sm",
    ...props 
  }, ref) => {
    const [isCopying, setIsCopying] = React.useState(false)
    const [justCopied, setJustCopied] = React.useState(false)

    const handleCopy = async () => {
      if (isCopying) return
      
      setIsCopying(true)
      
      try {
        await navigator.clipboard.writeText(text)
        
        // Show success state
        setJustCopied(true)
        
        // Show toast
        toast({
          title: 'Copied!',
          description: successMessage,
          duration: 2000,
        })
        
        // Call onCopy callback
        if (onCopy) {
          onCopy(text)
        }
        
        // Reset success state after 2 seconds
        setTimeout(() => {
          setJustCopied(false)
        }, 2000)
        
      } catch (error) {
        console.error('Failed to copy text:', error)
        
        toast({
          title: 'Copy failed',
          description: 'Failed to copy text to clipboard',
          variant: 'destructive',
          duration: 3000,
        })
      } finally {
        setIsCopying(false)
      }
    }

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("inline-flex items-center gap-2", className)}
        disabled={isCopying}
        onClick={handleCopy}
        {...props}
      >
        {justCopied ? (
          <Check 
            className="h-4 w-4" 
            data-testid="check-icon"
          />
        ) : (
          <Copy 
            className="h-4 w-4" 
            data-testid="copy-icon"
          />
        )}
        {children || "Copy"}
      </Button>
    )
  }
)
CopyButton.displayName = "CopyButton"