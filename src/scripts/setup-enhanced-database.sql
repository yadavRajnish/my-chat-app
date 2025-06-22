-- Create database
CREATE DATABASE IF NOT EXISTS chatapp;
USE chatapp;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS messages (
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
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(255) PRIMARY KEY,
    userId INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample users (passwords should be hashed in production)
INSERT IGNORE INTO users (username, email, password) VALUES 
('admin', 'admin@example.com', 'admin123'),
('alice', 'alice@example.com', 'password123'),
('bob', 'bob@example.com', 'password123');

-- Insert sample messages
INSERT IGNORE INTO messages (content, userId) VALUES 
('Welcome to the enhanced chat room!', 1),
('Hello everyone!', 2),
('Hey there!', 3);
