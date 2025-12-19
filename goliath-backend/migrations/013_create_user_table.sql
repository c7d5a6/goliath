-- Create user table
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL DEFAULT 1,
    created_when TEXT NOT NULL DEFAULT (datetime('now')),
    created_by TEXT,
    modified_when TEXT NOT NULL DEFAULT (datetime('now')),
    modified_by TEXT,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    firebase_uid TEXT UNIQUE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON user(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_user_role ON user(role);

-- Create unique index on firebase_uid for faster lookups and uniqueness constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_firebase_uid ON user(firebase_uid) WHERE firebase_uid IS NOT NULL;

