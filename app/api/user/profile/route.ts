import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/database"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    // Minimal analytics stub - replace when implementing trade analyses
    const analytics = {
      totalAnalyses: 0,
      avgConfidence: 0,
      topPartners: []
    }
    const recentAnalyses: any[] = []

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
        scansRemaining: user.scansRemaining,
      },
      analytics: {
        totalAnalyses: analytics.totalAnalyses,
        avgConfidence: Math.round(analytics.avgConfidence),
        topPartners: analytics.topPartners,
        recentAnalyses: recentAnalyses.map((analysis) => ({
          id: analysis.id,
          partner: analysis.partner,
          confidence: analysis.confidence,
          createdAt: analysis.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error("Profile error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch profile" }, { status: 500 })
  }
}
