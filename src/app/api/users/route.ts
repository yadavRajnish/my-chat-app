import { type NextRequest, NextResponse } from "next/server"
import { userOperations, initDatabase } from "@/lib/database"

// Initialize database connection
initDatabase()

export async function GET() {
  try {
    const users = await userOperations.getAll()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email } = body

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    const user = await userOperations.create(username.trim(), email?.trim())
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
