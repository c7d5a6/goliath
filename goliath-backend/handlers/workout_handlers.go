package handlers

import (
	"goliath/middleware"
	"goliath/services"
	"log"
	"strconv"

	"github.com/gin-gonic/gin"
)

// WorkoutHandlers handles HTTP requests for workout-related endpoints
type WorkoutHandlers struct {
	workoutService *services.WorkoutService
}

// NewWorkoutHandlers creates a new WorkoutHandlers
func NewWorkoutHandlers(workoutService *services.WorkoutService) *WorkoutHandlers {
	return &WorkoutHandlers{
		workoutService: workoutService,
	}
}

// GetWorkouts handles GET /workouts - returns workouts for authenticated user
func (h *WorkoutHandlers) GetWorkouts(c *gin.Context) {
	ctx := c.Request.Context()

	// Get user from context (set by authentication middleware)
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	workouts, err := h.workoutService.GetUserWorkouts(ctx, user.ID)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"workouts": workouts,
		"count":    len(workouts),
	})
}

// GetWorkout handles GET /workouts/:id
func (h *WorkoutHandlers) GetWorkout(c *gin.Context) {
	ctx := c.Request.Context()

	// Get user from context
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	// Parse ID from URL
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout ID"})
		return
	}

	workout, err := h.workoutService.GetWorkoutByID(ctx, id, user.ID)
	if err != nil {
		if err.Error() == "unauthorized: workout does not belong to user" {
			c.JSON(403, gin.H{"error": err.Error()})
			return
		}
		c.JSON(404, gin.H{"error": "Workout not found"})
		return
	}

	c.JSON(200, workout)
}

// CreateWorkout handles POST /workouts
func (h *WorkoutHandlers) CreateWorkout(c *gin.Context) {
	log.Printf("POST workout create %s", c.Request.Method)
	ctx := c.Request.Context()

	// Get user from context
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	var input services.CreateWorkoutInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	workoutID, err := h.workoutService.CreateWorkout(ctx, user.ID, input)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{
		"id":      workoutID,
		"message": "Workout created successfully",
	})
}

// UpdateWorkout handles PUT /workouts/:id
func (h *WorkoutHandlers) UpdateWorkout(c *gin.Context) {
	ctx := c.Request.Context()

	// Get user from context
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	// Parse ID from URL
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout ID"})
		return
	}

	var input services.UpdateWorkoutInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	err = h.workoutService.UpdateWorkout(ctx, id, user.ID, input)
	if err != nil {
		if err.Error() == "unauthorized: workout does not belong to user" {
			c.JSON(403, gin.H{"error": err.Error()})
			return
		}
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "Workout updated successfully",
	})
}

// DeleteWorkout handles DELETE /workouts/:id
func (h *WorkoutHandlers) DeleteWorkout(c *gin.Context) {
	ctx := c.Request.Context()

	// Get user from context
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	// Parse ID from URL
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout ID"})
		return
	}

	err = h.workoutService.DeleteWorkout(ctx, id, user.ID)
	if err != nil {
		if err.Error() == "unauthorized: workout does not belong to user" {
			c.JSON(403, gin.H{"error": err.Error()})
			return
		}
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message": "Workout deleted successfully",
	})
}
