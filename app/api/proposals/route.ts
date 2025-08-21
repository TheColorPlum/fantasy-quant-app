import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { give, get, partnerTeamId, message, status = "sent" } = body

    // Validate required fields
    if (!give || !get || give.length === 0 || get.length === 0) {
      return NextResponse.json({ error: "Trade must include players to give and get" }, { status: 400 })
    }

    if (!partnerTeamId) {
      return NextResponse.json({ error: "Partner team is required" }, { status: 400 })
    }

    // Mock proposal creation - in real app would save to database
    const proposal = {
      id: `prop_${Date.now()}`,
      give,
      get,
      partnerTeamId,
      message: message || "",
      status,
      createdAt: new Date().toISOString(),
      userId: "current_user", // Would come from auth
    }

    // For now, just return success - in real app would persist to database
    return NextResponse.json({
      success: true,
      proposal,
    })
  } catch (error) {
    console.error("Error creating proposal:", error)
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 })
  }
}
