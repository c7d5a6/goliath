package main

import (
	"database/sql"
	"time"
)

// BaseEntity contains common fields for all entities
type BaseEntity struct {
	ID           int       `json:"id" db:"id"`
	Version      int       `json:"version" db:"version"`
	CreatedWhen  time.Time `json:"created_when" db:"created_when"`
	CreatedBy    *string   `json:"created_by" db:"created_by"`
	ModifiedWhen time.Time `json:"modified_when" db:"modified_when"`
	ModifiedBy   *string   `json:"modified_by" db:"modified_by"`
}

// Region represents a body region (e.g., Upper Body, Core, Lower Body)
type Region struct {
	BaseEntity
	Name string `json:"name" db:"name"`
}

// MuscleGroup represents a group of muscles within a region
type MuscleGroup struct {
	BaseEntity
	Name         string `json:"name" db:"name"`
	RegionID     int    `json:"region_id" db:"region_id"`
	RegionName   string `json:"region_name,omitempty" db:"region_name"` // For JOIN queries
}

// ExerciseArea represents a type of exercise movement
type ExerciseArea struct {
	BaseEntity
	Name string `json:"name" db:"name"`
}

// Muscle represents a specific muscle in the body
type Muscle struct {
	BaseEntity
	Name            string   `json:"name" db:"name"`
	MuscleGroupID   int      `json:"muscle_group_id" db:"muscle_group_id"`
	MuscleGroupName string   `json:"muscle_group_name,omitempty" db:"muscle_group_name"` // For JOIN queries
	RegionName      string   `json:"region_name,omitempty" db:"region_name"`             // For JOIN queries
	ExerciseAreas   []string `json:"exercise_areas,omitempty"`                           // For many-to-many relationship
}

// MuscleExerciseArea represents the many-to-many relationship between muscles and exercise areas
type MuscleExerciseArea struct {
	MuscleID       int       `json:"muscle_id" db:"muscle_id"`
	ExerciseAreaID int       `json:"exercise_area_id" db:"exercise_area_id"`
	CreatedWhen    time.Time `json:"created_when" db:"created_when"`
	CreatedBy      *string   `json:"created_by" db:"created_by"`
}

// ExerciseType represents the type of exercise
type ExerciseType string

const (
	ExerciseTypeReps      ExerciseType = "Reps"
	ExerciseTypeEccentric ExerciseType = "Eccentric"
	ExerciseTypeIsometric ExerciseType = "Isometric"
)

// Exercise represents a specific exercise
type Exercise struct {
	BaseEntity
	Name    string            `json:"name" db:"name"`
	Type    ExerciseType      `json:"type" db:"type"`
	Muscles []ExerciseMuscle  `json:"muscles,omitempty"` // For many-to-many relationship with percentages
}

// ExerciseMuscle represents the many-to-many relationship between exercises and muscles with percentage
type ExerciseMuscle struct {
	ExerciseID  int       `json:"exercise_id" db:"exercise_id"`
	MuscleID    int       `json:"muscle_id" db:"muscle_id"`
	MuscleName  string    `json:"muscle_name,omitempty" db:"muscle_name"` // For JOIN queries
	Percentage  float64   `json:"percentage" db:"percentage"`
	CreatedWhen time.Time `json:"created_when" db:"created_when"`
	CreatedBy   *string   `json:"created_by" db:"created_by"`
}

// ScanBaseEntity is a helper to scan common fields from database rows
func ScanBaseEntity(row interface {
	Scan(dest ...interface{}) error
}, be *BaseEntity) error {
	var createdWhen, modifiedWhen string
	err := row.Scan(
		&be.ID,
		&be.Version,
		&createdWhen,
		&be.CreatedBy,
		&modifiedWhen,
		&be.ModifiedBy,
	)
	if err != nil {
		return err
	}

	// Parse timestamps
	be.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
	be.ModifiedWhen, _ = time.Parse("2006-01-02 15:04:05", modifiedWhen)
	return nil
}

