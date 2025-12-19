-- Create junction table for many-to-many relationship between Exercise and Muscle
-- Includes percentage value to indicate how much each muscle is involved in the exercise
CREATE TABLE IF NOT EXISTS exercise_muscle (
    exercise_id INTEGER NOT NULL,
    muscle_id INTEGER NOT NULL,
    percentage REAL NOT NULL CHECK(percentage >= 0 AND percentage <= 100),
    created_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    PRIMARY KEY (exercise_id, muscle_id),
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE,
    FOREIGN KEY (muscle_id) REFERENCES muscle(id) ON DELETE CASCADE
);

-- Create indexes for faster joins
CREATE INDEX IF NOT EXISTS idx_exercise_muscle_exercise ON exercise_muscle(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_muscle_muscle ON exercise_muscle(muscle_id);

