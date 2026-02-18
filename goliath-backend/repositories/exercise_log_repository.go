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

// GetLatestByWorkoutExercises retrieves the latest log entry per unique exercise
// for exercises that are either in the given workout or have workout_id = workoutID
func (r *ExerciseLogRepository) GetLatestByWorkoutExercises(ctx context.Context, userID int, workoutID int) ([]entities.ExerciseLog, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}

	rows, err := executor.QueryContext(ctx, `
		WITH ranked_logs AS (
			SELECT 
				el.id, el.version, el.created_when, el.created_by, el.modified_when, el.modified_by,
				el.user_id, el.workout_id, el.exercise_id, el.logged_when, el.position, el.sets, el.reps, el.time_seconds, el.weight, el.rest_seconds, el.notes,
				e.name as exercise_name, e.type as exercise_type,
				ROW_NUMBER() OVER (PARTITION BY el.exercise_id ORDER BY el.logged_when DESC) as rn
			FROM exercise_log el
			JOIN exercise e ON el.exercise_id = e.id
			WHERE el.user_id = ?
			AND (
				el.exercise_id IN (SELECT we.exercise_id FROM workout_exercise we WHERE we.workout_id = ?)
				OR el.workout_id = ?
			)
		)
		SELECT id, version, created_when, created_by, modified_when, modified_by,
			user_id, workout_id, exercise_id, logged_when, position, sets, reps, time_seconds, weight, rest_seconds, notes,
			exercise_name, exercise_type
		FROM ranked_logs
		WHERE rn = 1
		ORDER BY logged_when DESC
	`, userID, workoutID, workoutID)
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

// GetWorkoutIntensityData retrieves intensity data for a workout's exercises over the last 5 weeks
func (r *ExerciseLogRepository) GetWorkoutIntensityData(ctx context.Context, userID int, workoutID int) (map[int]map[string]float64, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}

	// Get data: exercise_id, week_offset, max(reps or time_seconds)
	// Join with exercise table to determine type-aware intensity calculation
	rows, err := executor.QueryContext(ctx, `
		WITH workout_exercises AS (
			SELECT DISTINCT exercise_id 
			FROM workout_exercise 
			WHERE workout_id = ?
		),
		exercise_maxes AS (
			SELECT 
				exercise_id,
				MAX(COALESCE(reps, 0)) as max_reps,
				MAX(COALESCE(time_seconds, 0)) as max_time
			FROM exercise_log
			WHERE user_id = ? 
				AND exercise_id IN (SELECT exercise_id FROM workout_exercises)
			GROUP BY exercise_id
		),
		weekly_logs AS (
			SELECT 
				el.exercise_id,
				e.type as exercise_type,
				CAST((julianday('now') - julianday(el.logged_when)) / 7 AS INTEGER) as week_offset,
				COALESCE(el.reps, 0) as reps,
				COALESCE(el.time_seconds, 0) as time_seconds,
				em.max_reps,
				em.max_time
			FROM exercise_log el
			JOIN exercise_maxes em ON el.exercise_id = em.exercise_id
			JOIN exercise e ON el.exercise_id = e.id
			WHERE el.user_id = ?
				AND el.exercise_id IN (SELECT exercise_id FROM workout_exercises)
				AND julianday('now') - julianday(el.logged_when) <= 35
		)
		SELECT 
			exercise_id,
			week_offset,
			AVG(CASE 
				WHEN exercise_type IN ('Isometric', 'Isometric Weighted', 'Timed Reps', 'Timed Reps Weighted') THEN
					CASE WHEN max_time > 0 THEN CAST(time_seconds AS REAL) / max_time * 100 ELSE 0 END
				ELSE
					CASE WHEN max_reps > 0 THEN CAST(reps AS REAL) / max_reps * 100 ELSE 0 END
			END) as avg_intensity
		FROM weekly_logs
		WHERE week_offset <= 4
		GROUP BY exercise_id, week_offset
	`, workoutID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Result: map[exercise_id]map[week_offset]intensity
	result := make(map[int]map[string]float64)
	
	for rows.Next() {
		var exerciseID, weekOffset int
		var intensity float64
		
		if err := rows.Scan(&exerciseID, &weekOffset, &intensity); err != nil {
			return nil, err
		}
		
		if result[exerciseID] == nil {
			result[exerciseID] = make(map[string]float64)
		}
		
		weekLabel := "current"
		if weekOffset > 0 {
			weekLabel = "week_" + string(rune('0' + weekOffset))
		}
		
		result[exerciseID][weekLabel] = intensity
	}

	return result, rows.Err()
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

// --- Calendar view queries ---

// CalendarYearEntry represents a raw (date, workout_id) pair for year view
type CalendarYearEntry struct {
	Date      string
	WorkoutID *int
}

// CalendarMonthEntry represents a grouped entry for month view
type CalendarMonthEntry struct {
	Date          string
	WorkoutID     *int
	WorkoutName   string
	ExerciseCount int
}

// CalendarWeekEntry represents a single exercise entry for week view
type CalendarWeekEntry struct {
	Date         string
	WorkoutID    *int
	WorkoutName  string
	ExerciseName string
	ExerciseType string
	Sets         *int
	Reps         *int
	TimeSeconds  *int
	Weight       *float64
	RestSeconds  *int
}

// GetCalendarYearData returns distinct (date, workout_id) pairs for a given year
func (r *ExerciseLogRepository) GetCalendarYearData(ctx context.Context, userID int, year string) ([]CalendarYearEntry, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}

	rows, err := executor.QueryContext(ctx, `
		SELECT 
			DATE(el.logged_when) as log_date,
			el.workout_id
		FROM exercise_log el
		WHERE el.user_id = ? 
			AND strftime('%Y', el.logged_when) = ?
		GROUP BY DATE(el.logged_when), el.workout_id
		ORDER BY log_date
	`, userID, year)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []CalendarYearEntry
	for rows.Next() {
		var entry CalendarYearEntry
		if err := rows.Scan(&entry.Date, &entry.WorkoutID); err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}
	return entries, rows.Err()
}

