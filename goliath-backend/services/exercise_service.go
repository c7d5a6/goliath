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

// GetAllExercises retrieves all exercises with their associated muscles
func (s *ExerciseService) GetAllExercises(ctx context.Context) ([]entities.Exercise, error) {
	// Get all exercises
	exercises, err := s.exerciseRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	if len(exercises) == 0 {
		return exercises, nil
	}

	// Get muscles for all exercises
	exerciseMusclesMap, err := s.exerciseRepo.GetMusclesForAllExercises(ctx)
	if err != nil {
		return nil, err
	}

	// Assign muscles to exercises
	for i := range exercises {
		if muscles, ok := exerciseMusclesMap[exercises[i].ID]; ok {
			exercises[i].Muscles = muscles
		} else {
			exercises[i].Muscles = []entities.ExerciseMuscle{}
		}
	}

	return exercises, nil
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
