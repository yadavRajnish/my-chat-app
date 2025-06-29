-- Add new tables and columns for enhanced chat features

-- Add avatar column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) NULL;

-- Create private_chats table for personal messaging
CREATE TABLE IF NOT EXISTS private_chats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at DATETIME NULL,
    updated_at DATETIME NULL,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_chat (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id)),
    INDEX idx_user1 (user1_id),
    INDEX idx_user2 (user2_id)
);

-- Update messages table for private chat support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS chat_type ENUM('public', 'private') DEFAULT 'public';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS private_chat_id INT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id INT NULL;

-- Add foreign key for private chat
ALTER TABLE messages ADD CONSTRAINT fk_messages_private_chat 
FOREIGN KEY (private_chat_id) REFERENCES private_chats(id) ON DELETE CASCADE;

-- Add foreign key for receiver
ALTER TABLE messages ADD CONSTRAINT fk_messages_receiver 
FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_type ON messages(chat_type);
CREATE INDEX IF NOT EXISTS idx_messages_private_chat ON messages(private_chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);

-- Show updated structure
DESCRIBE users;
DESCRIBE messages;
DESCRIBE private_chats;

SELECT 'Enhanced chat features added successfully!' as status;
