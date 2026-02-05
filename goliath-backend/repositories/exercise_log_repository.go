package repositories

import (
	"context"
	"database/sql"
	"log"
	"time"

	"goliath/entities"
	"goliath/middleware"
)

// ExerciseLogRepository handles database operations for exercise logs
type ExerciseLogRepository struct {
	BaseRepository
}

// NewExerciseLogRepository creates a new ExerciseLogRepository
func NewExerciseLogRepository(db *sql.DB) *ExerciseLogRepository {
	return &ExerciseLogRepository{
		BaseRepository: BaseRepository{db: db},
	}
}

// GetAll retrieves all exercise logs for a specific user
func (r *ExerciseLogRepository) GetAll(ctx context.Context, userID int, limit int, offset int) ([]entities.ExerciseLog, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	
	rows, err := executor.QueryContext(ctx, `
		SELECT 
			el.id, el.version, el.created_when, el.created_by, el.modified_when, el.modified_by,
			el.user_id, el.workout_id, el.exercise_id, el.logged_when, el.position, el.sets, el.reps, el.time_seconds, el.weight, el.rest_seconds, el.notes,
			e.name as exercise_name, e.type as exercise_type
		FROM exercise_log el
		JOIN exercise e ON el.exercise_id = e.id
		WHERE el.user_id = ?
		ORDER BY el.logged_when DESC
		LIMIT ? OFFSET ?
	`, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := []entities.ExerciseLog{}
	for rows.Next() {
		logEntry, err := entities.ScanExerciseLog(rows)
		if err != nil {
			return nil, err
		}
		logs = append(logs, *logEntry)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return logs, nil
}

// GetByExerciseID retrieves all logs for a specific exercise for a specific user
func (r *ExerciseLogRepository) GetByExerciseID(ctx context.Context, userID int, exerciseID int, limit int, offset int) ([]entities.ExerciseLog, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	
	rows, err := executor.QueryContext(ctx, `
		SELECT 
			el.id, el.version, el.created_when, el.created_by, el.modified_when, el.modified_by,
			el.user_id, el.workout_id, el.exercise_id, el.logged_when, el.position, el.sets, el.reps, el.time_seconds, el.weight, el.rest_seconds, el.notes,
			e.name as exercise_name, e.type as exercise_type
		FROM exercise_log el
		JOIN exercise e ON el.exercise_id = e.id
		WHERE el.user_id = ? AND el.exercise_id = ?
		ORDER BY el.logged_when DESC
		LIMIT ? OFFSET ?
	`, userID, exerciseID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := []entities.ExerciseLog{}
	for rows.Next() {
		logEntry, err := entities.ScanExerciseLog(rows)
		if err != nil {
			return nil, err
		}
		logs = append(logs, *logEntry)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return logs, nil
}

// GetByWorkoutID retrieves all logs for a specific workout for a specific user (nullable)
func (r *ExerciseLogRepository) GetByWorkoutID(ctx context.Context, userID int, workoutID int, limit int, offset int) ([]entities.ExerciseLog, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	
	rows, err := executor.QueryContext(ctx, `
		SELECT 
			el.id, el.version, el.created_when, el.created_by, el.modified_when, el.modified_by,
			el.user_id, el.workout_id, el.exercise_id, el.logged_when, el.position, el.sets, el.reps, el.time_seconds, el.weight, el.rest_seconds, el.notes,
			e.name as exercise_name, e.type as exercise_type
		FROM exercise_log el
		JOIN exercise e ON el.exercise_id = e.id
		WHERE el.user_id = ? AND el.workout_id = ?
		ORDER BY el.logged_when DESC
		LIMIT ? OFFSET ?
	`, userID, workoutID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := []entities.ExerciseLog{}
	for rows.Next() {
		logEntry, err := entities.ScanExerciseLog(rows)
		if err != nil {
			return nil, err
		}
		logs = append(logs, *logEntry)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return logs, nil
}

// GetByID retrieves a single exercise log by ID for a specific user
func (r *ExerciseLogRepository) GetByID(ctx context.Context, id int, userID int) (*entities.ExerciseLog, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	
	row := executor.QueryRowContext(ctx, `
		SELECT 
			el.id, el.version, el.created_when, el.created_by, el.modified_when, el.modified_by,
			el.user_id, el.workout_id, el.exercise_id, el.logged_when, el.position, el.sets, el.reps, el.time_seconds, el.weight, el.rest_seconds, el.notes,
			e.name as exercise_name, e.type as exercise_type
		FROM exercise_log el
		JOIN exercise e ON el.exercise_id = e.id
		WHERE el.id = ? AND el.user_id = ?
	`, id, userID)
	
	var el entities.ExerciseLog
	var createdWhen, modifiedWhen, loggedWhen string
	err = row.Scan(
		&el.ID,
		&el.Version,
		&createdWhen,
		&el.CreatedBy,
		&modifiedWhen,
		&el.ModifiedBy,
		&el.UserID,
		&el.WorkoutID,
		&el.ExerciseID,
		&loggedWhen,
		&el.Position,
		&el.Sets,
		&el.Reps,
		&el.TimeSeconds,
		&el.Weight,
		&el.RestSeconds,
		&el.Notes,
		&el.ExerciseName,
		&el.ExerciseType,
	)
	if err != nil {
		return nil, err
	}

	el.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
	el.ModifiedWhen, _ = time.Parse("2006-01-02 15:04:05", modifiedWhen)
	el.LoggedWhen, _ = time.Parse("2006-01-02 15:04:05", loggedWhen)
	
	return &el, nil
}

// Create creates a new exercise log
func (r *ExerciseLogRepository) Create(ctx context.Context, userID int, workoutID *int, exerciseID int, position int, sets *int, reps *int, timeSeconds *int, weight *float64, restSeconds *int, notes *string) (int64, error) {
	log.Printf("Starting to create exercise log for exercise %d, user %d", exerciseID, userID)
	
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

	log.Printf("Creating exercise log with user %s", user.Email)
	
	// Insert exercise log
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := executor.ExecContext(ctx, `
		INSERT INTO exercise_log (version, created_by, modified_by, created_when, modified_when, user_id, workout_id, exercise_id, logged_when, position, sets, reps, time_seconds, weight, rest_seconds, notes)
		VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, user.FirebaseUID, user.FirebaseUID, now, now, userID, workoutID, exerciseID, now, position, sets, reps, timeSeconds, weight, restSeconds, notes)
	if err != nil {
		return 0, err
	}

	logID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}
	log.Printf("Created exercise log with ID %d", logID)

	return logID, nil
}

// Update updates an existing exercise log
func (r *ExerciseLogRepository) Update(ctx context.Context, id int, sets *int, reps *int, timeSeconds *int, weight *float64, restSeconds *int, notes *string) error {
	log.Printf("Starting to update exercise log %d", id)
	
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

	log.Printf("Updating exercise log with user %s", user.Email)
	
	// Update exercise log
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = executor.ExecContext(ctx, `
		UPDATE exercise_log 
		SET sets = ?, reps = ?, time_seconds = ?, weight = ?, rest_seconds = ?, notes = ?, modified_by = ?, modified_when = ?, version = version + 1
		WHERE id = ?
	`, sets, reps, timeSeconds, weight, restSeconds, notes, user.FirebaseUID, now, id)
	if err != nil {
		return err
	}

	return nil
}

// Delete deletes an exercise log for a specific user
func (r *ExerciseLogRepository) Delete(ctx context.Context, id int, userID int) error {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return err
	}

	_, err = executor.ExecContext(ctx, `DELETE FROM exercise_log WHERE id = ? AND user_id = ?`, id, userID)
	return err
}
