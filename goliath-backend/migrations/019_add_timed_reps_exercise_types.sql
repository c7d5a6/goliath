-- Add 'Timed Reps' and 'Timed Reps Weighted' exercise types
-- Uses temp column approach to update the CHECK constraint without recreating the table

-- Drop index on type (required before dropping the column)
DROP INDEX IF EXISTS idx_exercise_type;

-- Add new column with updated CHECK constraint
ALTER TABLE exercise ADD COLUMN type_new TEXT NOT NULL DEFAULT 'Reps' CHECK(type_new IN ('Reps', 'Eccentric', 'Isometric', 'Reps Weighted', 'Isometric Weighted', 'Timed Reps', 'Timed Reps Weighted'));

-- Copy existing type values
UPDATE exercise SET type_new = type;

-- Drop old column (removes old CHECK constraint with it)
ALTER TABLE exercise DROP COLUMN type;

-- Rename new column to original name
ALTER TABLE exercise RENAME COLUMN type_new TO type;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_exercise_type ON exercise(type);
