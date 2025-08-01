"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Copy, MessageSquare, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { mockTradeProposals } from "@/lib/dummy-data"

export default function ProposalsPage() {
  const [filter, setFilter] = useState("all")
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null)
  const router = useRouter()

  const filteredProposals = mockTradeProposals.filter((proposal) => {
    if (filter === "all") return true
    return proposal.tradeType === filter
  })

  const getTradeTypeColor = (type: string) => {
    switch (type) {
      case "Buy Low/Sell High":
        return "bg-green-100 text-green-800"
      case "Underpriced":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const generateMessage = (proposal: any) => {
    const userGivesNames = proposal.userGives.map((p: any) => p.name).join(" + ")
    const userGetsNames = proposal.userGets.map((p: any) => p.name).join(" + ")

    return `Hey ${proposal.tradePartner}!

I noticed you could use some help at ${proposal.userGives[0].position} and I'm looking to upgrade my ${proposal.userGets[0].position} position. 

Want to swap my ${userGivesNames} for your ${userGetsNames}? 

${proposal.reasoning}

Let me know if you're interested!`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trade Proposals</h1>
                <p className="text-gray-600">{filteredProposals.length} proposals found</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Proposals</SelectItem>
                  <SelectItem value="Fair Value">Fair Value</SelectItem>
                  <SelectItem value="Buy Low/Sell High">Buy Low/Sell High</SelectItem>
                  <SelectItem value="Underpriced">Underpriced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {filteredProposals.map((proposal) => (
            <Card key={proposal.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    <span>Trade with {proposal.tradePartner}</span>
                    <Badge className={getTradeTypeColor(proposal.tradeType)}>{proposal.tradeType}</Badge>
                  </CardTitle>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Trade Score</div>
                    <div className="text-2xl font-bold text-green-600">{proposal.score}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trade Details */}
                <div className="grid md:grid-cols-3 gap-6 items-center">
                  {/* You Give */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-red-600">You Give</h4>
                    {proposal.userGives.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-gray-600">
                            {player.position} • {player.team}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{player.value}</div>
                          <div className="flex items-center space-x-1">
                            {player.trend === "up" ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : player.trend === "down" ? (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            ) : null}
                            <span className={`text-xs ${player.weeklyChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {player.weeklyChange >= 0 ? "+" : ""}
                              {player.weeklyChange}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className="h-8 w-8 text-gray-400" />
                  </div>

                  {/* You Get */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-600">You Get</h4>
                    {proposal.userGets.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-gray-600">
                            {player.position} • {player.team}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{player.value}</div>
                          <div className="flex items-center space-x-1">
                            {player.trend === "up" ? (
                              <TrendingUp className="h-3 w-3 text-green-500" />
                            ) : player.trend === "down" ? (
                              <TrendingDown className="h-3 w-3 text-red-500" />
                            ) : null}
                            <span className={`text-xs ${player.weeklyChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                              {player.weeklyChange >= 0 ? "+" : ""}
                              {player.weeklyChange}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Value Analysis */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold mb-2">Value Analysis</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>You Give Total:</span>
                          <span>{proposal.userGives.reduce((sum, p) => sum + p.value, 0).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>You Get Total:</span>
                          <span>{proposal.userGets.reduce((sum, p) => sum + p.value, 0).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-1">
                          <span>Net Value:</span>
                          <span className={proposal.valueDifferential >= 0 ? "text-green-600" : "text-red-600"}>
                            {proposal.valueDifferential >= 0 ? "+" : ""}
                            {proposal.valueDifferential}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-semibold mb-2">Trade Reasoning</h5>
                      <p className="text-sm text-gray-700">{proposal.reasoning}</p>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Ready-to-Send Message</span>
                    </h5>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(generateMessage(proposal))}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Message
                    </Button>
                  </div>
                  <Textarea value={generateMessage(proposal)} readOnly className="min-h-32 bg-gray-50" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProposals.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 mb-4">No trade proposals found for the selected filter.</p>
              <Button onClick={() => setFilter("all")}>Show All Proposals</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
