-- Ultra-compatible setup script for very strict MySQL databases
-- This works with the most restrictive SQL modes

-- Create users table (no CURRENT_TIMESTAMP defaults)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    isOnline BOOLEAN DEFAULT false,
    lastSeen DATETIME NULL,
    createdAt DATETIME NULL,
    updatedAt DATETIME NULL,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_isOnline (isOnline)
);

-- Create messages table (no CURRENT_TIMESTAMP defaults)
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    userId INT NOT NULL,
    messageType ENUM('text', 'image', 'file') DEFAULT 'text',
    isRead BOOLEAN DEFAULT false,
    createdAt DATETIME NULL,
    updatedAt DATETIME NULL,
    INDEX idx_userId (userId),
    INDEX idx_createdAt (createdAt),
    INDEX idx_isRead (isRead)
);

-- Create sessions table (no CURRENT_TIMESTAMP defaults)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    userId INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    createdAt DATETIME NULL,
    expiresAt DATETIME NOT NULL,
    INDEX idx_userId (userId),
    INDEX idx_expiresAt (expiresAt)
);

-- Insert sample users with explicit timestamps
INSERT IGNORE INTO users (username, email, password, isOnline, lastSeen, createdAt, updatedAt) VALUES 
('admin', 'admin@example.com', 'admin123', false, NOW(), NOW(), NOW()),
('demo_user', 'demo@example.com', 'demo123', false, NOW(), NOW(), NOW());

-- Insert welcome messages with explicit timestamps
INSERT IGNORE INTO messages (content, userId, createdAt, updatedAt) VALUES 
('🎉 Welcome to the Chat App! This is your first message.', 1, NOW(), NOW()),
('👋 Hello! Feel free to start chatting.', 2, NOW(), NOW());

-- Show tables created
SHOW TABLES;

-- Show sample data
SELECT 'Setup completed successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as message_count FROM messages;
