-- Check current messages table structure
DESCRIBE messages;

-- Remove username column from messages table (it should come from JOIN with users table)
ALTER TABLE messages DROP COLUMN IF EXISTS username;

-- Ensure all required columns exist with proper defaults
ALTER TABLE messages ADD COLUMN IF NOT EXISTS userId INT NOT NULL DEFAULT 1;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS messageType ENUM('text', 'image', 'file') DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS isRead BOOLEAN DEFAULT false;

-- Update any existing messages to have valid userIds
UPDATE messages SET userId = 1 WHERE userId IS NULL OR userId = 0;

-- Add foreign key constraint if it doesn't exist
SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE messages DROP FOREIGN KEY IF EXISTS messages_ibfk_1;
ALTER TABLE messages ADD CONSTRAINT messages_ibfk_1 FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
SET FOREIGN_KEY_CHECKS = 1;

-- Show final table structure
DESCRIBE messages;
SELECT * FROM messages LIMIT 5;
