package repositories

import (
	"context"
	"database/sql"

	"goliath/entities"
)

// RegionRepository handles database operations for regions
type RegionRepository struct {
	db *sql.DB
}

// NewRegionRepository creates a new RegionRepository
func NewRegionRepository(db *sql.DB) *RegionRepository {
	return &RegionRepository{db: db}
}

// GetAll retrieves all regions from the database
func (r *RegionRepository) GetAll(ctx context.Context) ([]entities.Region, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT id, version, created_when, created_by, modified_when, modified_by, name 
		FROM region 
		ORDER BY id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	regions := []entities.Region{}
	for rows.Next() {
		region, err := entities.ScanRegion(rows)
		if err != nil {
			return nil, err
		}
		regions = append(regions, *region)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return regions, nil
}

