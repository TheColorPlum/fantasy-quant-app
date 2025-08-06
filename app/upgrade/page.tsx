"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Terminal, Check, Zap, TrendingUp, Shield, Users, Clock, Star } from "lucide-react"
import Link from "next/link"

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "elite">("pro")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpgrade = async (plan: "pro" | "elite") => {
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log(`Upgrading to ${plan} plan`)
    setIsProcessing(false)
  }

  const features = {
    free: ["5 trade scans per week", "Basic trade proposals", "League integration", "Email support"],
    pro: [
      "Unlimited trade scans",
      "Advanced AI analysis",
      "Real-time notifications",
      "Priority support",
      "Custom trade messages",
      "Performance tracking",
    ],
    elite: [
      "Everything in Pro",
      "Multi-league management",
      "Advanced analytics dashboard",
      "Trade success predictions",
      "Custom algorithms",
      "1-on-1 strategy sessions",
      "API access",
    ],
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-[#2a2a2a] bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="h-6 w-6 text-[#22c55e]" />
              <span className="text-xl font-bold font-mono">TRADEUP</span>
              <Badge variant="outline" className="text-[#22c55e] border-[#22c55e] font-mono text-xs">
                UPGRADE
              </Badge>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="/dashboard" className="font-mono text-sm text-[#94a3b8] hover:text-[#22c55e]">
                DASHBOARD
              </Link>
              <Link href="/settings" className="font-mono text-sm text-[#94a3b8] hover:text-[#22c55e]">
                SETTINGS
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="font-mono text-4xl font-bold text-[#22c55e] mb-4">UPGRADE_TERMINAL</h1>
            <p className="font-mono text-lg text-[#94a3b8] mb-2">UNLOCK_PROFESSIONAL_TRADING_CAPABILITIES</p>
            <p className="font-mono text-sm text-[#94a3b8]">JOIN_THOUSANDS_OF_FANTASY_TRADERS → MAXIMIZE_YOUR_EDGE</p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Free Plan */}
            <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
              <CardHeader className="text-center">
                <CardTitle className="font-mono text-xl text-[#cbd5e1]">FREE</CardTitle>
                <CardDescription className="font-mono text-sm text-[#94a3b8]">BASIC_TRADING_TOOLS</CardDescription>
                <div className="py-4">
                  <span className="font-mono text-3xl font-bold text-[#cbd5e1]">$0</span>
                  <span className="font-mono text-sm text-[#94a3b8]">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {features.free.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-[#22c55e]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button disabled className="w-full font-mono bg-[#2a2a2a] text-[#94a3b8]">
                  CURRENT_PLAN
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card
              className={`bg-[#1a1a1a] border-2 ${selectedPlan === "pro" ? "border-[#22c55e]" : "border-[#2a2a2a]"} terminal-glow relative`}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-[#22c55e] text-black font-mono text-xs">MOST_POPULAR</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="font-mono text-xl text-[#22c55e]">PRO</CardTitle>
                <CardDescription className="font-mono text-sm text-[#94a3b8]">ADVANCED_ANALYTICS</CardDescription>
                <div className="py-4">
                  <span className="font-mono text-3xl font-bold text-[#22c55e]">$19</span>
                  <span className="font-mono text-sm text-[#94a3b8]">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {features.pro.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-[#22c55e]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade("pro")}
                  disabled={isProcessing}
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-bold"
                >
                  {isProcessing ? "PROCESSING..." : "UPGRADE_TO_PRO"}
                </Button>
              </CardContent>
            </Card>

            {/* Elite Plan */}
            <Card
              className={`bg-[#1a1a1a] border-2 ${selectedPlan === "elite" ? "border-[#fbbf24]" : "border-[#2a2a2a]"} relative`}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-[#fbbf24] text-black font-mono text-xs">PREMIUM</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="font-mono text-xl text-[#fbbf24]">ELITE</CardTitle>
                <CardDescription className="font-mono text-sm text-[#94a3b8]">INSTITUTIONAL_GRADE</CardDescription>
                <div className="py-4">
                  <span className="font-mono text-3xl font-bold text-[#fbbf24]">$49</span>
                  <span className="font-mono text-sm text-[#94a3b8]">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {features.elite.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-[#fbbf24]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleUpgrade("elite")}
                  disabled={isProcessing}
                  className="w-full bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-mono font-bold"
                >
                  {isProcessing ? "PROCESSING..." : "UPGRADE_TO_ELITE"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison */}
          <Card className="bg-[#1a1a1a] border-[#2a2a2a] mb-8">
            <CardHeader>
              <CardTitle className="font-mono text-2xl text-[#22c55e] text-center">FEATURE_COMPARISON</CardTitle>
              <CardDescription className="font-mono text-sm text-[#94a3b8] text-center">
                DETAILED_BREAKDOWN_OF_CAPABILITIES
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="space-y-4">
                  <h3 className="font-mono text-lg font-bold text-[#cbd5e1]">CORE_FEATURES</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-[#22c55e]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">AI Trade Analysis</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-[#22c55e]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">Market Insights</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-[#22c55e]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">League Integration</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-mono text-lg font-bold text-[#cbd5e1]">PRO_FEATURES</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-[#22c55e]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">Real-time Updates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-[#22c55e]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">Priority Support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-[#22c55e]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">Custom Messages</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-mono text-lg font-bold text-[#fbbf24]">ELITE_FEATURES</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-[#fbbf24]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">Multi-league</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-[#fbbf24]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">Success Predictions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Terminal className="h-4 w-4 text-[#fbbf24]" />
                      <span className="font-mono text-sm text-[#cbd5e1]">API Access</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-mono text-lg font-bold text-[#cbd5e1]">SUPPORT</h3>
                  <div className="space-y-3">
                    <div className="font-mono text-sm text-[#94a3b8]">Free: Email</div>
                    <div className="font-mono text-sm text-[#22c55e]">Pro: Priority</div>
                    <div className="font-mono text-sm text-[#fbbf24]">Elite: 1-on-1</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <div className="text-center">
            <p className="font-mono text-sm text-[#94a3b8] mb-4">QUESTIONS? → CONTACT_SUPPORT@TRADEUP.COM</p>
            <p className="font-mono text-xs text-[#94a3b8]">30_DAY_MONEY_BACK_GUARANTEE → CANCEL_ANYTIME</p>
          </div>
        </div>
      </div>
    </div>
  )
}
