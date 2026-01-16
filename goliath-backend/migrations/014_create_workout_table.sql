-- Create Workout table
CREATE TABLE IF NOT EXISTS workout (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL DEFAULT 1,
    created_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    modified_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by TEXT NOT NULL,
    name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

-- Create index on user_id for faster lookups of user's workouts
CREATE INDEX IF NOT EXISTS idx_workout_user_id ON workout(user_id);

-- Create index on name for searching
CREATE INDEX IF NOT EXISTS idx_workout_name ON workout(name);