// GetCalendarMonthData returns log data grouped by (date, workout_id) for a given month
func (r *ExerciseLogRepository) GetCalendarMonthData(ctx context.Context, userID int, year, month string) ([]CalendarMonthEntry, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}

	rows, err := executor.QueryContext(ctx, `
		SELECT 
			DATE(el.logged_when) as log_date,
			el.workout_id,
			COALESCE(w.name, '') as workout_name,
			COUNT(*) as exercise_count
		FROM exercise_log el
		LEFT JOIN workout w ON el.workout_id = w.id
		WHERE el.user_id = ? 
			AND strftime('%Y', el.logged_when) = ?
			AND strftime('%m', el.logged_when) = ?
		GROUP BY DATE(el.logged_when), el.workout_id
		ORDER BY log_date, workout_name
	`, userID, year, month)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []CalendarMonthEntry
	for rows.Next() {
		var entry CalendarMonthEntry
		if err := rows.Scan(&entry.Date, &entry.WorkoutID, &entry.WorkoutName, &entry.ExerciseCount); err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}
	return entries, rows.Err()
}

// GetCalendarWeekData returns detailed exercise data for a date range (week)
func (r *ExerciseLogRepository) GetCalendarWeekData(ctx context.Context, userID int, startDate, endDate string) ([]CalendarWeekEntry, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}

	rows, err := executor.QueryContext(ctx, `
		SELECT 
			DATE(el.logged_when) as log_date,
			el.workout_id,
			COALESCE(w.name, '') as workout_name,
			e.name as exercise_name,
			e.type as exercise_type,
			el.sets, el.reps, el.time_seconds, el.weight, el.rest_seconds
		FROM exercise_log el
		LEFT JOIN workout w ON el.workout_id = w.id
		JOIN exercise e ON el.exercise_id = e.id
		WHERE el.user_id = ? 
			AND DATE(el.logged_when) >= ?
			AND DATE(el.logged_when) <= ?
		ORDER BY log_date, el.workout_id, el.position
	`, userID, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []CalendarWeekEntry
	for rows.Next() {
		var entry CalendarWeekEntry
		if err := rows.Scan(
			&entry.Date, &entry.WorkoutID, &entry.WorkoutName,
			&entry.ExerciseName, &entry.ExerciseType,
			&entry.Sets, &entry.Reps, &entry.TimeSeconds, &entry.Weight, &entry.RestSeconds,
		); err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}
	return entries, rows.Err()
}
