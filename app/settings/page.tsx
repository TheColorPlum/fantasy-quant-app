"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Terminal, Save, Users, Bell, Shield, Trash2 } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [leagueId, setLeagueId] = useState("1847392")
  const [selectedTeam, setSelectedTeam] = useState("Championship Dreams")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [autoAnalysis, setAutoAnalysis] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  const teams = [
    "Championship Dreams",
    "Fantasy Legends",
    "Trade Masters",
    "Playoff Bound",
    "Dynasty Kings",
    "Waiver Wire Warriors",
    "Bench Warmers",
    "Last Place Heroes",
    "Touchdown Titans",
    "Gridiron Gurus",
    "Fantasy Phenoms",
    "Draft Day Demons",
  ]

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage("")

    // Simulate save operation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setSaveMessage("Settings saved successfully")
    setIsSaving(false)

    setTimeout(() => setSaveMessage(""), 3000)
  }

  const handleDeleteAccount = () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      // Handle account deletion
      console.log("Account deletion requested")
    }
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
                SETTINGS
              </Badge>
            </div>
            <nav className="flex items-center space-x-6">
              <Link href="/dashboard" className="font-mono text-sm text-[#94a3b8] hover:text-[#22c55e]">
                DASHBOARD
              </Link>
              <Link href="/trades" className="font-mono text-sm text-[#94a3b8] hover:text-[#22c55e]">
                TRADES
              </Link>
              <Link href="/proposals" className="font-mono text-sm text-[#94a3b8] hover:text-[#22c55e]">
                PROPOSALS
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-mono text-3xl font-bold text-[#22c55e] mb-2">SYSTEM_SETTINGS</h1>
            <p className="font-mono text-sm text-[#94a3b8]">CONFIGURE_LEAGUE_CONNECTION → MANAGE_PREFERENCES</p>
          </div>

          {saveMessage && (
            <Alert className="mb-6 bg-[#22c55e]/10 border-[#22c55e]/20">
              <AlertDescription className="text-[#22c55e] font-mono text-sm">{saveMessage}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* League Settings */}
            <div className="space-y-6">
              <Card className="bg-[#1a1a1a] border-[#2a2a2a] terminal-glow">
                <CardHeader>
                  <CardTitle className="font-mono text-xl text-[#22c55e] flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>LEAGUE_CONFIG</span>
                  </CardTitle>
                  <CardDescription className="font-mono text-sm text-[#94a3b8]">MANAGE_ESPN_CONNECTION</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="leagueId" className="font-mono text-sm text-[#cbd5e1]">
                      ESPN_LEAGUE_ID
                    </Label>
                    <Input
                      id="leagueId"
                      type="text"
                      value={leagueId}
                      onChange={(e) => setLeagueId(e.target.value)}
                      className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-[#cbd5e1]"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-mono text-sm text-[#cbd5e1]">YOUR_TEAM</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="bg-[#0f0f0f] border-[#2a2a2a] font-mono text-[#cbd5e1]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                        {teams.map((team, index) => (
                          <SelectItem key={index} value={team} className="font-mono text-[#cbd5e1]">
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                    <div className="font-mono text-xs text-[#94a3b8] mb-2">CONNECTION_STATUS:</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                      <span className="font-mono text-xs text-[#22c55e]">CONNECTED</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">LAST_SYNC:</span>
                        <span className="text-[#cbd5e1]">2MIN_AGO</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">TEAMS:</span>
                        <span className="text-[#cbd5e1]">12</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Preferences */}
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="font-mono text-xl text-[#22c55e] flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>NOTIFICATIONS</span>
                  </CardTitle>
                  <CardDescription className="font-mono text-sm text-[#94a3b8]">CONFIGURE_ALERTS</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-mono text-sm text-[#cbd5e1]">EMAIL_ALERTS</Label>
                      <p className="font-mono text-xs text-[#94a3b8]">Trade opportunities & roster moves</p>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-mono text-sm text-[#cbd5e1]">PUSH_NOTIFICATIONS</Label>
                      <p className="font-mono text-xs text-[#94a3b8]">Real-time market updates</p>
                    </div>
                    <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-mono text-sm text-[#cbd5e1]">AUTO_ANALYSIS</Label>
                      <p className="font-mono text-xs text-[#94a3b8]">Automatic trade scanning</p>
                    </div>
                    <Switch checked={autoAnalysis} onCheckedChange={setAutoAnalysis} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Management */}
            <div className="space-y-6">
              <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                <CardHeader>
                  <CardTitle className="font-mono text-xl text-[#22c55e] flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>ACCOUNT_INFO</span>
                  </CardTitle>
                  <CardDescription className="font-mono text-sm text-[#94a3b8]">PROFILE_MANAGEMENT</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-4">
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">EMAIL:</span>
                        <span className="text-[#cbd5e1]">demo@tradeup.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">PLAN:</span>
                        <Badge variant="outline" className="text-[#fbbf24] border-[#fbbf24] font-mono text-xs">
                          FREE
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">MEMBER_SINCE:</span>
                        <span className="text-[#cbd5e1]">NOV_2024</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#94a3b8]">SCANS_USED:</span>
                        <span className="text-[#cbd5e1]">2/5</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/upgrade">
                    <Button className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-bold">
                      UPGRADE_TO_PRO
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-[#1a1a1a] border-red-500/20">
                <CardHeader>
                  <CardTitle className="font-mono text-xl text-red-400 flex items-center space-x-2">
                    <Trash2 className="h-5 w-5" />
                    <span>DANGER_ZONE</span>
                  </CardTitle>
                  <CardDescription className="font-mono text-sm text-[#94a3b8]">IRREVERSIBLE_ACTIONS</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={handleDeleteAccount} className="w-full font-mono font-bold">
                    DELETE_ACCOUNT
                  </Button>
                  <p className="font-mono text-xs text-[#94a3b8] mt-2 text-center">This action cannot be undone</p>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-mono font-bold text-lg py-6"
              >
                {isSaving ? (
                  <>
                    <Save className="mr-2 h-5 w-5 animate-pulse" />
                    SAVING_CHANGES...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    SAVE_SETTINGS
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
