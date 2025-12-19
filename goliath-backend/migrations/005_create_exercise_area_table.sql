-- Create Exercise Area table
CREATE TABLE IF NOT EXISTS exercise_area (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL DEFAULT 1,
    created_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    modified_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by TEXT,
    name TEXT NOT NULL UNIQUE
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_exercise_area_name ON exercise_area(name);

