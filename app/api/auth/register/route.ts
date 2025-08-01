import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { registerUser } from "@/lib/auth"
import { cookies } from "next/headers"

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)

    const user = await registerUser(name, email, password)

    if (!user) {
      return NextResponse.json({ success: false, error: "Email already exists" }, { status: 409 })
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
    console.error("Registration error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request data", details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 })
  }
}
