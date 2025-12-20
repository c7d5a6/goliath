package handlers

import (
	"goliath/services"
	"log"

	"github.com/gin-gonic/gin"
)

// ExerciseHandlers handles HTTP requests for exercise-related endpoints
type ExerciseHandlers struct {
	exerciseService *services.ExerciseService
}

// NewExerciseHandlers creates a new ExerciseHandlers
func NewExerciseHandlers(exerciseService *services.ExerciseService) *ExerciseHandlers {
	return &ExerciseHandlers{
		exerciseService: exerciseService,
	}
}

// GetExercises handles GET /exercises
func (h *ExerciseHandlers) GetExercises(c *gin.Context) {
	ctx := c.Request.Context()

	exercises, err := h.exerciseService.GetAllExercises(ctx)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"exercises": exercises,
		"count":     len(exercises),
	})
}

// GetExerciseTypes handles GET /exercise-types
func (h *ExerciseHandlers) GetExerciseTypes(c *gin.Context) {
	types := h.exerciseService.GetExerciseTypes()
	c.JSON(200, gin.H{
		"types": types,
	})
}

// CreateExercise handles POST /exercises
func (h *ExerciseHandlers) CreateExercise(c *gin.Context) {
	log.Printf("POST excersise create %s", c.Request.Method)
	ctx := c.Request.Context()

	var input services.CreateExerciseInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	log.Printf("2POST excersise create %s", c.Request.Method)
	exerciseID, err := h.exerciseService.CreateExercise(ctx, input)
	log.Printf("3POST excersise create %s", c.Request.Method)
	if err != nil {
		// Check if it's a business logic error (duplicate name, invalid type)
		if err.Error() == "exercise with name '"+input.Name+"' already exists" {
			c.JSON(409, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "invalid exercise type: "+input.Type {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		// Database or other errors
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{
		"id":      exerciseID,
		"message": "Exercise created successfully",
	})
}
