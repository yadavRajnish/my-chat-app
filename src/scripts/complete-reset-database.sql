-- Complete database reset with all required columns
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS users;

-- Create users table with all required columns
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    isOnline BOOLEAN DEFAULT false,
    lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create messages table
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    userId INT NOT NULL,
    messageType ENUM('text', 'image', 'file') DEFAULT 'text',
    isRead BOOLEAN DEFAULT false,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create sessions table
CREATE TABLE sessions (
    id VARCHAR(255) PRIMARY KEY,
    userId INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample users
INSERT INTO users (username, email, password, isOnline, lastSeen) VALUES 
('admin', 'admin@example.com', 'admin123', false, NOW()),
('alice', 'alice@example.com', 'password123', false, NOW()),
('bob', 'bob@example.com', 'password123', false, NOW());

-- Insert sample messages
INSERT INTO messages (content, userId) VALUES 
('Welcome to the enhanced chat room!', 1),
('Hello everyone!', 2),
('Hey there!', 3);

-- Show table structures
DESCRIBE users;
DESCRIBE messages;
DESCRIBE sessions;
