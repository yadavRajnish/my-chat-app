import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function POST() {
  try {
    console.log("🔧 Setting up database tables (ultra-compatible mode)...")

    // Create users table (absolutely NO CURRENT_TIMESTAMP defaults)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        isOnline BOOLEAN DEFAULT false,
        lastSeen DATETIME NULL,
        createdAt DATETIME NULL,
        updatedAt DATETIME NULL
      )
    `)

    console.log("✅ Users table created")

    // Create messages table (absolutely NO CURRENT_TIMESTAMP defaults)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        userId INT NOT NULL,
        messageType ENUM('text', 'image', 'file') DEFAULT 'text',
        isRead BOOLEAN DEFAULT false,
        createdAt DATETIME NULL,
        updatedAt DATETIME NULL
      )
    `)

    console.log("✅ Messages table created")

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

    // Add indexes separately (safer for compatibility)
    try {
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`)
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_messages_userId ON messages(userId)`)
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_messages_createdAt ON messages(createdAt)`)
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId)`)
      await pool.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_expiresAt ON sessions(expiresAt)`)
      console.log("✅ Indexes created")
    } catch (error) {
      console.log("⚠️ Some indexes may already exist:", (error as any).message)
    }

    // Insert sample users with explicit timestamps
    await pool.execute(`
      INSERT IGNORE INTO users (username, email, password, isOnline, lastSeen, createdAt, updatedAt) VALUES 
      ('admin', 'admin@example.com', 'admin123', false, NOW(), NOW(), NOW()),
      ('demo_user', 'demo@example.com', 'demo123', false, NOW(), NOW(), NOW())
    `)

    console.log("✅ Sample users created")

    // Insert welcome messages with explicit timestamps
    await pool.execute(`
      INSERT IGNORE INTO messages (content, userId, createdAt, updatedAt) VALUES 
      ('🎉 Welcome to the Chat App! Database setup completed successfully.', 1, NOW(), NOW()),
      ('👋 Hello! You can now start chatting with other users.', 2, NOW(), NOW())
    `)

    console.log("✅ Sample messages created")

    // Try to add foreign key constraints (completely optional)
    try {
      await pool.execute(`
        ALTER TABLE messages 
        ADD CONSTRAINT fk_messages_userId 
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      `)
      console.log("✅ Messages foreign key added")
    } catch (error) {
      console.log("⚠️ Foreign key constraint skipped (not supported by this database):", (error as any).message)
    }

    try {
      await pool.execute(`
        ALTER TABLE sessions 
        ADD CONSTRAINT fk_sessions_userId 
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      `)
      console.log("✅ Sessions foreign key added")
    } catch (error) {
      console.log("⚠️ Foreign key constraint skipped (not supported by this database):", (error as any).message)
    }

    console.log("🎉 Database setup completed successfully!")

    return NextResponse.json({
      success: true,
      message: "Database tables created successfully! Your chat app is ready to use.",
      tables: ["users", "messages", "sessions"],
      features: [
        "✅ User registration and login",
        "✅ Real-time messaging",
        "✅ Session management",
        "✅ Message history",
        "✅ Online status tracking",
      ],
      nextSteps: [
        "Go to http://localhost:3000",
        "Login with: admin@example.com / admin123",
        "Or register a new account",
        "Start chatting!",
      ],
    })
  } catch (error) {
    console.error("❌ Database setup failed:", error)
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

    return NextResponse.json({
      status: "connected",
      tables: tableNames,
      counts: {
        users: userCount,
        messages: messageCount,
        sessions: sessionCount,
      },
      compatibility: "ultra-strict-mode",
      ready: tableNames.length >= 3,
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
