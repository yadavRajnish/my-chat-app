import { type NextRequest, NextResponse } from "next/server"
import { messageOperations, privateChatOperations, initDatabase } from "@/lib/database"
import { getSession } from "@/lib/auth"

initDatabase()

export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Await params for Next.js 15 compatibility
    const resolvedParams = await params
    const chatId = Number.parseInt(resolvedParams.chatId)
    console.log("Fetching private messages for chat:", chatId, "user:", session.user.id)

    const messages = await messageOperations.getPrivateMessages(chatId, session.user.id)
    console.log("Found private messages:", messages.length)

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching private messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Await params for Next.js 15 compatibility
    const resolvedParams = await params
    const chatId = Number.parseInt(resolvedParams.chatId)
    const { content, messageType = "text", fileInfo, receiverId } = await request.json()

    console.log("Creating private message:", {
      chatId,
      content,
      senderId: session.user.id,
      receiverId,
      messageType,
    })

    if (!content || !receiverId) {
      return NextResponse.json({ error: "Content and receiver are required" }, { status: 400 })
    }

    // Verify the chat exists and user has access
    const userChats = await privateChatOperations.getUserChats(session.user.id)
    const hasAccess = userChats.some((chat) => chat.id === chatId)

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied to this chat" }, { status: 403 })
    }

    const message = await messageOperations.createPrivateMessage(
      content,
      session.user.id,
      receiverId,
      chatId,
      messageType,
      fileInfo,
    )

    console.log("Private message created successfully:", message)
    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error creating private message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
