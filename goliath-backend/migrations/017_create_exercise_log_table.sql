-- Create Exercise Log table (tracks completed exercises)
CREATE TABLE IF NOT EXISTS exercise_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER NOT NULL DEFAULT 1,
    created_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT NOT NULL,
    modified_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by TEXT NOT NULL,
    workout_id INTEGER,
    exercise_id INTEGER NOT NULL,
    logged_when TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    position INTEGER NOT NULL DEFAULT 0,
    sets INTEGER,
    reps INTEGER,
    time_seconds INTEGER,
    weight REAL,
    rest_seconds INTEGER,
    notes TEXT,
    FOREIGN KEY (workout_id) REFERENCES workout(id) ON DELETE SET NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercise(id) ON DELETE CASCADE
);

-- Create index on workout_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_exercise_log_workout_id ON exercise_log(workout_id);

-- Create index on exercise_id
CREATE INDEX IF NOT EXISTS idx_exercise_log_exercise_id ON exercise_log(exercise_id);

-- Create index on logged_when for chronological queries
CREATE INDEX IF NOT EXISTS idx_exercise_log_logged_when ON exercise_log(logged_when);

-- Create compound index for workout exercises ordered by position
CREATE INDEX IF NOT EXISTS idx_exercise_log_workout_position ON exercise_log(workout_id, position);
