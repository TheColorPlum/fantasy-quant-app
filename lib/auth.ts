import { cookies } from "next/headers"
import { db } from "./database"

export interface AuthUser {
  id: string
  email: string
  name: string
  isPremium: boolean
  scansRemaining: number
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies()
    const sessionToken = cookieStore.get("session-token")?.value

    if (!sessionToken) {
      return null
    }

    // Extract user ID from session token (in production, verify JWT)
    const userId = sessionToken.replace("mock_session_", "")
    const user = await db.users.findById(userId)

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isPremium: user.isPremium,
      scansRemaining: Math.max(0, user.scansLimit - user.scansUsed),
    }
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Authentication required")
  }
  return user
}

export async function createSession(email: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await db.users.findByEmail(email)

    if (!user) {
      console.log("User not found for email:", email)
      return null
    }

    // In production, use bcrypt.compare(password, user.passwordHash)
    if (password !== user.passwordHash) {
      console.log("Password mismatch for user:", email)
      return null
    }

    console.log("Authentication successful for user:", email)

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isPremium: user.isPremium,
      scansRemaining: Math.max(0, user.scansLimit - user.scansUsed),
    }
  } catch (error) {
    console.error("Session creation error:", error)
    return null
  }
}

export async function registerUser(name: string, email: string, password: string): Promise<AuthUser | null> {
  try {
    // Check if user already exists
    const existingUser = await db.users.findByEmail(email)
    if (existingUser) {
      return null
    }

    // Create new user (in production, hash password with bcrypt)
    const newUser = await db.users.create({
      name,
      email,
      passwordHash: password, // In production: await bcrypt.hash(password, 10)
      isPremium: false,
      scansLimit: 5,
      scansUsed: 0,
    })

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      isPremium: newUser.isPremium,
      scansRemaining: Math.max(0, newUser.scansLimit - newUser.scansUsed),
    }
  } catch (error) {
    console.error("Registration error:", error)
    return null
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete("session-token")
}
