package repositories

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"time"

	"goliath/entities"
	"goliath/middleware"
)

// ErrUserRequired is returned when a user is expected but not found in context
var ErrUserRequired = errors.New("user required in context")

// ExerciseRepository handles database operations for exercises
type ExerciseRepository struct {
	BaseRepository
}

// NewExerciseRepository creates a new ExerciseRepository
func NewExerciseRepository(db *sql.DB) *ExerciseRepository {
	return &ExerciseRepository{
		BaseRepository: BaseRepository{db: db},
	}
}

// GetAll retrieves all exercises from the database
func (r *ExerciseRepository) GetAll(ctx context.Context) ([]entities.Exercise, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	rows, err := executor.QueryContext(ctx, `
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

// GetByID retrieves a single exercise by ID
func (r *ExerciseRepository) GetByID(ctx context.Context, id int) (*entities.Exercise, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	
	row := executor.QueryRowContext(ctx, `
		SELECT id, version, created_when, created_by, modified_when, modified_by, name, type
		FROM exercise
		WHERE id = ?
	`, id)
	
	var exercise entities.Exercise
	var createdWhen, modifiedWhen string
	var exerciseType string
	err = row.Scan(
		&exercise.ID,
		&exercise.Version,
		&createdWhen,
		&exercise.CreatedBy,
		&modifiedWhen,
		&exercise.ModifiedBy,
		&exercise.Name,
		&exerciseType,
	)
	if err != nil {
		return nil, err
	}

	exercise.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
	exercise.ModifiedWhen, _ = time.Parse("2006-01-02 15:04:05", modifiedWhen)
	exercise.Type = entities.ExerciseType(exerciseType)
	exercise.Muscles = []entities.ExerciseMuscle{}
	exercise.ExerciseAreas = []entities.ExerciseAreaSummary{}
	
	return &exercise, nil
}

// GetExerciseAreasForAllExercises retrieves exercise areas for all exercises with aggregated percentages
func (r *ExerciseRepository) GetExerciseAreasForAllExercises(ctx context.Context) (map[int][]entities.ExerciseAreaSummary, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	
	// This query:
	// 1. Joins exercise_muscle to get all muscles for exercises
	// 2. Joins muscle_exercise_area to get exercise areas for those muscles
	// 3. Joins exercise_area to get the area names
	// 4. Groups by exercise_id and exercise_area_id to calculate average percentages
	rows, err := executor.QueryContext(ctx, `
		SELECT 
			em.exercise_id,
			ea.id as exercise_area_id,
			ea.name as exercise_area_name,
			AVG(em.percentage) as avg_percentage
		FROM exercise_muscle em
		JOIN muscle m ON em.muscle_id = m.id
		JOIN muscle_exercise_area mea ON m.id = mea.muscle_id
		JOIN exercise_area ea ON mea.exercise_area_id = ea.id
		GROUP BY em.exercise_id, ea.id, ea.name
		ORDER BY em.exercise_id, avg_percentage DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	exerciseAreasMap := make(map[int][]entities.ExerciseAreaSummary)
	for rows.Next() {
		var exerciseID int
		var area entities.ExerciseAreaSummary
		if err := rows.Scan(&exerciseID, &area.ExerciseAreaID, &area.ExerciseAreaName, &area.Percentage); err != nil {
			return nil, err
		}
		exerciseAreasMap[exerciseID] = append(exerciseAreasMap[exerciseID], area)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return exerciseAreasMap, nil
}

// GetMusclesForExercise retrieves muscles associated with an exercise
func (r *ExerciseRepository) GetMusclesForExercise(ctx context.Context, exerciseID int) ([]entities.ExerciseMuscle, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	rows, err := executor.QueryContext(ctx, `
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
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	rows, err := executor.QueryContext(ctx, `
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
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return false, err
	}
	var count int
	err = executor.QueryRowContext(ctx, "SELECT COUNT(*) FROM exercise WHERE LOWER(name) = LOWER(?)", name).Scan(&count)
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
// This method requires a transaction to be present in the context (from Transaction middleware)
func (r *ExerciseRepository) Create(ctx context.Context, name string, exerciseType entities.ExerciseType, muscles []MuscleInput) (int64, error) {
	log.Printf("Starting to create exercise %s", name)
	
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

	log.Printf("Creating exercise with user %s", user.Email)
	
	// Insert exercise
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := executor.ExecContext(ctx, `
		INSERT INTO exercise (version, created_by, modified_by, created_when, modified_when, name, type)
		VALUES (1, ?, ?, ?, ?, ?, ?)
	`, user.FirebaseUID, user.FirebaseUID, now, now, name, exerciseType)
	if err != nil {
		return 0, err
	}

	exerciseID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}
	log.Printf("Created exercise with ID %d", exerciseID)

	// Insert exercise muscles
	for _, m := range muscles {
		_, err := executor.ExecContext(ctx, `
			INSERT INTO exercise_muscle (exercise_id, muscle_id, percentage, created_when)
			VALUES (?, ?, ?, ?)
		`, exerciseID, m.MuscleID, m.Percentage, now)
		if err != nil {
			return 0, err
		}
	}

	return exerciseID, nil
}

// Update updates an existing exercise with associated muscles in a transaction
// This method requires a transaction to be present in the context (from Transaction middleware)
func (r *ExerciseRepository) Update(ctx context.Context, id int, name string, exerciseType entities.ExerciseType, muscles []MuscleInput) error {
	log.Printf("Starting to update exercise %d", id)
	
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

	log.Printf("Updating exercise with user %s", user.Email)
	
	// Update exercise
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = executor.ExecContext(ctx, `
		UPDATE exercise 
		SET name = ?, type = ?, modified_by = ?, modified_when = ?, version = version + 1
		WHERE id = ?
	`, name, exerciseType, user.FirebaseUID, now, id)
	if err != nil {
		return err
	}

	// Delete existing exercise muscles
	_, err = executor.ExecContext(ctx, `DELETE FROM exercise_muscle WHERE exercise_id = ?`, id)
	if err != nil {
		return err
	}

	// Insert new exercise muscles
	for _, m := range muscles {
		_, err := executor.ExecContext(ctx, `
			INSERT INTO exercise_muscle (exercise_id, muscle_id, percentage, created_when)
			VALUES (?, ?, ?, ?)
		`, id, m.MuscleID, m.Percentage, now)
		if err != nil {
			return err
		}
	}

	return nil
}
