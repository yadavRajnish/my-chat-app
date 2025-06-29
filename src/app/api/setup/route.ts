import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function POST() {
  try {
    console.log("🔧 Setting up database tables with enhanced chat features (ultra-compatible mode)...")

    // Create users table (absolutely NO CURRENT_TIMESTAMP defaults)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) NULL,
        isOnline BOOLEAN DEFAULT false,
        lastSeen DATETIME NULL,
        createdAt DATETIME NULL,
        updatedAt DATETIME NULL
      )
    `)

    console.log("✅ Users table created")

    // Add avatar column if it doesn't exist (compatible way)
    try {
      await pool.execute(`ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL`)
      console.log("✅ Avatar column added to users table")
    } catch (error) {
      console.log("⚠️ Avatar column may already exist:", (error as any).message)
    }

    // Create messages table (absolutely NO CURRENT_TIMESTAMP defaults)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        userId INT NOT NULL,
        messageType ENUM('text', 'image', 'file', 'gif') DEFAULT 'text',
        isRead BOOLEAN DEFAULT false,
        chat_type ENUM('public', 'private') DEFAULT 'public',
        private_chat_id INT NULL,
        receiver_id INT NULL,
        fileInfo TEXT NULL,
        createdAt DATETIME NULL,
        updatedAt DATETIME NULL
      )
    `)

    console.log("✅ Messages table created")

    // Add new columns to messages table if they don't exist (compatible way)
    try {
      await pool.execute(`ALTER TABLE messages ADD COLUMN chat_type ENUM('public', 'private') DEFAULT 'public'`)
      console.log("✅ chat_type column added")
    } catch (error) {
      console.log("⚠️ chat_type column may already exist:", (error as any).message)
    }

    try {
      await pool.execute(`ALTER TABLE messages ADD COLUMN private_chat_id INT NULL`)
      console.log("✅ private_chat_id column added")
    } catch (error) {
      console.log("⚠️ private_chat_id column may already exist:", (error as any).message)
    }

    try {
      await pool.execute(`ALTER TABLE messages ADD COLUMN receiver_id INT NULL`)
      console.log("✅ receiver_id column added")
    } catch (error) {
      console.log("⚠️ receiver_id column may already exist:", (error as any).message)
    }

    try {
      await pool.execute(`ALTER TABLE messages ADD COLUMN fileInfo TEXT NULL`)
      console.log("✅ fileInfo column added")
    } catch (error) {
      console.log("⚠️ fileInfo column may already exist:", (error as any).message)
    }

    // Create sessions table (absolutely NO CURRENT_TIMESTAMP defaults)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        userId INT NOT NULL,
        username VARCHAR(50) NOT NULL,
        createdAt DATETIME NULL,
        expiresAt DATETIME NOT NULL
      )
    `)

    console.log("✅ Sessions table created")

    // Create private_chats table (simplified for compatibility)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS private_chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user1_id INT NOT NULL,
        user2_id INT NOT NULL,
        created_at DATETIME NULL,
        updated_at DATETIME NULL
      )
    `)

    console.log("✅ Private chats table created")

    // Add unique constraint separately (more compatible)
    try {
      await pool.execute(`
        ALTER TABLE private_chats 
        ADD UNIQUE KEY unique_chat_users (user1_id, user2_id)
      `)
      console.log("✅ Unique constraint added to private_chats")
    } catch (error) {
      console.log("⚠️ Unique constraint may already exist:", (error as any).message)
    }

    // Add indexes separately (safer for compatibility)
    const indexes = [
      { table: "users", column: "email", name: "idx_users_email" },
      { table: "users", column: "username", name: "idx_users_username" },
      { table: "messages", column: "userId", name: "idx_messages_userId" },
      { table: "messages", column: "createdAt", name: "idx_messages_createdAt" },
      { table: "messages", column: "chat_type", name: "idx_messages_chat_type" },
      { table: "messages", column: "private_chat_id", name: "idx_messages_private_chat" },
      { table: "sessions", column: "userId", name: "idx_sessions_userId" },
      { table: "sessions", column: "expiresAt", name: "idx_sessions_expiresAt" },
      { table: "private_chats", column: "user1_id", name: "idx_private_chats_user1" },
      { table: "private_chats", column: "user2_id", name: "idx_private_chats_user2" },
    ]

    for (const index of indexes) {
      try {
        await pool.execute(`CREATE INDEX ${index.name} ON ${index.table}(${index.column})`)
        console.log(`✅ Index ${index.name} created`)
      } catch (error) {
        console.log(`⚠️ Index ${index.name} may already exist:`, (error as any).message)
      }
    }

    // Insert sample users with explicit timestamps
    await pool.execute(`
      INSERT IGNORE INTO users (username, email, password, isOnline, lastSeen, createdAt, updatedAt) VALUES 
      ('admin', 'admin@example.com', 'admin123', false, NOW(), NOW(), NOW()),
      ('demo_user', 'demo@example.com', 'demo123', false, NOW(), NOW(), NOW()),
      ('alice', 'alice@example.com', 'password123', false, NOW(), NOW(), NOW()),
      ('bob', 'bob@example.com', 'password123', false, NOW(), NOW(), NOW())
    `)

    console.log("✅ Sample users created")

    // Insert welcome messages with explicit timestamps
    await pool.execute(`
      INSERT IGNORE INTO messages (content, userId, messageType, chat_type, createdAt, updatedAt) VALUES 
      ('🎉 Welcome to the Enhanced Chat App! Now with private messaging, emojis, GIFs, and file sharing!', 1, 'text', 'public', NOW(), NOW()),
      ('👋 Hello! Try the new features: 😊 emojis, 🎬 GIFs, 📎 file uploads, and 💬 private messages!', 2, 'text', 'public', NOW(), NOW()),
      ('🚀 Upload your avatar in settings and start chatting!', 3, 'text', 'public', NOW(), NOW())
    `)

    console.log("✅ Sample messages created")

    // Try to add foreign key constraints (completely optional - skip if not supported)
    const foreignKeys = [
      {
        table: "messages",
        constraint: "fk_messages_userId",
        sql: "ALTER TABLE messages ADD CONSTRAINT fk_messages_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE",
      },
      {
        table: "messages",
        constraint: "fk_messages_receiver",
        sql: "ALTER TABLE messages ADD CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE",
      },
      {
        table: "messages",
        constraint: "fk_messages_private_chat",
        sql: "ALTER TABLE messages ADD CONSTRAINT fk_messages_private_chat FOREIGN KEY (private_chat_id) REFERENCES private_chats(id) ON DELETE CASCADE",
      },
      {
        table: "sessions",
        constraint: "fk_sessions_userId",
        sql: "ALTER TABLE sessions ADD CONSTRAINT fk_sessions_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE",
      },
      {
        table: "private_chats",
        constraint: "fk_private_chats_user1",
        sql: "ALTER TABLE private_chats ADD CONSTRAINT fk_private_chats_user1 FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE",
      },
      {
        table: "private_chats",
        constraint: "fk_private_chats_user2",
        sql: "ALTER TABLE private_chats ADD CONSTRAINT fk_private_chats_user2 FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE",
      },
    ]

    for (const fk of foreignKeys) {
      try {
        await pool.execute(fk.sql)
        console.log(`✅ Foreign key ${fk.constraint} added`)
      } catch (error) {
        console.log(`⚠️ Foreign key ${fk.constraint} skipped (not supported):`, (error as any).message)
      }
    }

    console.log("🎉 Enhanced chat database setup completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Enhanced chat database setup completed! All features are now available.",
      tables: ["users", "messages", "sessions", "private_chats"],
      features: [
        "✅ User registration and login with avatars",
        "✅ Public chat room with real-time messaging",
        "✅ Private one-on-one messaging",
        "✅ Emoji picker with 6 categories",
        "✅ GIF sharing and animations",
        "✅ File upload and sharing (images, PDFs, documents)",
        "✅ Avatar upload and profile pictures",
        "✅ Online status tracking",
        "✅ Message history and timestamps",
        "✅ Responsive design for all devices",
      ],
      nextSteps: [
        "Go to http://localhost:3000",
        "Register a new account or login with existing credentials",
        "Upload your avatar in settings",
        "Try public chat with emojis, GIFs, and file sharing",
        "Go to Private Messages to start one-on-one conversations",
        "Invite friends to join your chat app!",
      ],
    })
  } catch (error) {
    console.error("❌ Enhanced chat database setup failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
        suggestion: "Try running the manual SQL setup in phpMyAdmin instead",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Check database status
    const [tables] = await pool.execute("SHOW TABLES")
    const tableNames = (tables as any[]).map((row) => Object.values(row)[0])

    let userCount = 0
    let messageCount = 0
    let sessionCount = 0
    let privateChatCount = 0

    if (tableNames.includes("users")) {
      const [userResult] = await pool.execute("SELECT COUNT(*) as count FROM users")
      userCount = (userResult as any[])[0].count
    }

    if (tableNames.includes("messages")) {
      const [messageResult] = await pool.execute("SELECT COUNT(*) as count FROM messages")
      messageCount = (messageResult as any[])[0].count
    }

    if (tableNames.includes("sessions")) {
      const [sessionResult] = await pool.execute("SELECT COUNT(*) as count FROM sessions")
      sessionCount = (sessionResult as any[])[0].count
    }

    if (tableNames.includes("private_chats")) {
      const [privateChatResult] = await pool.execute("SELECT COUNT(*) as count FROM private_chats")
      privateChatCount = (privateChatResult as any[])[0].count
    }

    return NextResponse.json({
      status: "connected",
      tables: tableNames,
      counts: {
        users: userCount,
        messages: messageCount,
        sessions: sessionCount,
        privateChats: privateChatCount,
      },
      compatibility: "ultra-strict-mode",
      ready: tableNames.length >= 4,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
