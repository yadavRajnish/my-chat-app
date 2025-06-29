-- Setup script for FreeSQLDatabase.com
-- Run this in your database console or phpMyAdmin

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    isOnline BOOLEAN DEFAULT false,
    lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_isOnline (isOnline)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    userId INT NOT NULL,
    messageType ENUM('text', 'image', 'file') DEFAULT 'text',
    isRead BOOLEAN DEFAULT false,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_userId (userId),
    INDEX idx_createdAt (createdAt),
    INDEX idx_isRead (isRead)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    userId INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    
    -- Foreign key constraint
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_userId (userId),
    INDEX idx_expiresAt (expiresAt)
);

-- Insert sample admin user
INSERT IGNORE INTO users (username, email, password, isOnline, lastSeen) VALUES 
('admin', 'admin@example.com', 'admin123', false, NOW()),
('demo_user', 'demo@example.com', 'demo123', false, NOW());

-- Insert welcome messages
INSERT IGNORE INTO messages (content, userId) VALUES 
('🎉 Welcome to the Chat App! This is your first message.', 1),
('👋 Hello! Feel free to start chatting.', 2);

-- Show tables created
SHOW TABLES;

-- Show sample data
SELECT 'Users created:' as info;
SELECT id, username, email FROM users;

SELECT 'Messages created:' as info;
SELECT m.id, m.content, u.username FROM messages m JOIN users u ON m.userId = u.id;

SELECT 'Database setup completed successfully!' as status;
