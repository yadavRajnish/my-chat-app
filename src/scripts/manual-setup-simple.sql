-- Absolutely minimal setup for ultra-strict MySQL
-- Copy and paste this EXACTLY into phpMyAdmin

-- Drop existing tables if they exist (start fresh)
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;

-- Create users table (no defaults at all)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    isOnline BOOLEAN DEFAULT false,
    lastSeen DATETIME NULL,
    createdAt DATETIME NULL,
    updatedAt DATETIME NULL
);

-- Create messages table (no defaults at all)
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    userId INT NOT NULL,
    messageType ENUM('text', 'image', 'file') DEFAULT 'text',
    isRead BOOLEAN DEFAULT false,
    createdAt DATETIME NULL,
    updatedAt DATETIME NULL
);

-- Create sessions table (no defaults at all)
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    userId INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    createdAt DATETIME NULL,
    expiresAt DATETIME NOT NULL
);

-- Insert sample users
INSERT INTO users (username, email, password, isOnline, lastSeen, createdAt, updatedAt) VALUES 
('admin', 'admin@example.com', 'admin123', false, NOW(), NOW(), NOW()),
('demo_user', 'demo@example.com', 'demo123', false, NOW(), NOW(), NOW());

-- Insert sample messages
INSERT INTO messages (content, userId, createdAt, updatedAt) VALUES 
('🎉 Welcome to the Chat App!', 1, NOW(), NOW()),
('👋 Hello everyone!', 2, NOW(), NOW());

-- Show what was created
SELECT 'Setup completed!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as message_count FROM messages;
SHOW TABLES;
