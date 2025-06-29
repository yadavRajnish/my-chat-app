-- Add missing columns for private chat functionality
-- Run this if you're getting "Unknown column" errors

-- Add receiver_id column if it doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id INT NULL;

-- Add chat_type column if it doesn't exist  
ALTER TABLE messages ADD COLUMN IF NOT EXISTS chat_type ENUM('public', 'private') DEFAULT 'public';

-- Add private_chat_id column if it doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS private_chat_id INT NULL;

-- Add fileInfo column if it doesn't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS fileInfo TEXT NULL;

-- Add avatar column to users if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255) NULL;

-- Show updated table structure
DESCRIBE messages;
DESCRIBE users;

-- Test the columns
SELECT 'All required columns added successfully!' as status;
