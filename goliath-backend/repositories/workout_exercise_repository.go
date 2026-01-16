package repositories

import (
	"context"
	"database/sql"
	"log"
	"time"

	"goliath/entities"
	"goliath/middleware"
)

// WorkoutExerciseRepository handles database operations for workout exercises
type WorkoutExerciseRepository struct {
	BaseRepository
}

// NewWorkoutExerciseRepository creates a new WorkoutExerciseRepository
func NewWorkoutExerciseRepository(db *sql.DB) *WorkoutExerciseRepository {
	return &WorkoutExerciseRepository{
		BaseRepository: BaseRepository{db: db},
	}
}

// GetAllForWorkout retrieves all exercises for a specific workout
func (r *WorkoutExerciseRepository) GetAllForWorkout(ctx context.Context, workoutID int) ([]entities.WorkoutExercise, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	
	rows, err := executor.QueryContext(ctx, `
		SELECT 
			we.id, we.version, we.created_when, we.created_by, we.modified_when, we.modified_by,
			we.workout_id, we.exercise_id, we.position, we.sets, we.reps, we.time_seconds, we.weight, we.notes,
			e.name as exercise_name, e.type as exercise_type
		FROM workout_exercise we
		JOIN exercise e ON we.exercise_id = e.id
		WHERE we.workout_id = ?
		ORDER BY we.position ASC
	`, workoutID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	exercises := []entities.WorkoutExercise{}
	for rows.Next() {
		exercise, err := entities.ScanWorkoutExercise(rows)
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

// GetByID retrieves a single workout exercise by ID
func (r *WorkoutExerciseRepository) GetByID(ctx context.Context, id int) (*entities.WorkoutExercise, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	
	row := executor.QueryRowContext(ctx, `
		SELECT 
			we.id, we.version, we.created_when, we.created_by, we.modified_when, we.modified_by,
			we.workout_id, we.exercise_id, we.position, we.sets, we.reps, we.time_seconds, we.weight, we.notes,
			e.name as exercise_name, e.type as exercise_type
		FROM workout_exercise we
		JOIN exercise e ON we.exercise_id = e.id
		WHERE we.id = ?
	`, id)
	
	var we entities.WorkoutExercise
	var createdWhen, modifiedWhen string
	err = row.Scan(
		&we.ID,
		&we.Version,
		&createdWhen,
		&we.CreatedBy,
		&modifiedWhen,
		&we.ModifiedBy,
		&we.WorkoutID,
		&we.ExerciseID,
		&we.Position,
		&we.Sets,
		&we.Reps,
		&we.TimeSeconds,
		&we.Weight,
		&we.Notes,
		&we.ExerciseName,
		&we.ExerciseType,
	)
	if err != nil {
		return nil, err
	}

	we.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
	we.ModifiedWhen, _ = time.Parse("2006-01-02 15:04:05", modifiedWhen)
	
	return &we, nil
}

// Create creates a new workout exercise
func (r *WorkoutExerciseRepository) Create(ctx context.Context, workoutID int, exerciseID int, position int, sets *int, reps *int, timeSeconds *int, weight *float64, notes *string) (int64, error) {
	log.Printf("Starting to create workout exercise for workout %d, exercise %d", workoutID, exerciseID)
	
	// Get user from context
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		return 0, ErrUserRequired
	}

	// Get executor (must be a transaction)
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return 0, err
	}

	log.Printf("Creating workout exercise with user %s", user.Email)
	
	// Insert workout exercise
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := executor.ExecContext(ctx, `
		INSERT INTO workout_exercise (version, created_by, modified_by, created_when, modified_when, workout_id, exercise_id, position, sets, reps, time_seconds, weight, notes)
		VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, user.FirebaseUID, user.FirebaseUID, now, now, workoutID, exerciseID, position, sets, reps, timeSeconds, weight, notes)
	if err != nil {
		return 0, err
	}

	workoutExerciseID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}
	log.Printf("Created workout exercise with ID %d", workoutExerciseID)

	return workoutExerciseID, nil
}

// Update updates an existing workout exercise
func (r *WorkoutExerciseRepository) Update(ctx context.Context, id int, position int, sets *int, reps *int, timeSeconds *int, weight *float64, notes *string) error {
	log.Printf("Starting to update workout exercise %d", id)
	
	// Get user from context
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		return ErrUserRequired
	}

	// Get executor (must be a transaction)
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return err
	}

	log.Printf("Updating workout exercise with user %s", user.Email)
	
	// Update workout exercise
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = executor.ExecContext(ctx, `
		UPDATE workout_exercise 
		SET position = ?, sets = ?, reps = ?, time_seconds = ?, weight = ?, notes = ?, modified_by = ?, modified_when = ?, version = version + 1
		WHERE id = ?
	`, position, sets, reps, timeSeconds, weight, notes, user.FirebaseUID, now, id)
	if err != nil {
		return err
	}

	return nil
}

// Delete deletes a workout exercise
func (r *WorkoutExerciseRepository) Delete(ctx context.Context, id int) error {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return err
	}

	_, err = executor.ExecContext(ctx, `DELETE FROM workout_exercise WHERE id = ?`, id)
	return err
}
