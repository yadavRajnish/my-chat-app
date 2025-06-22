import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { userOperations, initDatabase } from "@/lib/database"
import { createSession } from "@/lib/auth"

initDatabase()

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json()

    console.log({ username, email, password })

    if (!username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await userOperations.findByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Create user (in production, hash the password)
    const user = await userOperations.create(username, email, password)

    // Create session
    const sessionId = await createSession(user.id, user.username)

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    })

    // Update user online status
    await userOperations.updateOnlineStatus(user.id, true)

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
