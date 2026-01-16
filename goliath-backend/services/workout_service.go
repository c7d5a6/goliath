package services

import (
	"context"
	"fmt"
	"log"

	"goliath/entities"
	"goliath/repositories"
)

// WorkoutService handles business logic for workout-related operations
type WorkoutService struct {
	workoutRepo *repositories.WorkoutRepository
}

// NewWorkoutService creates a new WorkoutService
func NewWorkoutService(workoutRepo *repositories.WorkoutRepository) *WorkoutService {
	return &WorkoutService{
		workoutRepo: workoutRepo,
	}
}

// GetUserWorkouts retrieves all workouts for a user
func (s *WorkoutService) GetUserWorkouts(ctx context.Context, userID int) ([]entities.Workout, error) {
	workouts, err := s.workoutRepo.GetAllForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	return workouts, nil
}

// GetWorkoutByID retrieves a single workout and verifies ownership
func (s *WorkoutService) GetWorkoutByID(ctx context.Context, id int, userID int) (*entities.Workout, error) {
	workout, err := s.workoutRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("workout not found: %w", err)
	}

	// Verify the workout belongs to the user
	if workout.UserID != userID {
		return nil, fmt.Errorf("unauthorized: workout does not belong to user")
	}

	return workout, nil
}

// CreateWorkoutInput represents input for creating a workout
type CreateWorkoutInput struct {
	Name string `json:"name" binding:"required,min=1"`
}

// CreateWorkout creates a new workout for a user
func (s *WorkoutService) CreateWorkout(ctx context.Context, userID int, input CreateWorkoutInput) (int64, error) {
	log.Printf("Service: creating workout %s for user %d", input.Name, userID)
	
	// Create workout
	workoutID, err := s.workoutRepo.Create(ctx, input.Name, userID)
	if err != nil {
		return 0, fmt.Errorf("failed to create workout: %w", err)
	}

	return workoutID, nil
}

// UpdateWorkoutInput represents input for updating a workout
type UpdateWorkoutInput struct {
	Name string `json:"name" binding:"required,min=1"`
}

// UpdateWorkout updates an existing workout with ownership verification
func (s *WorkoutService) UpdateWorkout(ctx context.Context, id int, userID int, input UpdateWorkoutInput) error {
	log.Printf("Service: updating workout %d for user %d", id, userID)
	
	// Check if workout exists and belongs to user
	workout, err := s.workoutRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("workout not found: %w", err)
	}

	// Verify the workout belongs to the user
	if workout.UserID != userID {
		return fmt.Errorf("unauthorized: workout does not belong to user")
	}

	// Update workout
	err = s.workoutRepo.Update(ctx, id, input.Name)
	if err != nil {
		return fmt.Errorf("failed to update workout: %w", err)
	}

	return nil
}

// DeleteWorkout deletes a workout with ownership verification
func (s *WorkoutService) DeleteWorkout(ctx context.Context, id int, userID int) error {
	// Check if workout exists and belongs to user
	workout, err := s.workoutRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("workout not found: %w", err)
	}

	// Verify the workout belongs to the user
	if workout.UserID != userID {
		return fmt.Errorf("unauthorized: workout does not belong to user")
	}

	// Delete workout
	err = s.workoutRepo.Delete(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete workout: %w", err)
	}

	return nil
}
