-- Check current messages table structure
DESCRIBE messages;

-- Add userId column if it doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS userId INT NOT NULL DEFAULT 1;

-- Add foreign key constraint if it doesn't exist
-- First, let's make sure we have valid userIds
UPDATE messages SET userId = 1 WHERE userId IS NULL OR userId = 0;

-- Add the foreign key constraint (drop first if exists)
SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE messages DROP FOREIGN KEY IF EXISTS messages_ibfk_1;
ALTER TABLE messages ADD CONSTRAINT messages_ibfk_1 FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;
SET FOREIGN_KEY_CHECKS = 1;

-- Show updated table structure
DESCRIBE messages;
SELECT * FROM messages LIMIT 5;
