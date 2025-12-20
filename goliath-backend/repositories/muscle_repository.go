package repositories

import (
	"context"
	"database/sql"

	"goliath/entities"
)

// MuscleRepository handles database operations for muscles
type MuscleRepository struct {
	BaseRepository
}

// NewMuscleRepository creates a new MuscleRepository
func NewMuscleRepository(db *sql.DB) *MuscleRepository {
	return &MuscleRepository{
		BaseRepository: BaseRepository{db: db},
	}
}

// GetAll retrieves all muscles from the database with muscle group information
func (r *MuscleRepository) GetAll(ctx context.Context) ([]entities.Muscle, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	rows, err := executor.QueryContext(ctx, `
		SELECT m.id, m.version, m.created_when, m.created_by, m.modified_when, m.modified_by, 
		       m.name, m.muscle_group_id, mg.name as muscle_group_name
		FROM muscle m
		JOIN muscle_group mg ON m.muscle_group_id = mg.id
		ORDER BY m.muscle_group_id, m.id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	muscles := []entities.Muscle{}
	for rows.Next() {
		m, err := entities.ScanMuscle(rows, true)
		if err != nil {
			return nil, err
		}
		muscles = append(muscles, *m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return muscles, nil
}

