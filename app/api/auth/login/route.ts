import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createSession } from "@/lib/auth"
import { cookies } from "next/headers"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Login attempt for:", body.email)

    const { email, password } = loginSchema.parse(body)

    const user = await createSession(email, password)

    if (!user) {
      console.log("Login failed for:", email)
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Login successful for:", email)

    // Set session cookie
    const cookieStore = cookies()
    cookieStore.set("session-token", `mock_session_${user.id}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

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
