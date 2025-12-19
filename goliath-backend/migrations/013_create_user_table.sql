-- Create user table
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL DEFAULT 1,
    created_when TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT,
    modified_when TEXT NOT NULL DEFAULT (datetime('now')),
    modified_by TEXT,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN'))
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_user_role ON user(role);

