package repositories

import (
	"context"
	"database/sql"
	"log"
	"time"

	"goliath/entities"
	"goliath/middleware"
)

// WorkoutRepository handles database operations for workouts
type WorkoutRepository struct {
	BaseRepository
}

// NewWorkoutRepository creates a new WorkoutRepository
func NewWorkoutRepository(db *sql.DB) *WorkoutRepository {
	return &WorkoutRepository{
		BaseRepository: BaseRepository{db: db},
	}
}

// GetAllForUser retrieves all workouts for a specific user
func (r *WorkoutRepository) GetAllForUser(ctx context.Context, userID int) ([]entities.Workout, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	
	rows, err := executor.QueryContext(ctx, `
		SELECT id, version, created_when, created_by, modified_when, modified_by, name, user_id
		FROM workout
		WHERE user_id = ?
		ORDER BY created_when DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	workouts := []entities.Workout{}
	for rows.Next() {
		workout, err := entities.ScanWorkout(rows)
		if err != nil {
			return nil, err
		}
		workouts = append(workouts, *workout)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return workouts, nil
}

// GetByID retrieves a single workout by ID
func (r *WorkoutRepository) GetByID(ctx context.Context, id int) (*entities.Workout, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	
	row := executor.QueryRowContext(ctx, `
		SELECT id, version, created_when, created_by, modified_when, modified_by, name, user_id
		FROM workout
		WHERE id = ?
	`, id)
	
	var workout entities.Workout
	var createdWhen, modifiedWhen string
	err = row.Scan(
		&workout.ID,
		&workout.Version,
		&createdWhen,
		&workout.CreatedBy,
		&modifiedWhen,
		&workout.ModifiedBy,
		&workout.Name,
		&workout.UserID,
	)
	if err != nil {
		return nil, err
	}

	workout.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
	workout.ModifiedWhen, _ = time.Parse("2006-01-02 15:04:05", modifiedWhen)
	
	return &workout, nil
}

// Create creates a new workout
func (r *WorkoutRepository) Create(ctx context.Context, name string, userID int) (int64, error) {
	log.Printf("Starting to create workout %s for user %d", name, userID)
	
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

	log.Printf("Creating workout with user %s", user.Email)
	
	// Insert workout
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := executor.ExecContext(ctx, `
		INSERT INTO workout (version, created_by, modified_by, created_when, modified_when, name, user_id)
		VALUES (1, ?, ?, ?, ?, ?, ?)
	`, user.FirebaseUID, user.FirebaseUID, now, now, name, userID)
	if err != nil {
		return 0, err
	}

	workoutID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}
	log.Printf("Created workout with ID %d", workoutID)

	return workoutID, nil
}

// Update updates an existing workout
func (r *WorkoutRepository) Update(ctx context.Context, id int, name string) error {
	log.Printf("Starting to update workout %d", id)
	
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

	log.Printf("Updating workout with user %s", user.Email)
	
	// Update workout
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = executor.ExecContext(ctx, `
		UPDATE workout 
		SET name = ?, modified_by = ?, modified_when = ?, version = version + 1
		WHERE id = ?
	`, name, user.FirebaseUID, now, id)
	if err != nil {
		return err
	}

	return nil
}

// Delete deletes a workout
func (r *WorkoutRepository) Delete(ctx context.Context, id int) error {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return err
	}

	_, err = executor.ExecContext(ctx, `DELETE FROM workout WHERE id = ?`, id)
	return err
}
