import { type NextRequest, NextResponse } from "next/server"
import { messageOperations, initDatabase } from "@/lib/database"
import { getSession } from "@/lib/auth"

initDatabase()

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      console.log("No session found for GET /api/messages")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("Fetching messages for user:", session.user.username)
    const messages = await messageOperations.getAll()
    console.log("Found messages:", messages.length)
    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      console.log("No session found for POST /api/messages")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Received message data:", body)

    const { content, userId } = body

    if (!content || !userId) {
      console.log("Missing content or userId:", { content, userId })
      return NextResponse.json({ error: "Content and userId are required" }, { status: 400 })
    }

    // Verify user can send message
    if (userId !== session.user.id) {
      console.log("User ID mismatch:", { requestUserId: userId, sessionUserId: session.user.id })
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("Creating message for user:", session.user.username)
    const message = await messageOperations.create(content.trim(), userId)
    console.log("Message created successfully:", message)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 })
  }
}
