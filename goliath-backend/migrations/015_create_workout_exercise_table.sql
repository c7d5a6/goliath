-- Create Workout Exercise table (junction table with exercise configuration)
CREATE TABLE IF NOT EXISTS workout_exercise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL DEFAULT 1,
    created_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    modified_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by TEXT NOT NULL,
    workout_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    sets INTEGER,
    reps INTEGER,
    time_seconds INTEGER,
    weight REAL,
    notes TEXT,
    FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
);

-- Create index on workout_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_workout_exercise_workout_id ON workout_exercise(workout_id);

-- Create index on exercise_id
CREATE INDEX IF NOT EXISTS idx_workout_exercise_exercise_id ON workout_exercise(exercise_id);

-- Create compound index for workout exercises ordered by position
CREATE INDEX IF NOT EXISTS idx_workout_exercise_workout_position ON workout_exercise(workout_id, position);
