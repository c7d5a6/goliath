package repositories

import (
	"context"
	"database/sql"
	"time"

	"goliath/entities"
)

// ExerciseRepository handles database operations for exercises
type ExerciseRepository struct {
	db *sql.DB
}

// NewExerciseRepository creates a new ExerciseRepository
func NewExerciseRepository(db *sql.DB) *ExerciseRepository {
	return &ExerciseRepository{db: db}
}

// GetAll retrieves all exercises from the database
func (r *ExerciseRepository) GetAll(ctx context.Context) ([]entities.Exercise, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, version, created_when, created_by, modified_when, modified_by, name, type
		FROM exercise
		ORDER BY type, name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	exercises := []entities.Exercise{}
	for rows.Next() {
		exercise, err := entities.ScanExercise(rows)
		if err != nil {
			return nil, err
		}
		exercises = append(exercises, *exercise)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return exercises, nil
}

// GetMusclesForExercise retrieves muscles associated with an exercise
func (r *ExerciseRepository) GetMusclesForExercise(ctx context.Context, exerciseID int) ([]entities.ExerciseMuscle, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT em.exercise_id, em.muscle_id, m.name, em.percentage, em.created_when, em.created_by
		FROM exercise_muscle em
		JOIN muscle m ON em.muscle_id = m.id
		WHERE em.exercise_id = ?
		ORDER BY em.percentage DESC
	`, exerciseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	muscles := []entities.ExerciseMuscle{}
	for rows.Next() {
		var em entities.ExerciseMuscle
		var createdWhen string
		if err := rows.Scan(&em.ExerciseID, &em.MuscleID, &em.MuscleName, &em.Percentage, &createdWhen, &em.CreatedBy); err != nil {
			return nil, err
		}
		em.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
		muscles = append(muscles, em)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return muscles, nil
}

// GetMusclesForAllExercises retrieves muscles for all exercises in one query
func (r *ExerciseRepository) GetMusclesForAllExercises(ctx context.Context) (map[int][]entities.ExerciseMuscle, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT em.exercise_id, em.muscle_id, m.name, em.percentage, em.created_when, em.created_by
		FROM exercise_muscle em
		JOIN muscle m ON em.muscle_id = m.id
		ORDER BY em.exercise_id, em.percentage DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	exerciseMusclesMap := make(map[int][]entities.ExerciseMuscle)
	for rows.Next() {
		var em entities.ExerciseMuscle
		var createdWhen string
		if err := rows.Scan(&em.ExerciseID, &em.MuscleID, &em.MuscleName, &em.Percentage, &createdWhen, &em.CreatedBy); err != nil {
			return nil, err
		}
		em.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
		exerciseMusclesMap[em.ExerciseID] = append(exerciseMusclesMap[em.ExerciseID], em)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return exerciseMusclesMap, nil
}

// ExerciseExists checks if an exercise with the given name already exists
func (r *ExerciseRepository) ExerciseExists(ctx context.Context, name string) (bool, error) {
	var count int
	err := r.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM exercise WHERE LOWER(name) = LOWER(?)", name).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// MuscleInput represents muscle data for creating an exercise
type MuscleInput struct {
	MuscleID   int     `json:"muscle_id" binding:"required"`
	Percentage float64 `json:"percentage" binding:"required,min=1,max=100"`
}

// Create creates a new exercise with associated muscles in a transaction
func (r *ExerciseRepository) Create(ctx context.Context, name string, exerciseType entities.ExerciseType, muscles []MuscleInput) (int64, error) {
	// Start transaction
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	// Insert exercise
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := tx.ExecContext(ctx, `
		INSERT INTO exercise (version, created_when, modified_when, name, type)
		VALUES (1, ?, ?, ?, ?)
	`, now, now, name, exerciseType)
	if err != nil {
		return 0, err
	}

	exerciseID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	// Insert exercise muscles
	for _, m := range muscles {
		_, err := tx.ExecContext(ctx, `
			INSERT INTO exercise_muscle (exercise_id, muscle_id, percentage, created_when)
			VALUES (?, ?, ?, ?)
		`, exerciseID, m.MuscleID, m.Percentage, now)
		if err != nil {
			return 0, err
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return exerciseID, nil
}

