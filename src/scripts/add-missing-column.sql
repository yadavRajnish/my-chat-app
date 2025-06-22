-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT 'defaultpassword',
ADD COLUMN IF NOT EXISTS isOnline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lastSeen DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Update existing users with default values
UPDATE users SET 
    password = 'admin123',
    isOnline = false,
    lastSeen = NOW()
WHERE email = 'admin@example.com';

UPDATE users SET 
    password = 'password123',
    isOnline = false,
    lastSeen = NOW()
WHERE email = 'alice@example.com';

UPDATE users SET 
    password = 'password123',
    isOnline = false,
    lastSeen = NOW()
WHERE email = 'bob@example.com';

-- Show the updated table structure
DESCRIBE users;
