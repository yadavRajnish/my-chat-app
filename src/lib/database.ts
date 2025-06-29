import mysql from "mysql2/promise"

// Create connection pool with cleaner configuration for free database services
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chatapp",
  waitForConnections: true,
  connectionLimit: 5, // Reduced for free tier
  queueLimit: 0,
  ssl: false,
  charset: "utf8mb4",
})

export interface Message {
  id: number
  content: string
  username: string
  userId: number
  messageType: "text" | "image" | "file"
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface User {
  id: number
  username: string
  email: string
  password: string
  isOnline: boolean
  lastSeen: string | null
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  userId: number
  username: string
  createdAt: string
  expiresAt: string
}

// Message operations (with manual timestamp handling)
export const messageOperations = {
  async getAll(): Promise<Message[]> {
    try {
      console.log("Fetching all messages...")
      const [rows] = await pool.execute(`
        SELECT 
          m.id,
          m.content,
          m.userId,
          m.messageType,
          m.isRead,
          m.createdAt,
          m.updatedAt,
          COALESCE(u.username, 'Unknown User') as username
        FROM messages m 
        LEFT JOIN users u ON m.userId = u.id 
        ORDER BY m.createdAt ASC 
        LIMIT 100
      `)
      console.log("Messages fetched successfully:", (rows as any[]).length)
      return rows as Message[]
    } catch (error) {
      console.error("Error in getAll messages:", error)
      throw error
    }
  },

  async create(content: string, userId: number, messageType = "text"): Promise<Message> {
    try {
      console.log("Creating message:", { content, userId, messageType })

      // Manual timestamp handling for strict SQL mode
      const [result] = await pool.execute(
        "INSERT INTO messages (content, userId, messageType, isRead, createdAt, updatedAt) VALUES (?, ?, ?, false, NOW(), NOW())",
        [content, userId, messageType],
      )

      const insertResult = result as mysql.ResultSetHeader
      console.log("Message inserted with ID:", insertResult.insertId)

      const [rows] = await pool.execute(
        `
        SELECT 
          m.id,
          m.content,
          m.userId,
          m.messageType,
          m.isRead,
          m.createdAt,
          m.updatedAt,
          COALESCE(u.username, 'Unknown User') as username
        FROM messages m 
        LEFT JOIN users u ON m.userId = u.id 
        WHERE m.id = ?
      `,
        [insertResult.insertId],
      )

      const message = (rows as Message[])[0]
      console.log("Created message:", message)
      return message
    } catch (error) {
      console.error("Error creating message:", error)
      throw error
    }
  },

  async markAsRead(messageId: number): Promise<void> {
    await pool.execute("UPDATE messages SET isRead = true, updatedAt = NOW() WHERE id = ?", [messageId])
  },

  async getUnreadCount(userId: number): Promise<number> {
    const [rows] = await pool.execute("SELECT COUNT(*) as count FROM messages WHERE userId != ? AND isRead = false", [
      userId,
    ])
    return (rows as any[])[0].count
  },
}

// User operations (with manual timestamp handling)
export const userOperations = {
  async getAll(): Promise<Omit<User, "password">[]> {
    const [rows] = await pool.execute(
      "SELECT id, username, email, isOnline, lastSeen, createdAt, updatedAt FROM users ORDER BY createdAt DESC",
    )
    return rows as Omit<User, "password">[]
  },

  async create(username: string, email: string, password: string): Promise<Omit<User, "password">> {
    // Manual timestamp handling for strict SQL mode
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password, isOnline, lastSeen, createdAt, updatedAt) VALUES (?, ?, ?, false, NOW(), NOW(), NOW())",
      [username, email, password],
    )

    const insertResult = result as mysql.ResultSetHeader
    const [rows] = await pool.execute(
      "SELECT id, username, email, isOnline, lastSeen, createdAt, updatedAt FROM users WHERE id = ?",
      [insertResult.insertId],
    )

    return (rows as Omit<User, "password">[])[0]
  },

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email])
    const users = rows as User[]
    return users.length > 0 ? users[0] : null
  },

  async findById(id: number): Promise<Omit<User, "password"> | null> {
    const [rows] = await pool.execute(
      "SELECT id, username, email, isOnline, lastSeen, createdAt, updatedAt FROM users WHERE id = ?",
      [id],
    )
    const users = rows as Omit<User, "password">[]
    return users.length > 0 ? users[0] : null
  },

  async updateOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await pool.execute("UPDATE users SET isOnline = ?, lastSeen = NOW(), updatedAt = NOW() WHERE id = ?", [
      isOnline,
      userId,
    ])
  },
}

// Session operations (with manual timestamp handling)
export const sessionOperations = {
  async create(userId: number, username: string): Promise<Session> {
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Manual timestamp handling for strict SQL mode
    await pool.execute("INSERT INTO sessions (id, userId, username, createdAt, expiresAt) VALUES (?, ?, ?, NOW(), ?)", [
      sessionId,
      userId,
      username,
      expiresAt,
    ])

    const [rows] = await pool.execute("SELECT * FROM sessions WHERE id = ?", [sessionId])
    return (rows as Session[])[0]
  },

  async findById(sessionId: string): Promise<Session | null> {
    try {
      const [rows] = await pool.execute("SELECT * FROM sessions WHERE id = ? AND expiresAt > NOW()", [sessionId])
      const sessions = rows as Session[]
      return sessions.length > 0 ? sessions[0] : null
    } catch (error) {
      console.error("Error finding session:", error)
      // If sessions table doesn't exist, return null instead of throwing
      if ((error as any).code === "ER_NO_SUCH_TABLE") {
        console.log("Sessions table doesn't exist, user needs to run setup script")
        return null
      }
      throw error
    }
  },

  async delete(sessionId: string): Promise<void> {
    try {
      await pool.execute("DELETE FROM sessions WHERE id = ?", [sessionId])
    } catch (error) {
      console.error("Error deleting session:", error)
      // Ignore if table doesn't exist
      if ((error as any).code !== "ER_NO_SUCH_TABLE") {
        throw error
      }
    }
  },

  async cleanup(): Promise<void> {
    try {
      await pool.execute("DELETE FROM sessions WHERE expiresAt <= NOW()")
    } catch (error) {
      console.error("Error cleaning up sessions:", error)
      // Ignore if table doesn't exist
      if ((error as any).code !== "ER_NO_SUCH_TABLE") {
        throw error
      }
    }
  },
}

// Initialize database tables and handle migrations
export const initDatabase = async () => {
  try {
    // Test connection
    await pool.execute("SELECT 1")
    console.log("✅ Database connection established successfully.")

    // Check if tables exist
    const [tables] = await pool.execute("SHOW TABLES")
    const tableNames = (tables as any[]).map((row) => Object.values(row)[0])

    console.log("Existing tables:", tableNames)

    if (tableNames.length === 0) {
      console.log("⚠️  No tables found! Please run the database setup script.")
      console.log("📋 Go to http://localhost:3000/setup to create tables automatically")
      return
    }

    // Check for required tables
    const requiredTables = ["users", "messages", "sessions"]
    const missingTables = requiredTables.filter((table) => !tableNames.includes(table))

    if (missingTables.length > 0) {
      console.log(`⚠️  Missing tables: ${missingTables.join(", ")}`)
      console.log("📋 Go to http://localhost:3000/setup to create missing tables")
      return
    }

    console.log("✅ All required tables exist.")
  } catch (error) {
    console.error("❌ Database initialization error:", error)
    throw error
  }
}

export { pool }
