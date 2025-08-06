"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, ExternalLink } from 'lucide-react'

interface DonateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DonateModal({ open, onOpenChange }: DonateModalProps) {
  const handleVenmoClick = () => {
    // In a real app, this would open Venmo with the donation link
    window.open("https://venmo.com/tradeup-donations", "_blank")
  }

  const handlePayPalClick = () => {
    // In a real app, this would open PayPal with the donation link
    window.open("https://paypal.me/tradeupdonations", "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-[#22c55e] flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>SUPPORT_TRADEUP</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="bg-[#0f0f0f] border-[#2a2a2a]">
            <CardContent className="pt-6">
              <p className="font-mono text-sm text-[#cbd5e1] text-center leading-relaxed">
                TradeUp is completely free, but donations help with maintenance and improvements.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              onClick={handleVenmoClick}
              className="w-full bg-[#3d95ce] hover:bg-[#2d7bb8] text-white font-mono font-semibold py-3"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              DONATE_VIA_VENMO
            </Button>

            <Button
              onClick={handlePayPalClick}
              className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-mono font-semibold py-3"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              DONATE_VIA_PAYPAL
            </Button>
          </div>

          <div className="text-center">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="font-mono text-xs border-[#2a2a2a] text-[#94a3b8] hover:bg-[#2a2a2a] bg-transparent"
            >
              CLOSE
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
