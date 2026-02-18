package handlers

import (
	"database/sql"
	"fmt"
	"goliath/middleware"
	"goliath/services"
	"log"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// ExerciseLogHandlers handles HTTP requests for exercise log-related endpoints
type ExerciseLogHandlers struct {
	exerciseLogService *services.ExerciseLogService
	db                 *sql.DB
}

// NewExerciseLogHandlers creates a new ExerciseLogHandlers
func NewExerciseLogHandlers(exerciseLogService *services.ExerciseLogService, db *sql.DB) *ExerciseLogHandlers {
	return &ExerciseLogHandlers{
		exerciseLogService: exerciseLogService,
		db:                 db,
	}
}

// GetExerciseLogs handles GET /exercise-logs - returns all exercise logs for authenticated user with pagination
func (h *ExerciseLogHandlers) GetExerciseLogs(c *gin.Context) {
	ctx := c.Request.Context()

	// Get user from context (set by authentication middleware)
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	logs, err := h.exerciseLogService.GetAllLogs(ctx, user.ID, limit, offset)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"exercise_logs": logs,
		"count":         len(logs),
	})
}

// GetExerciseLogsByExercise handles GET /exercises/:id/logs
func (h *ExerciseLogHandlers) GetExerciseLogsByExercise(c *gin.Context) {
	ctx := c.Request.Context()

	// Get user from context
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	// Parse exercise ID from URL
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid exercise ID"})
		return
	}

	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	logs, err := h.exerciseLogService.GetLogsByExerciseID(ctx, user.ID, id, limit, offset)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"exercise_logs": logs,
		"count":         len(logs),
	})
}

// GetExerciseLogsByWorkout handles GET /workouts/:id/logs
func (h *ExerciseLogHandlers) GetExerciseLogsByWorkout(c *gin.Context) {
	ctx := c.Request.Context()

	// Get user from context
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	// Parse workout ID from URL
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout ID"})
		return
	}

	// Parse pagination parameters
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	logs, err := h.exerciseLogService.GetLogsByWorkoutID(ctx, user.ID, id, limit, offset)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"exercise_logs": logs,
		"count":         len(logs),
	})
}

// GetLatestLogsByWorkout handles GET /workouts/:id/latest-logs
func (h *ExerciseLogHandlers) GetLatestLogsByWorkout(c *gin.Context) {
	ctx := c.Request.Context()

	// Get user from context
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	// Parse workout ID from URL
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout ID"})
		return
	}

	logs, err := h.exerciseLogService.GetLatestLogsByWorkout(ctx, user.ID, id)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"exercise_logs": logs,
		"count":         len(logs),
	})
}

// GetExerciseLog handles GET /exercise-logs/:id
func (h *ExerciseLogHandlers) GetExerciseLog(c *gin.Context) {
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
		c.JSON(400, gin.H{"error": "Invalid exercise log ID"})
		return
	}

	exerciseLog, err := h.exerciseLogService.GetLogByID(ctx, id, user.ID)
	if err != nil {
		c.JSON(404, gin.H{"error": "Exercise log not found"})
		return
	}

	c.JSON(200, exerciseLog)
}

// CreateExerciseLog handles POST /exercise-logs
func (h *ExerciseLogHandlers) CreateExerciseLog(c *gin.Context) {
	log.Printf("POST exercise log create %s", c.Request.Method)
	ctx := c.Request.Context()

	// Get user from context
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	var input services.CreateExerciseLogInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	logID, err := h.exerciseLogService.CreateExerciseLog(ctx, user.ID, input)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(201, gin.H{
		"id":      logID,
		"message": "Exercise log created successfully",
	})
}

