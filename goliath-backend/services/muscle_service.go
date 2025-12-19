package services

import (
	"context"

	"goliath/entities"
	"goliath/repositories"
)

// MuscleService handles business logic for muscle-related operations
type MuscleService struct {
	muscleRepo       *repositories.MuscleRepository
	muscleGroupRepo  *repositories.MuscleGroupRepository
	regionRepo       *repositories.RegionRepository
	exerciseAreaRepo *repositories.ExerciseAreaRepository
}

// NewMuscleService creates a new MuscleService
func NewMuscleService(
	muscleRepo *repositories.MuscleRepository,
	muscleGroupRepo *repositories.MuscleGroupRepository,
	regionRepo *repositories.RegionRepository,
	exerciseAreaRepo *repositories.ExerciseAreaRepository,
) *MuscleService {
	return &MuscleService{
		muscleRepo:       muscleRepo,
		muscleGroupRepo:  muscleGroupRepo,
		regionRepo:       regionRepo,
		exerciseAreaRepo: exerciseAreaRepo,
	}
}

// GetAllMuscles retrieves all muscles with their exercise areas
func (s *MuscleService) GetAllMuscles(ctx context.Context) ([]entities.Muscle, error) {
	// Get all muscles
	muscles, err := s.muscleRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	// Get exercise areas for all muscles
	muscleAreasMap, err := s.exerciseAreaRepo.GetAllForMuscles(ctx)
	if err != nil {
		return nil, err
	}

	// Assign exercise areas to muscles
	for i := range muscles {
		if areas, ok := muscleAreasMap[muscles[i].ID]; ok {
			muscles[i].ExerciseAreas = areas
		} else {
			muscles[i].ExerciseAreas = []string{}
		}
	}

	return muscles, nil
}

// GetAllMuscleGroups retrieves all muscle groups
func (s *MuscleService) GetAllMuscleGroups(ctx context.Context) ([]entities.MuscleGroup, error) {
	return s.muscleGroupRepo.GetAll(ctx)
}

// GetAllRegions retrieves all regions
func (s *MuscleService) GetAllRegions(ctx context.Context) ([]entities.Region, error) {
	return s.regionRepo.GetAll(ctx)
}

// GetAllExerciseAreas retrieves all exercise areas
func (s *MuscleService) GetAllExerciseAreas(ctx context.Context) ([]entities.ExerciseArea, error) {
	return s.exerciseAreaRepo.GetAll(ctx)
}

