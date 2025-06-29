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
  messageType: "text" | "image" | "file" | "gif"
  isRead: boolean
  createdAt: string
  updatedAt: string
  chatType?: "public" | "private"
  privateChatId?: number
  receiverId?: number
  fileInfo?: {
    fileName: string
    filePath: string
    fileSize: number
    fileType: string
    uploadedBy: string
    uploadedAt: string
    gifUrl?: string
    gifTitle?: string
  }
}

export interface User {
  id: number
  username: string
  email: string
  password: string
  avatar?: string
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

export interface PrivateChat {
  id: number
  user1Id: number
  user2Id: number
  createdAt: string
  updatedAt: string
}

// Message operations (with manual timestamp handling)
export const messageOperations = {
  async getAll(): Promise<Message[]> {
    try {
      console.log("Fetching all public messages...")
      const [rows] = await pool.execute(`
        SELECT 
          m.id,
          m.content,
          m.userId,
          m.messageType,
          m.isRead,
          m.createdAt,
          m.updatedAt,
          m.fileInfo,
          COALESCE(u.username, 'Unknown User') as username
        FROM messages m 
        LEFT JOIN users u ON m.userId = u.id 
        WHERE m.chat_type = 'public' OR m.chat_type IS NULL
        ORDER BY m.createdAt ASC 
        LIMIT 100
      `)

      const messages = (rows as any[]).map((row) => ({
        ...row,
        fileInfo: row.fileInfo ? JSON.parse(row.fileInfo) : null,
      }))

      console.log("Public messages fetched successfully:", messages.length)
      return messages as Message[]
    } catch (error) {
      console.error("Error in getAll messages:", error)
      throw error
    }
  },

  async getPrivateMessages(chatId: number, userId: number): Promise<Message[]> {
    try {
      const [rows] = await pool.execute(
        `
        SELECT 
          m.id,
          m.content,
          m.userId,
          m.receiverId,
          m.messageType,
          m.isRead,
          m.createdAt,
          m.updatedAt,
          m.fileInfo,
          COALESCE(u.username, 'Unknown User') as username
        FROM messages m 
        LEFT JOIN users u ON m.userId = u.id 
        WHERE m.private_chat_id = ? AND (m.userId = ? OR m.receiverId = ?)
        ORDER BY m.createdAt ASC 
        LIMIT 100
      `,
        [chatId, userId, userId],
      )

      const messages = (rows as any[]).map((row) => ({
        ...row,
        fileInfo: row.fileInfo ? JSON.parse(row.fileInfo) : null,
      }))

      return messages as Message[]
    } catch (error) {
      console.error("Error fetching private messages:", error)
      throw error
    }
  },

  async create(content: string, userId: number, messageType = "text", fileInfo?: any): Promise<Message> {
    try {
      console.log("Creating public message:", { content, userId, messageType, fileInfo })

      const [result] = await pool.execute(
        "INSERT INTO messages (content, userId, messageType, isRead, fileInfo, chat_type, createdAt, updatedAt) VALUES (?, ?, ?, false, ?, 'public', NOW(), NOW())",
        [content, userId, messageType, fileInfo ? JSON.stringify(fileInfo) : null],
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
          m.fileInfo,
          COALESCE(u.username, 'Unknown User') as username
        FROM messages m 
        LEFT JOIN users u ON m.userId = u.id 
        WHERE m.id = ?
      `,
        [insertResult.insertId],
      )

      const message = (rows as any[])[0]
      if (message.fileInfo) {
        message.fileInfo = JSON.parse(message.fileInfo)
      }

      console.log("Created message:", message)
      return message as Message
    } catch (error) {
      console.error("Error creating message:", error)
      throw error
    }
  },

  async createPrivateMessage(
    content: string,
    userId: number,
    receiverId: number,
    chatId: number,
    messageType = "text",
    fileInfo?: any,
  ): Promise<Message> {
    try {
      const [result] = await pool.execute(
        "INSERT INTO messages (content, userId, receiverId, messageType, isRead, fileInfo, chat_type, private_chat_id, createdAt, updatedAt) VALUES (?, ?, ?, ?, false, ?, 'private', ?, NOW(), NOW())",
        [content, userId, receiverId, messageType, fileInfo ? JSON.stringify(fileInfo) : null, chatId],
      )

      const insertResult = result as mysql.ResultSetHeader

      const [rows] = await pool.execute(
        `
        SELECT 
          m.id,
          m.content,
          m.userId,
          m.receiverId,
          m.messageType,
          m.isRead,
          m.createdAt,
          m.updatedAt,
          m.fileInfo,
          COALESCE(u.username, 'Unknown User') as username
        FROM messages m 
        LEFT JOIN users u ON m.userId = u.id 
        WHERE m.id = ?
      `,
        [insertResult.insertId],
      )

      const message = (rows as any[])[0]
      if (message.fileInfo) {
        message.fileInfo = JSON.parse(message.fileInfo)
      }

      return message as Message
    } catch (error) {
      console.error("Error creating private message:", error)
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

// Private Chat operations
export const privateChatOperations = {
  async createOrGetChat(user1Id: number, user2Id: number): Promise<any> {
    try {
      // Check if chat already exists
      const [existing] = await pool.execute(
        "SELECT * FROM private_chats WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)",
        [user1Id, user2Id, user2Id, user1Id],
      )

      if ((existing as any[]).length > 0) {
        const chat = (existing as any[])[0]
        // Get other user info
        const otherUserId = chat.user1_id === user1Id ? chat.user2_id : chat.user1_id
        const [userRows] = await pool.execute(
          "SELECT id, username, email, avatar, isOnline, lastSeen FROM users WHERE id = ?",
          [otherUserId],
        )
        const otherUser = (userRows as any[])[0]

        return {
          id: chat.id,
          otherUser,
          unreadCount: 0,
        }
      }

      // Create new chat
      const [result] = await pool.execute(
        "INSERT INTO private_chats (user1_id, user2_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
        [Math.min(user1Id, user2Id), Math.max(user1Id, user2Id)],
      )

      const insertResult = result as mysql.ResultSetHeader

      // Get other user info
      const [userRows] = await pool.execute(
        "SELECT id, username, email, avatar, isOnline, lastSeen FROM users WHERE id = ?",
        [user2Id],
      )
      const otherUser = (userRows as any[])[0]

      return {
        id: insertResult.insertId,
        otherUser,
        unreadCount: 0,
      }
    } catch (error) {
      console.error("Error creating/getting chat:", error)
      throw error
    }
  },

  async getUserChats(userId: number): Promise<any[]> {
    try {
      const [rows] = await pool.execute(
        `
        SELECT 
          pc.*,
          u.id as other_user_id,
          u.username as other_username,
          u.email as other_email,
          u.avatar as other_avatar,
          u.isOnline as other_online,
          u.lastSeen as other_last_seen
        FROM private_chats pc
        LEFT JOIN users u ON (
          CASE 
            WHEN pc.user1_id = ? THEN pc.user2_id 
            ELSE pc.user1_id 
          END = u.id
        )
        WHERE pc.user1_id = ? OR pc.user2_id = ?
        ORDER BY pc.updated_at DESC
      `,
        [userId, userId, userId],
      )

      return (rows as any[]).map((row) => ({
        id: row.id,
        otherUser: {
          id: row.other_user_id,
          username: row.other_username,
          email: row.other_email,
          avatar: row.other_avatar,
          isOnline: row.other_online,
          lastSeen: row.other_last_seen,
        },
        unreadCount: 0, // TODO: Calculate actual unread count
      }))
    } catch (error) {
      console.error("Error fetching user chats:", error)
      throw error
    }
  },
}

// User operations (with manual timestamp handling)
export const userOperations = {
  async getAll(): Promise<Omit<User, "password">[]> {
    try {
      // Try to select with avatar column, fallback if it doesn't exist
      const [rows] = await pool.execute(
        "SELECT id, username, email, avatar, isOnline, lastSeen, createdAt, updatedAt FROM users ORDER BY createdAt DESC",
      )
      return rows as Omit<User, "password">[]
    } catch (avatarError) {
      // If avatar column doesn't exist, select without it
      console.log("Avatar column not found, selecting without it")
      const [rows] = await pool.execute(
        "SELECT id, username, email, isOnline, lastSeen, createdAt, updatedAt FROM users ORDER BY createdAt DESC",
      )
      return rows as Omit<User, "password">[]
    }
  },

  async create(username: string, email: string, password: string): Promise<Omit<User, "password">> {
    try {
      // Manual timestamp handling for strict SQL mode
      const [result] = await pool.execute(
        "INSERT INTO users (username, email, password, isOnline, lastSeen, createdAt, updatedAt) VALUES (?, ?, ?, false, NOW(), NOW(), NOW())",
        [username, email, password],
      )

      const insertResult = result as mysql.ResultSetHeader

      // Try to select with avatar column, fallback if it doesn't exist
      try {
        const [rows] = await pool.execute(
          "SELECT id, username, email, avatar, isOnline, lastSeen, createdAt, updatedAt FROM users WHERE id = ?",
          [insertResult.insertId],
        )
        return (rows as Omit<User, "password">[])[0]
      } catch (avatarError) {
        // If avatar column doesn't exist, select without it
        console.log("Avatar column not found, selecting without it")
        const [rows] = await pool.execute(
          "SELECT id, username, email, isOnline, lastSeen, createdAt, updatedAt FROM users WHERE id = ?",
          [insertResult.insertId],
        )
        return (rows as Omit<User, "password">[])[0]
      }
    } catch (error) {
      console.error("Error creating user:", error)
      throw error
    }
  },

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email])
    const users = rows as User[]
    return users.length > 0 ? users[0] : null
  },

  async findById(id: number): Promise<Omit<User, "password"> | null> {
    try {
      // Try to select with avatar column, fallback if it doesn't exist
      const [rows] = await pool.execute(
        "SELECT id, username, email, avatar, isOnline, lastSeen, createdAt, updatedAt FROM users WHERE id = ?",
        [id],
      )
      const users = rows as Omit<User, "password">[]
      return users.length > 0 ? users[0] : null
    } catch (avatarError) {
      // If avatar column doesn't exist, select without it
      console.log("Avatar column not found, selecting without it")
      const [rows] = await pool.execute(
        "SELECT id, username, email, isOnline, lastSeen, createdAt, updatedAt FROM users WHERE id = ?",
        [id],
      )
      const users = rows as Omit<User, "password">[]
      return users.length > 0 ? users[0] : null
    }
  },

  async updateOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await pool.execute("UPDATE users SET isOnline = ?, lastSeen = NOW(), updatedAt = NOW() WHERE id = ?", [
      isOnline,
      userId,
    ])
  },

  async updateAvatar(userId: number, avatarUrl: string): Promise<void> {
    await pool.execute("UPDATE users SET avatar = ?, updatedAt = NOW() WHERE id = ?", [avatarUrl, userId])
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
    const requiredTables = ["users", "messages", "sessions", "private_chats"]
    const missingTables = requiredTables.filter((table) => !tableNames.includes(table))

    if (missingTables.length > 0) {
      console.log(`⚠️  Missing tables: ${missingTables.join(", ")}`)
      console.log("📋 Go to http://localhost:3000/setup to create missing tables")
      return
    }

    console.log("✅ All required tables exist.")

    // Check and add missing columns
    try {
      // Add fileInfo column if missing
      const [fileInfoColumns] = await pool.execute("SHOW COLUMNS FROM messages LIKE 'fileInfo'")
      if ((fileInfoColumns as any[]).length === 0) {
        console.log("Adding fileInfo column to messages table...")
        await pool.execute("ALTER TABLE messages ADD COLUMN fileInfo TEXT NULL")
        console.log("✅ fileInfo column added successfully")
      }

      // Add avatar column if missing
      const [avatarColumns] = await pool.execute("SHOW COLUMNS FROM users LIKE 'avatar'")
      if ((avatarColumns as any[]).length === 0) {
        console.log("Adding avatar column to users table...")
        await pool.execute("ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL")
        console.log("✅ avatar column added successfully")
      }

      // Add chat_type column if missing
      const [chatTypeColumns] = await pool.execute("SHOW COLUMNS FROM messages LIKE 'chat_type'")
      if ((chatTypeColumns as any[]).length === 0) {
        console.log("Adding chat_type column to messages table...")
        await pool.execute("ALTER TABLE messages ADD COLUMN chat_type ENUM('public', 'private') DEFAULT 'public'")
        console.log("✅ chat_type column added successfully")
      }

      // Add private_chat_id column if missing
      const [privateChatColumns] = await pool.execute("SHOW COLUMNS FROM messages LIKE 'private_chat_id'")
      if ((privateChatColumns as any[]).length === 0) {
        console.log("Adding private_chat_id column to messages table...")
        await pool.execute("ALTER TABLE messages ADD COLUMN private_chat_id INT NULL")
        console.log("✅ private_chat_id column added successfully")
      }

      // Add receiver_id column if missing
      const [receiverColumns] = await pool.execute("SHOW COLUMNS FROM messages LIKE 'receiver_id'")
      if ((receiverColumns as any[]).length === 0) {
        console.log("Adding receiver_id column to messages table...")
        await pool.execute("ALTER TABLE messages ADD COLUMN receiver_id INT NULL")
        console.log("✅ receiver_id column added successfully")
      }
    } catch (error) {
      console.log("⚠️ Could not add some columns:", (error as any).message)
    }
  } catch (error) {
    console.error("❌ Database initialization error:", error)
    throw error
  }
}

export { pool }
