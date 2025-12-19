package repositories

import (
	"context"
	"database/sql"

	"goliath/entities"
)

// MuscleGroupRepository handles database operations for muscle groups
type MuscleGroupRepository struct {
	db *sql.DB
}

// NewMuscleGroupRepository creates a new MuscleGroupRepository
func NewMuscleGroupRepository(db *sql.DB) *MuscleGroupRepository {
	return &MuscleGroupRepository{db: db}
}

// GetAll retrieves all muscle groups from the database with region information
func (r *MuscleGroupRepository) GetAll(ctx context.Context) ([]entities.MuscleGroup, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT mg.id, mg.version, mg.created_when, mg.created_by, mg.modified_when, mg.modified_by, 
		       mg.name, mg.region_id, r.name as region_name
		FROM muscle_group mg
		JOIN region r ON mg.region_id = r.id
		ORDER BY mg.region_id, mg.id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	muscleGroups := []entities.MuscleGroup{}
	for rows.Next() {
		mg, err := entities.ScanMuscleGroup(rows, true)
		if err != nil {
			return nil, err
		}
		muscleGroups = append(muscleGroups, *mg)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return muscleGroups, nil
}

