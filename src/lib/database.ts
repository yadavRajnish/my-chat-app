import mysql from "mysql2/promise"

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chatapp",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
  lastSeen: string
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

// Message operations
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

      // Insert message without username (it comes from JOIN)
      const [result] = await pool.execute(
        "INSERT INTO messages (content, userId, messageType, isRead, createdAt, updatedAt) VALUES (?, ?, ?, false, NOW(), NOW())",
        [content, userId, messageType],
      )

      const insertResult = result as mysql.ResultSetHeader
      console.log("Message inserted with ID:", insertResult.insertId)

      // Fetch the created message with username from JOIN
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
    await pool.execute("UPDATE messages SET isRead = true WHERE id = ?", [messageId])
  },

  async getUnreadCount(userId: number): Promise<number> {
    const [rows] = await pool.execute("SELECT COUNT(*) as count FROM messages WHERE userId != ? AND isRead = false", [
      userId,
    ])
    return (rows as any[])[0].count
  },
}

// User operations
export const userOperations = {
  async getAll(): Promise<Omit<User, "password">[]> {
    const [rows] = await pool.execute(
      "SELECT id, username, email, isOnline, lastSeen, createdAt, updatedAt FROM users ORDER BY createdAt DESC",
    )
    return rows as Omit<User, "password">[]
  },

  async create(username: string, email: string, password: string): Promise<Omit<User, "password">> {
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
    await pool.execute("UPDATE users SET isOnline = ?, lastSeen = NOW() WHERE id = ?", [isOnline, userId])
  },
}

// Session operations
export const sessionOperations = {
  async create(userId: number, username: string): Promise<Session> {
    const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

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
    const [rows] = await pool.execute("SELECT * FROM sessions WHERE id = ? AND expiresAt > NOW()", [sessionId])
    const sessions = rows as Session[]
    return sessions.length > 0 ? sessions[0] : null
  },

  async delete(sessionId: string): Promise<void> {
    await pool.execute("DELETE FROM sessions WHERE id = ?", [sessionId])
  },

  async cleanup(): Promise<void> {
    await pool.execute("DELETE FROM sessions WHERE expiresAt <= NOW()")
  },
}

// Initialize database tables and handle migrations
export const initDatabase = async () => {
  try {
    // Test connection
    await pool.execute("SELECT 1")
    console.log("Database connection established successfully.")

    // Create users table with basic structure first
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Add missing columns to users table
    const userColumnsToAdd = [
      { name: "password", definition: 'VARCHAR(255) NOT NULL DEFAULT "defaultpassword"' },
      { name: "isOnline", definition: "BOOLEAN DEFAULT false" },
      { name: "lastSeen", definition: "DATETIME DEFAULT CURRENT_TIMESTAMP" },
    ]

    for (const column of userColumnsToAdd) {
      try {
        const [columns] = await pool.execute(
          `
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'users' 
          AND COLUMN_NAME = ?
        `,
          [column.name],
        )

        if ((columns as any[]).length === 0) {
          console.log(`Adding ${column.name} column to users table...`)
          await pool.execute(`ALTER TABLE users ADD COLUMN ${column.name} ${column.definition}`)
          console.log(`${column.name} column added successfully.`)
        }
      } catch (error) {
        console.error(`Error adding ${column.name} column:`, error)
      }
    }

    // Create messages table with correct structure (no username column)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        userId INT NOT NULL DEFAULT 1,
        messageType ENUM('text', 'image', 'file') DEFAULT 'text',
        isRead BOOLEAN DEFAULT false,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Remove username column if it exists (it shouldn't be in messages table)
    try {
      const [columns] = await pool.execute(
        `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'messages' 
        AND COLUMN_NAME = 'username'
      `,
      )

      if ((columns as any[]).length > 0) {
        console.log("Removing username column from messages table...")
        await pool.execute("ALTER TABLE messages DROP COLUMN username")
        console.log("Username column removed successfully.")
      }
    } catch (error) {
      console.error("Error removing username column:", error)
    }

    // Create sessions table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        userId INT NOT NULL,
        username VARCHAR(50) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        expiresAt DATETIME NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    console.log("Database tables created/updated successfully.")
  } catch (error) {
    console.error("Unable to connect to the database:", error)
  }
}

export { pool }
