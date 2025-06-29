-- Ultra-compatible setup for older MySQL versions
-- This avoids advanced SQL syntax that might not be supported

-- Create users table with avatar support
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
);

-- Add avatar column if it doesn't exist
ALTER TABLE users ADD COLUMN avatar VARCHAR(255) NULL;

-- Create messages table with enhanced features
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
);

-- Add new columns to messages table
ALTER TABLE messages ADD COLUMN chat_type ENUM('public', 'private') DEFAULT 'public';
ALTER TABLE messages ADD COLUMN private_chat_id INT NULL;
ALTER TABLE messages ADD COLUMN receiver_id INT NULL;
ALTER TABLE messages ADD COLUMN fileInfo TEXT NULL;

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    userId INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    createdAt DATETIME NULL,
    expiresAt DATETIME NOT NULL
);

-- Create private_chats table (simplified)
CREATE TABLE IF NOT EXISTS private_chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL
);

-- Add unique constraint
ALTER TABLE private_chats ADD UNIQUE KEY unique_chat_users (user1_id, user2_id);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_messages_userId ON messages(userId);
CREATE INDEX idx_messages_createdAt ON messages(createdAt);
CREATE INDEX idx_messages_chat_type ON messages(chat_type);
CREATE INDEX idx_messages_private_chat ON messages(private_chat_id);
CREATE INDEX idx_sessions_userId ON sessions(userId);
CREATE INDEX idx_sessions_expiresAt ON sessions(expiresAt);
CREATE INDEX idx_private_chats_user1 ON private_chats(user1_id);
CREATE INDEX idx_private_chats_user2 ON private_chats(user2_id);

-- Insert sample users
INSERT IGNORE INTO users (username, email, password, isOnline, lastSeen, createdAt, updatedAt) VALUES 
('admin', 'admin@example.com', 'admin123', false, NOW(), NOW(), NOW()),
('demo_user', 'demo@example.com', 'demo123', false, NOW(), NOW(), NOW()),
('alice', 'alice@example.com', 'password123', false, NOW(), NOW(), NOW()),
('bob', 'bob@example.com', 'password123', false, NOW(), NOW(), NOW());

-- Insert sample messages
INSERT IGNORE INTO messages (content, userId, messageType, chat_type, createdAt, updatedAt) VALUES 
('🎉 Welcome to the Enhanced Chat App! Now with private messaging, emojis, GIFs, and file sharing!', 1, 'text', 'public', NOW(), NOW()),
('👋 Hello! Try the new features: 😊 emojis, 🎬 GIFs, 📎 file uploads, and 💬 private messages!', 2, 'text', 'public', NOW(), NOW()),
('🚀 Upload your avatar in settings and start chatting!', 3, 'text', 'public', NOW(), NOW());

-- Add foreign key constraints (optional - may fail on some MySQL versions)
ALTER TABLE messages ADD CONSTRAINT fk_messages_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT fk_messages_private_chat FOREIGN KEY (private_chat_id) REFERENCES private_chats(id) ON DELETE CASCADE;
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_userId FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE private_chats ADD CONSTRAINT fk_private_chats_user1 FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE private_chats ADD CONSTRAINT fk_private_chats_user2 FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE;

-- Show final status
SELECT 'Enhanced chat database setup completed successfully!' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as message_count FROM messages;
SELECT COUNT(*) as private_chat_count FROM private_chats;
SHOW TABLES;
