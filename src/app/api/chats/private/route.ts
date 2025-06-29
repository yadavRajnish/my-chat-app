import { type NextRequest, NextResponse } from "next/server"
import { privateChatOperations, initDatabase } from "@/lib/database"
import { getSession } from "@/lib/auth"

initDatabase()

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("Fetching private chats for user:", session.user.id)
    const chats = await privateChatOperations.getUserChats(session.user.id)
    console.log("Found chats:", chats.length)
    return NextResponse.json(chats)
  } catch (error) {
    console.error("Error fetching private chats:", error)
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { receiverId } = await request.json()
    console.log("Creating chat between users:", session.user.id, "and", receiverId)

    if (!receiverId || receiverId === session.user.id) {
      return NextResponse.json({ error: "Invalid receiver" }, { status: 400 })
    }

    const chat = await privateChatOperations.createOrGetChat(session.user.id, receiverId)
    console.log("Chat created/retrieved:", chat)

    return NextResponse.json(chat, { status: 201 })
  } catch (error) {
    console.error("Error creating private chat:", error)
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 })
  }
}
