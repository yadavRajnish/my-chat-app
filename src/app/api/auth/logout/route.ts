import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { userOperations } from "@/lib/database"
import { deleteSession, getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()

    if (session) {
      // Update user offline status
      await userOperations.updateOnlineStatus(session.user.id, false)

      // Delete session
      await deleteSession(session.sessionId)
    }

    // Clear session cookie
    const cookieStore = await cookies()
    cookieStore.delete("session")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
