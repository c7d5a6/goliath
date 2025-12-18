-- Create Muscle Group table
CREATE TABLE IF NOT EXISTS muscle_group (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL DEFAULT 1,
    created_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    modified_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by TEXT,
    name TEXT NOT NULL UNIQUE,
    region_id INTEGER NOT NULL,
    FOREIGN KEY (region_id) REFERENCES region(id) ON DELETE RESTRICT
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_muscle_group_name ON muscle_group(name);

-- Create index on region_id for faster joins
CREATE INDEX IF NOT EXISTS idx_muscle_group_region ON muscle_group(region_id);

