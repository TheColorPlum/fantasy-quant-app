"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Target, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { mockUser } from "@/lib/dummy-data"

export default function TradeGenerator() {
  const [targetPosition, setTargetPosition] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!targetPosition) return

    setIsGenerating(true)

    // Mock generation delay
    setTimeout(() => {
      setIsGenerating(false)
      router.push("/proposals")
    }, 2000)
  }

  const remainingProposals = mockUser.usageLimit - mockUser.usageCount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Generate Trade Proposals</h1>
              <p className="text-gray-600">
                Leverage data analytics to find the best roster optimization opportunities
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Trade Target</span>
            </CardTitle>
            <CardDescription>Select the position you want to improve through trades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="position">Target Position</Label>
              <Select value={targetPosition} onValueChange={setTargetPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Select position to target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="QB">Quarterback (QB)</SelectItem>
                  <SelectItem value="RB">Running Back (RB)</SelectItem>
                  <SelectItem value="WR">Wide Receiver (WR)</SelectItem>
                  <SelectItem value="TE">Tight End (TE)</SelectItem>
                  <SelectItem value="FLEX">Flex (RB/WR/TE)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                The algorithm will find teams with surplus at this position and generate fair trade proposals
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Analyzes all league rosters for positional needs</li>
                <li>• Finds teams with surplus at your target position</li>
                <li>• Calculates fair value trades using current player values</li>
                <li>• Identifies buy-low/sell-high opportunities</li>
                <li>• Generates ready-to-send trade messages</li>
              </ul>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Remaining Proposals</div>
                <div className="text-sm text-gray-600">
                  {remainingProposals} of {mockUser.usageLimit} this week
                </div>
              </div>
              {!mockUser.isPremium && remainingProposals <= 2 && (
                <Button variant="outline" size="sm">
                  Upgrade for Unlimited
                </Button>
              )}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!targetPosition || isGenerating || remainingProposals === 0}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing League & Generating Proposals...
                </>
              ) : (
                `Generate Trade Proposals for ${targetPosition || "Position"}`
              )}
            </Button>

            {remainingProposals === 0 && (
              <p className="text-sm text-red-600 text-center">
                You've used all your free proposals this week. Upgrade for unlimited access.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