// ScanRegion scans a Region from a database row
func ScanRegion(rows *sql.Rows) (*Region, error) {
	var r Region
	var createdWhen, modifiedWhen string
	err := rows.Scan(
		&r.ID,
		&r.Version,
		&createdWhen,
		&r.CreatedBy,
		&modifiedWhen,
		&r.ModifiedBy,
		&r.Name,
	)
	if err != nil {
		return nil, err
	}

	r.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
	r.ModifiedWhen, _ = time.Parse("2006-01-02 15:04:05", modifiedWhen)
	return &r, nil
}

// ScanMuscleGroup scans a MuscleGroup from a database row (with optional region join)
func ScanMuscleGroup(rows *sql.Rows, includeRegion bool) (*MuscleGroup, error) {
	var mg MuscleGroup
	var createdWhen, modifiedWhen string

	if includeRegion {
		err := rows.Scan(
			&mg.ID,
			&mg.Version,
			&createdWhen,
			&mg.CreatedBy,
			&modifiedWhen,
			&mg.ModifiedBy,
			&mg.Name,
			&mg.RegionID,
			&mg.RegionName,
		)
		if err != nil {
			return nil, err
		}
	} else {
		err := rows.Scan(
			&mg.ID,
			&mg.Version,
			&createdWhen,
			&mg.CreatedBy,
			&modifiedWhen,
			&mg.ModifiedBy,
			&mg.Name,
			&mg.RegionID,
		)
		if err != nil {
			return nil, err
		}
	}

	mg.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
	mg.ModifiedWhen, _ = time.Parse("2006-01-02 15:04:05", modifiedWhen)
	return &mg, nil
}

// ScanExerciseArea scans an ExerciseArea from a database row
func ScanExerciseArea(rows *sql.Rows) (*ExerciseArea, error) {
	var ea ExerciseArea
	var createdWhen, modifiedWhen string
	err := rows.Scan(
		&ea.ID,
		&ea.Version,
		&createdWhen,
		&ea.CreatedBy,
		&modifiedWhen,
		&ea.ModifiedBy,
		&ea.Name,
	)
	if err != nil {
		return nil, err
	}

	ea.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
	ea.ModifiedWhen, _ = time.Parse("2006-01-02 15:04:05", modifiedWhen)
	return &ea, nil
}

// ScanMuscle scans a Muscle from a database row (with optional joins)
func ScanMuscle(rows *sql.Rows, includeJoins bool) (*Muscle, error) {
	var m Muscle
	var createdWhen, modifiedWhen string

	if includeJoins {
		err := rows.Scan(
			&m.ID,
			&m.Version,
			&createdWhen,
			&m.CreatedBy,
			&modifiedWhen,
			&m.ModifiedBy,
			&m.Name,
			&m.MuscleGroupID,
			&m.MuscleGroupName,
		)
		if err != nil {
			return nil, err
		}
	} else {
		err := rows.Scan(
			&m.ID,
			&m.Version,
			&createdWhen,
			&m.CreatedBy,
			&modifiedWhen,
			&m.ModifiedBy,
			&m.Name,
			&m.MuscleGroupID,
		)
		if err != nil {
			return nil, err
		}
	}

	m.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
	m.ModifiedWhen, _ = time.Parse("2006-01-02 15:04:05", modifiedWhen)
	m.ExerciseAreas = []string{}
	return &m, nil
}

// ScanExercise scans an Exercise from a database row
func ScanExercise(rows *sql.Rows) (*Exercise, error) {
	var e Exercise
	var createdWhen, modifiedWhen string
	var exerciseType string
	err := rows.Scan(
		&e.ID,
		&e.Version,
		&createdWhen,
		&e.CreatedBy,
		&modifiedWhen,
		&e.ModifiedBy,
		&e.Name,
		&exerciseType,
	)
	if err != nil {
		return nil, err
	}

	e.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
	e.ModifiedWhen, _ = time.Parse("2006-01-02 15:04:05", modifiedWhen)
	e.Type = ExerciseType(exerciseType)
	e.Muscles = []ExerciseMuscle{}
	return &e, nil
}

