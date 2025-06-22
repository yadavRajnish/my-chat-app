import { NextResponse } from "next/server"
import { userOperations, initDatabase } from "@/lib/database"
import { getSession } from "@/lib/auth"

initDatabase()

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const users = await userOperations.getAll()
    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
