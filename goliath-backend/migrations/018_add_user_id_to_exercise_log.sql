-- Add user_id column to exercise_log table
ALTER TABLE exercise_log ADD COLUMN user_id INTEGER NOT NULL DEFAULT 0;

-- Add foreign key constraint
-- Note: SQLite doesn't support adding foreign keys to existing tables directly
-- This is just for documentation - the constraint will be enforced in code

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_exercise_log_user_id ON exercise_log(user_id);

-- Create compound index for user exercises ordered by logged time
CREATE INDEX IF NOT EXISTS idx_exercise_log_user_logged ON exercise_log(user_id, logged_when DESC);
