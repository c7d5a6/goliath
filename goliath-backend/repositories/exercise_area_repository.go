package repositories

import (
	"context"
	"database/sql"

	"goliath/entities"
)

// ExerciseAreaRepository handles database operations for exercise areas
type ExerciseAreaRepository struct {
	db *sql.DB
}

// NewExerciseAreaRepository creates a new ExerciseAreaRepository
func NewExerciseAreaRepository(db *sql.DB) *ExerciseAreaRepository {
	return &ExerciseAreaRepository{db: db}
}

// GetAll retrieves all exercise areas from the database
func (r *ExerciseAreaRepository) GetAll(ctx context.Context) ([]entities.ExerciseArea, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, version, created_when, created_by, modified_when, modified_by, name 
		FROM exercise_area 
		ORDER BY id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	exerciseAreas := []entities.ExerciseArea{}
	for rows.Next() {
		ea, err := entities.ScanExerciseArea(rows)
		if err != nil {
			return nil, err
		}
		exerciseAreas = append(exerciseAreas, *ea)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return exerciseAreas, nil
}

// GetByMuscleID retrieves exercise areas for a specific muscle
func (r *ExerciseAreaRepository) GetByMuscleID(ctx context.Context, muscleID int) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT ea.name
		FROM muscle_exercise_area mea
		JOIN exercise_area ea ON mea.exercise_area_id = ea.id
		WHERE mea.muscle_id = ?
		ORDER BY ea.name
	`, muscleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	areas := []string{}
	for rows.Next() {
		var areaName string
		if err := rows.Scan(&areaName); err != nil {
			return nil, err
		}
		areas = append(areas, areaName)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return areas, nil
}

// GetAllForMuscles retrieves exercise areas for all muscles in one query
func (r *ExerciseAreaRepository) GetAllForMuscles(ctx context.Context) (map[int][]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT mea.muscle_id, ea.name
		FROM muscle_exercise_area mea
		JOIN exercise_area ea ON mea.exercise_area_id = ea.id
		ORDER BY mea.muscle_id, ea.name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	muscleAreasMap := make(map[int][]string)
	for rows.Next() {
		var muscleID int
		var areaName string
		if err := rows.Scan(&muscleID, &areaName); err != nil {
			return nil, err
		}
		muscleAreasMap[muscleID] = append(muscleAreasMap[muscleID], areaName)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return muscleAreasMap, nil
}

