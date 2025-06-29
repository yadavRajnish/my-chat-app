-- Add file support to the messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS fileInfo TEXT NULL;

-- Show updated table structure
DESCRIBE messages;

-- Test the new column
SELECT 'File support added successfully!' as status;
