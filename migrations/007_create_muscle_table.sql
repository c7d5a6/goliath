-- Create Muscle table
CREATE TABLE IF NOT EXISTS muscle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL DEFAULT 1,
    created_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    modified_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by TEXT,
    name TEXT NOT NULL UNIQUE,
    muscle_group_id INTEGER NOT NULL,
    FOREIGN KEY (muscle_group_id) REFERENCES muscle_group(id) ON DELETE RESTRICT
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_muscle_name ON muscle(name);

-- Create index on muscle_group_id for faster joins
CREATE INDEX IF NOT EXISTS idx_muscle_muscle_group ON muscle(muscle_group_id);

