package services

import (
	"context"
	"fmt"
	"log"

	"goliath/entities"
	"goliath/repositories"
)

// ExerciseService handles business logic for exercise-related operations
type ExerciseService struct {
	exerciseRepo *repositories.ExerciseRepository
}

// NewExerciseService creates a new ExerciseService
func NewExerciseService(exerciseRepo *repositories.ExerciseRepository) *ExerciseService {
	return &ExerciseService{
		exerciseRepo: exerciseRepo,
	}
}

// GetAllExercises retrieves all exercises with their associated exercise areas
func (s *ExerciseService) GetAllExercises(ctx context.Context) ([]entities.Exercise, error) {
	// Get all exercises
	exercises, err := s.exerciseRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	if len(exercises) == 0 {
		return exercises, nil
	}

	// Get exercise areas for all exercises
	exerciseAreasMap, err := s.exerciseRepo.GetExerciseAreasForAllExercises(ctx)
	if err != nil {
		return nil, err
	}

	// Assign exercise areas to exercises
	for i := range exercises {
		if areas, ok := exerciseAreasMap[exercises[i].ID]; ok {
			exercises[i].ExerciseAreas = areas
		} else {
			exercises[i].ExerciseAreas = []entities.ExerciseAreaSummary{}
		}
	}

	return exercises, nil
}

// GetExerciseByID retrieves a single exercise with its muscles
func (s *ExerciseService) GetExerciseByID(ctx context.Context, id int) (*entities.Exercise, error) {
	// Get exercise
	exercise, err := s.exerciseRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Get muscles for the exercise
	muscles, err := s.exerciseRepo.GetMusclesForExercise(ctx, id)
	if err != nil {
		return nil, err
	}
	exercise.Muscles = muscles

	return exercise, nil
}

// GetExerciseTypes returns all valid exercise types
func (s *ExerciseService) GetExerciseTypes() []string {
	return []string{
		string(entities.ExerciseTypeReps),
		string(entities.ExerciseTypeEccentric),
		string(entities.ExerciseTypeIsometric),
	}
}

// CreateExerciseInput represents input for creating an exercise
type CreateExerciseInput struct {
	Name    string                     `json:"name" binding:"required,min=1"`
	Type    string                     `json:"type" binding:"required"`
	Muscles []repositories.MuscleInput `json:"muscles" binding:"required,min=1,dive"`
}

// CreateExercise creates a new exercise with validation
func (s *ExerciseService) CreateExercise(ctx context.Context, input CreateExerciseInput) (int64, error) {
	log.Printf("Service excersise create %s", input.Name)
	// Validate exercise type
	validType := false
	for _, t := range s.GetExerciseTypes() {
		if input.Type == t {
			validType = true
			break
		}
	}
	if !validType {
		return 0, fmt.Errorf("invalid exercise type: %s", input.Type)
	}

	// Check if exercise name already exists
	exists, err := s.exerciseRepo.ExerciseExists(ctx, input.Name)
	log.Printf("1Service excersise create %s", input.Name)
	if err != nil {
		return 0, fmt.Errorf("failed to check exercise existence: %w", err)
	}
	if exists {
		return 0, fmt.Errorf("exercise with name '%s' already exists", input.Name)
	}

	// Create exercise
	exerciseID, err := s.exerciseRepo.Create(ctx, input.Name, entities.ExerciseType(input.Type), input.Muscles)
	if err != nil {
		return 0, fmt.Errorf("failed to create exercise: %w", err)
	}

	return exerciseID, nil
}

// UpdateExerciseInput represents input for updating an exercise
type UpdateExerciseInput struct {
	Name    string                     `json:"name" binding:"required,min=1"`
	Type    string                     `json:"type" binding:"required"`
	Muscles []repositories.MuscleInput `json:"muscles" binding:"required,min=1,dive"`
}

// UpdateExercise updates an existing exercise with validation
func (s *ExerciseService) UpdateExercise(ctx context.Context, id int, input UpdateExerciseInput) error {
	log.Printf("Service exercise update %s", input.Name)
	
	// Validate exercise type
	validType := false
	for _, t := range s.GetExerciseTypes() {
		if input.Type == t {
			validType = true
			break
		}
	}
	if !validType {
		return fmt.Errorf("invalid exercise type: %s", input.Type)
	}

	// Check if exercise exists
	existingExercise, err := s.exerciseRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("exercise not found: %w", err)
	}

	// Check if new name conflicts with another exercise (if name is being changed)
	if input.Name != existingExercise.Name {
		exists, err := s.exerciseRepo.ExerciseExists(ctx, input.Name)
		if err != nil {
			return fmt.Errorf("failed to check exercise existence: %w", err)
		}
		if exists {
			return fmt.Errorf("exercise with name '%s' already exists", input.Name)
		}
	}

	// Update exercise
	err = s.exerciseRepo.Update(ctx, id, input.Name, entities.ExerciseType(input.Type), input.Muscles)
	if err != nil {
		return fmt.Errorf("failed to update exercise: %w", err)
	}

	return nil
}
