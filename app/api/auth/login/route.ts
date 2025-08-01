import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createSession } from "@/lib/auth"
import { cookies } from "next/headers"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Login attempt with body:", body)

    const { email, password } = loginSchema.parse(body)
    console.log("Parsed credentials:", { email, password: "***" })

    const user = await createSession(email, password)
    console.log("Session creation result:", user ? "success" : "failed")

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set("session-token", `mock_session_${user.id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    console.log("Session cookie set for user:", user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
        scansRemaining: user.scansRemaining,
      },
    })
  } catch (error) {
    console.error("Login error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 })
  }
}
