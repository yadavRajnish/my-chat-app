import { cookies } from "next/headers"
import { sessionOperations, userOperations } from "./database"

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session")?.value

    if (!sessionId) {
      console.log("No session cookie found")
      return null
    }

    console.log("Looking up session:", sessionId)
    const session = await sessionOperations.findById(sessionId)
    if (!session) {
      console.log("Session not found in database")
      return null
    }

    console.log("Session found, looking up user:", session.userId)
    const user = await userOperations.findById(session.userId)
    if (!user) {
      console.log("User not found for session")
      return null
    }

    console.log("Auth successful for user:", user.username)
    return {
      sessionId: session.id,
      user: user,
    }
  } catch (error) {
    console.error("Error in getSession:", error)
    return null
  }
}

export async function createSession(userId: number, username: string) {
  const session = await sessionOperations.create(userId, username)
  return session.id
}

export async function deleteSession(sessionId: string) {
  await sessionOperations.delete(sessionId)
}
