-- Create Exercise table
CREATE TABLE IF NOT EXISTS exercise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL DEFAULT 1,
    created_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    modified_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by TEXT,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK(type IN ('Reps', 'Eccentric', 'Isometric'))
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_exercise_name ON exercise(name);

-- Create index on type for filtering
CREATE INDEX IF NOT EXISTS idx_exercise_type ON exercise(type);

