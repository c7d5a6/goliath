package services

import (
	"context"
	"fmt"
	"log"

	"goliath/entities"
	"goliath/repositories"
)

// ExerciseLogService handles business logic for exercise log-related operations
type ExerciseLogService struct {
	exerciseLogRepo *repositories.ExerciseLogRepository
}

// NewExerciseLogService creates a new ExerciseLogService
func NewExerciseLogService(exerciseLogRepo *repositories.ExerciseLogRepository) *ExerciseLogService {
	return &ExerciseLogService{
		exerciseLogRepo: exerciseLogRepo,
	}
}

// GetAllLogs retrieves all exercise logs for a specific user with pagination
func (s *ExerciseLogService) GetAllLogs(ctx context.Context, userID int, limit int, offset int) ([]entities.ExerciseLog, error) {
	if limit <= 0 {
		limit = 50
	}
	logs, err := s.exerciseLogRepo.GetAll(ctx, userID, limit, offset)
	if err != nil {
		return nil, err
	}
	return logs, nil
}

// GetLogsByExerciseID retrieves all logs for a specific exercise for a specific user
func (s *ExerciseLogService) GetLogsByExerciseID(ctx context.Context, userID int, exerciseID int, limit int, offset int) ([]entities.ExerciseLog, error) {
	if limit <= 0 {
		limit = 50
	}
	logs, err := s.exerciseLogRepo.GetByExerciseID(ctx, userID, exerciseID, limit, offset)
	if err != nil {
		return nil, err
	}
	return logs, nil
}

// GetLogsByWorkoutID retrieves all logs associated with a workout for a specific user
func (s *ExerciseLogService) GetLogsByWorkoutID(ctx context.Context, userID int, workoutID int, limit int, offset int) ([]entities.ExerciseLog, error) {
	if limit <= 0 {
		limit = 50
	}
	logs, err := s.exerciseLogRepo.GetByWorkoutID(ctx, userID, workoutID, limit, offset)
	if err != nil {
		return nil, err
	}
	return logs, nil
}

// GetLatestLogsByWorkout retrieves the latest log per unique exercise for a workout
func (s *ExerciseLogService) GetLatestLogsByWorkout(ctx context.Context, userID int, workoutID int) ([]entities.ExerciseLog, error) {
	logs, err := s.exerciseLogRepo.GetLatestByWorkoutExercises(ctx, userID, workoutID)
	if err != nil {
		return nil, err
	}
	return logs, nil
}

// GetLogByID retrieves a single exercise log by ID for a specific user
func (s *ExerciseLogService) GetLogByID(ctx context.Context, id int, userID int) (*entities.ExerciseLog, error) {
	logEntry, err := s.exerciseLogRepo.GetByID(ctx, id, userID)
	if err != nil {
		return nil, fmt.Errorf("exercise log not found: %w", err)
	}
	return logEntry, nil
}

// CreateExerciseLogInput represents input for creating an exercise log
type CreateExerciseLogInput struct {
	WorkoutID   *int     `json:"workout_id,omitempty"`
	ExerciseID  int      `json:"exercise_id" binding:"required"`
	Position    int      `json:"position"`
	Sets        *int     `json:"sets,omitempty"`
	Reps        *int     `json:"reps,omitempty"`
	TimeSeconds *int     `json:"time_seconds,omitempty"`
	Weight      *float64 `json:"weight,omitempty"`
	RestSeconds *int     `json:"rest_seconds,omitempty"`
	Notes       *string  `json:"notes,omitempty"`
}

// CreateExerciseLog creates a new exercise log for a specific user
func (s *ExerciseLogService) CreateExerciseLog(ctx context.Context, userID int, input CreateExerciseLogInput) (int64, error) {
	log.Printf("Service: creating exercise log for exercise %d, user %d", input.ExerciseID, userID)
	
	// Create exercise log
	logID, err := s.exerciseLogRepo.Create(ctx, userID, input.WorkoutID, input.ExerciseID, input.Position, input.Sets, input.Reps, input.TimeSeconds, input.Weight, input.RestSeconds, input.Notes)
	if err != nil {
		return 0, fmt.Errorf("failed to create exercise log: %w", err)
	}

	return logID, nil
}

// UpdateExerciseLogInput represents input for updating an exercise log
type UpdateExerciseLogInput struct {
	Sets        *int     `json:"sets,omitempty"`
	Reps        *int     `json:"reps,omitempty"`
	TimeSeconds *int     `json:"time_seconds,omitempty"`
	Weight      *float64 `json:"weight,omitempty"`
	RestSeconds *int     `json:"rest_seconds,omitempty"`
	Notes       *string  `json:"notes,omitempty"`
}

// UpdateExerciseLog updates an existing exercise log with user authorization
func (s *ExerciseLogService) UpdateExerciseLog(ctx context.Context, id int, userID int, input UpdateExerciseLogInput) error {
	log.Printf("Service: updating exercise log %d for user %d", id, userID)
	
	// Check if log exists and belongs to user
	logEntry, err := s.exerciseLogRepo.GetByID(ctx, id, userID)
	if err != nil {
		return fmt.Errorf("exercise log not found: %w", err)
	}
	
	// Verify ownership
	if logEntry.UserID != userID {
		return fmt.Errorf("unauthorized: exercise log does not belong to user")
	}

	// Update log
	err = s.exerciseLogRepo.Update(ctx, id, input.Sets, input.Reps, input.TimeSeconds, input.Weight, input.RestSeconds, input.Notes)
	if err != nil {
		return fmt.Errorf("failed to update exercise log: %w", err)
	}

	return nil
}

// DeleteExerciseLog deletes an exercise log with user authorization
func (s *ExerciseLogService) DeleteExerciseLog(ctx context.Context, id int, userID int) error {
	// Check if log exists and belongs to user
	logEntry, err := s.exerciseLogRepo.GetByID(ctx, id, userID)
	if err != nil {
		return fmt.Errorf("exercise log not found: %w", err)
	}
	
	// Verify ownership
	if logEntry.UserID != userID {
		return fmt.Errorf("unauthorized: exercise log does not belong to user")
	}

	// Delete log
	err = s.exerciseLogRepo.Delete(ctx, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete exercise log: %w", err)
	}

	return nil
}
