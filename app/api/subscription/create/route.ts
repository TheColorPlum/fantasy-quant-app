import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const createSubscriptionSchema = z.object({
  priceId: z.string().min(1),
  userId: z.string().min(1),
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { priceId, userId, email } = createSubscriptionSchema.parse(body)

    // For now, we'll just return a mock response since we're hiding monetization
    // In a real implementation, this would create a Stripe checkout session

    console.log("Subscription creation requested:", { priceId, userId, email })

    // Mock successful subscription creation
    const mockSubscription = {
      id: `sub_${Date.now()}`,
      customerId: `cus_${userId}`,
      status: "active",
      priceId,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      cancelAtPeriodEnd: false,
    }

    return NextResponse.json({
      success: true,
      subscription: mockSubscription,
      message: "Premium features unlocked! (Mock response - monetization disabled)",
    })
  } catch (error) {
    console.error("Subscription creation error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid subscription data", details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Failed to create subscription" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 })
  }

  // Mock subscription status check
  // For development, we'll return that user has premium access
  const mockSubscription = {
    id: `sub_${userId}`,
    status: "active",
    isPremium: true, // Always premium for development
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
  }

  return NextResponse.json({
    success: true,
    subscription: mockSubscription,
  })
}