// UpdateExerciseLog handles PUT /exercise-logs/:id
func (h *ExerciseLogHandlers) UpdateExerciseLog(c *gin.Context) {
	log.Printf("PUT exercise log update %s", c.Request.Method)
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
		c.JSON(400, gin.H{"error": "Invalid exercise log ID"})
		return
	}

	var input services.UpdateExerciseLogInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	err = h.exerciseLogService.UpdateExerciseLog(ctx, id, user.ID, input)
	if err != nil {
		if err.Error() == "exercise log not found" {
			c.JSON(404, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "unauthorized: exercise log does not belong to user" {
			c.JSON(403, gin.H{"error": err.Error()})
			return
		}
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Exercise log updated successfully"})
}

// GetWorkoutIntensity handles GET /workouts/:id/intensity
func (h *ExerciseLogHandlers) GetWorkoutIntensity(c *gin.Context) {
	ctx := c.Request.Context()

	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	workoutIDStr := c.Param("id")
	workoutID, err := strconv.Atoi(workoutIDStr)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid workout ID"})
		return
	}

	log.Printf("=== Handler: Starting intensity calculation for workout %d, user %d ===", workoutID, user.ID)

	// Get the DB executor (transaction if available, otherwise raw DB)
	dbExecutor := middleware.GetDBFromContext(ctx, h.db)
	
	result, err := h.exerciseLogService.GetWorkoutIntensityData(ctx, user.ID, workoutID, dbExecutor)
	if err != nil {
		log.Printf("Error calculating intensity: %v", err)
		c.JSON(500, gin.H{"error": "Failed to calculate intensity"})
		return
	}

	c.JSON(200, result)
}

// DeleteExerciseLog handles DELETE /exercise-logs/:id
func (h *ExerciseLogHandlers) DeleteExerciseLog(c *gin.Context) {
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
		c.JSON(400, gin.H{"error": "Invalid exercise log ID"})
		return
	}

	err = h.exerciseLogService.DeleteExerciseLog(ctx, id, user.ID)
	if err != nil {
		if err.Error() == "exercise log not found" {
			c.JSON(404, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "unauthorized: exercise log does not belong to user" {
			c.JSON(403, gin.H{"error": err.Error()})
			return
		}
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Exercise log deleted successfully"})
}

// GetCalendarYear handles GET /exercise-logs/calendar/year?year=2026
func (h *ExerciseLogHandlers) GetCalendarYear(c *gin.Context) {
	ctx := c.Request.Context()
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	year := c.DefaultQuery("year", strconv.Itoa(time.Now().Year()))

	days, err := h.exerciseLogService.GetCalendarYear(ctx, user.ID, year)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	yearInt, _ := strconv.Atoi(year)
	c.JSON(200, gin.H{
		"year": yearInt,
		"days": days,
	})
}

// GetCalendarMonth handles GET /exercise-logs/calendar/month?year=2026&month=2
func (h *ExerciseLogHandlers) GetCalendarMonth(c *gin.Context) {
	ctx := c.Request.Context()
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	now := time.Now()
	year := c.DefaultQuery("year", strconv.Itoa(now.Year()))
	month := c.DefaultQuery("month", strconv.Itoa(int(now.Month())))

	// Zero-pad month for strftime comparison
	monthInt, _ := strconv.Atoi(month)
	monthPadded := fmt.Sprintf("%02d", monthInt)

	days, err := h.exerciseLogService.GetCalendarMonth(ctx, user.ID, year, monthPadded)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	yearInt, _ := strconv.Atoi(year)
	c.JSON(200, gin.H{
		"year":  yearInt,
		"month": monthInt,
		"days":  days,
	})
}

// GetCalendarWeek handles GET /exercise-logs/calendar/week?start=2026-02-09&end=2026-02-15
func (h *ExerciseLogHandlers) GetCalendarWeek(c *gin.Context) {
	ctx := c.Request.Context()
	user, hasUser := middleware.GetUserFromContext(ctx)
	if !hasUser {
		c.JSON(401, gin.H{"error": "Authentication required"})
		return
	}

	// Default to current week (Monday to Sunday)
	now := time.Now()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	monday := now.AddDate(0, 0, -(weekday - 1))
	sunday := monday.AddDate(0, 0, 6)

	startDate := c.DefaultQuery("start", monday.Format("2006-01-02"))
	endDate := c.DefaultQuery("end", sunday.Format("2006-01-02"))

	days, err := h.exerciseLogService.GetCalendarWeek(ctx, user.ID, startDate, endDate)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"start_date": startDate,
		"end_date":   endDate,
		"days":       days,
	})
}
