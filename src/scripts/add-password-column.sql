-- Add password column to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL DEFAULT 'defaultpassword';

-- Update existing users with default passwords (change these as needed)
UPDATE users SET password = 'admin123' WHERE email = 'admin@example.com';
UPDATE users SET password = 'password123' WHERE email = 'alice@example.com';
UPDATE users SET password = 'password123' WHERE email = 'bob@example.com';

-- Show the updated table structure
DESCRIBE users;
