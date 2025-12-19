package handlers

import (
	"goliath/services"

	"github.com/gin-gonic/gin"
)

// MuscleHandlers handles HTTP requests for muscle-related endpoints
type MuscleHandlers struct {
	muscleService *services.MuscleService
}

// NewMuscleHandlers creates a new MuscleHandlers
func NewMuscleHandlers(muscleService *services.MuscleService) *MuscleHandlers {
	return &MuscleHandlers{
		muscleService: muscleService,
	}
}

// GetMuscles handles GET /muscles
func (h *MuscleHandlers) GetMuscles(c *gin.Context) {
	ctx := c.Request.Context()

	muscles, err := h.muscleService.GetAllMuscles(ctx)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"muscles": muscles,
		"count":   len(muscles),
	})
}

// GetMuscleGroups handles GET /muscle-groups
func (h *MuscleHandlers) GetMuscleGroups(c *gin.Context) {
	ctx := c.Request.Context()

	muscleGroups, err := h.muscleService.GetAllMuscleGroups(ctx)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"muscle_groups": muscleGroups,
		"count":         len(muscleGroups),
	})
}

// GetRegions handles GET /regions
func (h *MuscleHandlers) GetRegions(c *gin.Context) {
	ctx := c.Request.Context()

	regions, err := h.muscleService.GetAllRegions(ctx)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"regions": regions,
		"count":   len(regions),
	})
}

// GetExerciseAreas handles GET /exercise-areas
func (h *MuscleHandlers) GetExerciseAreas(c *gin.Context) {
	ctx := c.Request.Context()

	exerciseAreas, err := h.muscleService.GetAllExerciseAreas(ctx)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"exercise_areas": exerciseAreas,
		"count":          len(exerciseAreas),
	})
}

