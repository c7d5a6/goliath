-- Create junction table for many-to-many relationship between Muscle and Exercise Area
CREATE TABLE IF NOT EXISTS muscle_exercise_area (
    muscle_id INTEGER NOT NULL,
    exercise_area_id INTEGER NOT NULL,
    created_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    PRIMARY KEY (muscle_id, exercise_area_id),
    FOREIGN KEY (muscle_id) REFERENCES muscle(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_area_id) REFERENCES exercise_area(id) ON DELETE CASCADE
);

-- Create indexes for faster joins
CREATE INDEX IF NOT EXISTS idx_muscle_exercise_area_muscle ON muscle_exercise_area(muscle_id);
CREATE INDEX IF NOT EXISTS idx_muscle_exercise_area_exercise ON muscle_exercise_area(exercise_area_id);

