"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [name, setName] = useState("Manager")
  const [email, setEmail] = useState("manager@example.com")
  const [league, setLeague] = useState("Primary League")
  const [scoring, setScoring] = useState("Half-PPR")
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [pushNotifs, setPushNotifs] = useState(false)

  const save = async () => {
    await new Promise((r) => setTimeout(r, 500))
    // pretend to save
  }

  return (
    <div className="min-h-screen" style={{ background: "#0E0F11", color: "#E5E7EB" }}>
      <div className="py-8">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-8">
            <h1 className="font-mono text-2xl font-bold uppercase" style={{ color: "#00FF85" }}>
              Settings
            </h1>
            <p className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
              Manage account, notifications, and league preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Account */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="rounded-[2px] border" style={{ background: "#121417", borderColor: "#2E2E2E" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm uppercase" style={{ color: "#E5E7EB" }}>
                    Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                      Name
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-[2px] border"
                      style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#E5E7EB" }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-[2px] border"
                      style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#E5E7EB" }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2px] border" style={{ background: "#121417", borderColor: "#2E2E2E" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm uppercase" style={{ color: "#E5E7EB" }}>
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm" style={{ color: "#E5E7EB" }}>
                        Email notifications
                      </div>
                      <div className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                        Proposals, roster changes, injuries
                      </div>
                    </div>
                    <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm" style={{ color: "#E5E7EB" }}>
                        Push notifications
                      </div>
                      <div className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                        Trades and waiver results
                      </div>
                    </div>
                    <Switch checked={pushNotifs} onCheckedChange={setPushNotifs} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* League preferences */}
            <div className="lg:col-span-6 space-y-6">
              <Card className="rounded-[2px] border" style={{ background: "#121417", borderColor: "#2E2E2E" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm uppercase" style={{ color: "#E5E7EB" }}>
                    League Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                      Default League
                    </Label>
                    <Input
                      value={league}
                      onChange={(e) => setLeague(e.target.value)}
                      className="rounded-[2px] border"
                      style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#E5E7EB" }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                      Scoring System
                    </Label>
                    <Input
                      value={scoring}
                      onChange={(e) => setScoring(e.target.value)}
                      className="rounded-[2px] border"
                      style={{ borderColor: "#2E2E2E", background: "#0E0F11", color: "#E5E7EB" }}
                    />
                  </div>
                  <div className="pt-2">
                    <Button onClick={save} className="font-mono" style={{ background: "#00FF85", color: "#000" }}>
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2px] border" style={{ background: "#121417", borderColor: "#2E2E2E" }}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-mono text-sm uppercase" style={{ color: "#E5E7EB" }}>
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-mono text-xs" style={{ color: "#9AA4B2" }}>
                    Permanently remove your account and data.
                  </p>
                  <Button
                    variant="outline"
                    className="font-mono bg-transparent"
                    style={{ borderColor: "#FF3B30", color: "#FF3B30", background: "transparent" }}
                    onClick={() => alert("Account deletion is not enabled in demo.")}
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={save} className="font-mono" style={{ background: "#00FF85", color: "#000" }}>
              Save All Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
