package services

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"strconv"

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

// GetWorkoutIntensityData calculates intensity data for a workout
func (s *ExerciseLogService) GetWorkoutIntensityData(ctx context.Context, userID int, workoutID int, db interface {
	QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row
}) (map[string]interface{}, error) {
	log.Printf("=== Service: Starting intensity calculation for workout %d, user %d ===", workoutID, userID)
	
	// Query 1: Get all exercise IDs from both workout definition and logs
	exerciseIDsQuery := `
		SELECT DISTINCT exercise_id FROM workout_exercise WHERE workout_id = ?
		UNION
		SELECT DISTINCT exercise_id FROM exercise_log WHERE workout_id = ? AND user_id = ?
	`
	
	log.Printf("Query 1: Getting exercise IDs")
	log.Printf("SQL: %s", exerciseIDsQuery)
	log.Printf("Params: workoutID=%d, workoutID=%d, userID=%d", workoutID, workoutID, userID)
	rows, err := db.QueryContext(ctx, exerciseIDsQuery, workoutID, workoutID, userID)
	if err != nil {
		log.Printf("ERROR querying exercise IDs: %v", err)
		return nil, err
	}
	defer rows.Close()

	type Exercise struct {
		ID          int
		Type        string
		WorkoutReps int
		WorkoutTime int
		MaxReps     int
		MaxTime     int
		Areas       []int
	}

	// Helper: does this exercise type use time for intensity (like isometric)?
	usesTimeIntensity := func(exType string) bool {
		return exType == string(entities.ExerciseTypeIsometric) ||
			exType == string(entities.ExerciseTypeIsometricWeighted) ||
			exType == string(entities.ExerciseTypeTimedReps) ||
			exType == string(entities.ExerciseTypeTimedRepsWeighted)
	}

	exercises := make(map[int]*Exercise)
	var exerciseIDs []int

	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			log.Printf("ERROR scanning row: %v", err)
			continue
		}
		exercises[id] = &Exercise{ID: id}
		exerciseIDs = append(exerciseIDs, id)
	}
	
	log.Printf("Query 1 Results: Found %d exercise IDs: %v", len(exerciseIDs), exerciseIDs)

	if err := rows.Err(); err != nil {
		log.Printf("ERROR after scanning rows: %v", err)
		return nil, err
	}

	log.Printf("Total unique exercises found: %d", len(exerciseIDs))

	// Query 1b: Get exercise types
	log.Printf("Query 1b: Fetching exercise types...")
	typeQuery := "SELECT type FROM exercise WHERE id = ?"
	for _, exID := range exerciseIDs {
		var exType string
		err := db.QueryRowContext(ctx, typeQuery, exID).Scan(&exType)
		if err == nil {
			exercises[exID].Type = exType
			log.Printf("  Exercise %d -> type: %s", exID, exType)
		} else {
			log.Printf("  Exercise %d -> type lookup error: %v", exID, err)
		}
	}

	// Query 2: Get workout configuration (for "workout" column)
	log.Printf("Query 2: Fetching workout configuration for each exercise...")
	configQuery := "SELECT COALESCE(reps, 0), COALESCE(time_seconds, 0) FROM workout_exercise WHERE workout_id = ? AND exercise_id = ?"
	for _, exID := range exerciseIDs {
		var reps, time int
		log.Printf("  Querying config for exercise %d (workoutID=%d, exerciseID=%d)", exID, workoutID, exID)
		err := db.QueryRowContext(ctx, configQuery, workoutID, exID).Scan(&reps, &time)
		if err == nil {
			exercises[exID].WorkoutReps = reps
			exercises[exID].WorkoutTime = time
			log.Printf("  -> Found: reps=%d, time=%d", reps, time)
		} else {
			log.Printf("  -> Not found (error: %v) - exercise only in logs", err)
		}
	}
	log.Printf("Query 2 Complete")

	log.Printf("Total exercises found: %d", len(exerciseIDs))

	if len(exerciseIDs) == 0 {
		log.Printf("No exercises found for this workout")
		return map[string]interface{}{"areas": []interface{}{}}, nil
	}

	// Query 3: Get max values for each exercise
	log.Printf("Query 3: Fetching max logged values for each exercise...")
	maxQuery := `SELECT MAX(COALESCE(reps, 0)), MAX(COALESCE(time_seconds, 0)) FROM exercise_log WHERE user_id = ? AND exercise_id = ?`
	for _, exID := range exerciseIDs {
		var maxReps, maxTime int
		log.Printf("  Querying max for exercise %d (userID=%d, exerciseID=%d)", exID, userID, exID)
		err := db.QueryRowContext(ctx, maxQuery, userID, exID).Scan(&maxReps, &maxTime)
		if err != nil {
			log.Printf("  -> Error: %v (exercise might not be logged yet)", err)
			// Not a fatal error - exercise might not be logged yet
			continue
		}
		exercises[exID].MaxReps = maxReps
		exercises[exID].MaxTime = maxTime
		log.Printf("  -> Found: max_reps=%d, max_time=%d", maxReps, maxTime)
	}
	log.Printf("Query 3 Complete")

	// Query 4: Get exercise areas for all exercises in one query
	log.Printf("Query 4: Fetching exercise areas for all exercises...")
	
	// Build placeholders for IN clause
	placeholders := ""
	args := make([]interface{}, len(exerciseIDs))
	for i, id := range exerciseIDs {
		if i > 0 {
			placeholders += ","
		}
		placeholders += "?"
		args[i] = id
	}
	
	areaQuery := `
		SELECT DISTINCT em.exercise_id, ea.id
		FROM exercise_muscle em
		JOIN muscle_exercise_area mea ON em.muscle_id = mea.muscle_id
		JOIN exercise_area ea ON mea.exercise_area_id = ea.id
		WHERE em.exercise_id IN (` + placeholders + `)
	`
	
	log.Printf("  Query: %s", areaQuery)
	log.Printf("  Exercise IDs: %v", exerciseIDs)
	
	areaRows, err := db.QueryContext(ctx, areaQuery, args...)
	if err != nil {
		log.Printf("  -> Error: %v", err)
	} else {
		defer areaRows.Close()
		for areaRows.Next() {
			var exerciseID, areaID int
			if err := areaRows.Scan(&exerciseID, &areaID); err == nil {
				exercises[exerciseID].Areas = append(exercises[exerciseID].Areas, areaID)
			}
		}
		
		// Log results
		for _, exID := range exerciseIDs {
			log.Printf("  Exercise %d -> %d areas: %v", exID, len(exercises[exID].Areas), exercises[exID].Areas)
		}
	}
	log.Printf("Query 4 Complete")

	// Query 5: Get weekly logged data
	log.Printf("Query 5: Fetching weekly logged data (past 5 weeks)...")
	weeklyData := make(map[int]map[int][]float64)
	weekQuery := `
		SELECT 
			CAST((julianday('now') - julianday(logged_when)) / 7 AS INTEGER) as week_offset,
			COALESCE(reps, 0),
			COALESCE(time_seconds, 0)
		FROM exercise_log
		WHERE user_id = ? AND exercise_id = ?
			AND julianday('now') - julianday(logged_when) <= 35
	`

	for _, exID := range exerciseIDs {
		log.Printf("  Querying weekly logs for exercise %d (userID=%d, exerciseID=%d)", exID, userID, exID)
		weekRows, err := db.QueryContext(ctx, weekQuery, userID, exID)
		if err != nil {
			log.Printf("  -> Error: %v", err)
			continue
		}

		if weeklyData[exID] == nil {
			weeklyData[exID] = make(map[int][]float64)
		}

		logCount := 0
		weekCounts := make(map[int]int)
		for weekRows.Next() {
			var weekOffset, reps, time int
			if err := weekRows.Scan(&weekOffset, &reps, &time); err != nil {
				log.Printf("  -> Scan error: %v", err)
				continue
			}
			if weekOffset > 4 {
				continue
			}

			ex := exercises[exID]
			var intensity float64
			if usesTimeIntensity(ex.Type) {
				// Time-based types: use time for intensity
				if ex.MaxTime > 0 && time > 0 {
					intensity = float64(time) / float64(ex.MaxTime) * 100
				}
			} else {
				// Reps-based types: use reps for intensity
				if ex.MaxReps > 0 && reps > 0 {
					intensity = float64(reps) / float64(ex.MaxReps) * 100
				}
			}

			weeklyData[exID][weekOffset] = append(weeklyData[exID][weekOffset], intensity)
			weekCounts[weekOffset]++
			logCount++
			log.Printf("    Week %d: reps=%d, time=%d, intensity=%.1f%%", weekOffset, reps, time, intensity)
		}
		weekRows.Close()
		log.Printf("  -> Found %d logs across weeks: %v", logCount, weekCounts)
	}
	log.Printf("Query 5 Complete")

	// Get area names
	log.Printf("Query 6: Getting area names...")
	areaNames := make(map[int]string)
	for _, ex := range exercises {
		for _, areaID := range ex.Areas {
			if _, exists := areaNames[areaID]; !exists {
				var name string
				log.Printf("  Querying area name for id=%d", areaID)
				err := db.QueryRowContext(ctx, "SELECT name FROM exercise_area WHERE id = ?", areaID).Scan(&name)
				if err != nil {
					log.Printf("  -> Error: %v", err)
					continue
				}
				areaNames[areaID] = name
				log.Printf("  -> Found: %s", name)
			}
		}
	}
	log.Printf("Query 6 Complete: Found %d areas total", len(areaNames))

	// Calculate intensities by area
	log.Printf("=== Calculating intensity aggregations by area ===")
	type AreaData struct {
		AreaID   int                `json:"area_id"`
		AreaName string             `json:"area_name"`
		Weeks    map[string]float64 `json:"weeks"`
	}

	areasMap := make(map[int]*AreaData)

	for areaID, areaName := range areaNames {
		log.Printf("Processing area: %s (id=%d)", areaName, areaID)
		areasMap[areaID] = &AreaData{
			AreaID:   areaID,
			AreaName: areaName,
			Weeks:    make(map[string]float64),
		}

		// Calculate for each week
		for week := 0; week <= 4; week++ {
			var sum float64
			var count int

			for _, ex := range exercises {
				hasArea := false
				for _, a := range ex.Areas {
					if a == areaID {
						hasArea = true
						break
					}
				}
				if !hasArea {
					continue
				}

				if values, ok := weeklyData[ex.ID][week]; ok && len(values) > 0 {
					var weekSum float64
					for _, v := range values {
						weekSum += v
					}
					avgIntensity := weekSum / float64(len(values))
					sum += avgIntensity
					count++
					log.Printf("  Week %d, exercise %d: %d logs, avg=%.1f%%", week, ex.ID, len(values), avgIntensity)
				}
			}

			if count > 0 {
				weekIntensity := sum / float64(count)
				areasMap[areaID].Weeks["week_"+strconv.Itoa(week)] = weekIntensity
				log.Printf("  Week %d total: %.1f%% (from %d exercises)", week, weekIntensity, count)
			} else {
				log.Printf("  Week %d: no data", week)
			}
		}

		// Calculate workout intensity
		var sum float64
		var count int
		log.Printf("  Calculating workout intensity...")
		for _, ex := range exercises {
			hasArea := false
			for _, a := range ex.Areas {
				if a == areaID {
					hasArea = true
					break
				}
			}
			if !hasArea {
				continue
			}

			var intensity float64
			if usesTimeIntensity(ex.Type) {
				// Time-based types: use time for intensity
				if ex.MaxTime > 0 && ex.WorkoutTime > 0 {
					intensity = float64(ex.WorkoutTime) / float64(ex.MaxTime) * 100
					log.Printf("    Exercise %d (time-based): workout_time=%d, max_time=%d, intensity=%.1f%%", ex.ID, ex.WorkoutTime, ex.MaxTime, intensity)
				} else {
					log.Printf("    Exercise %d (time-based): no workout time config or max values", ex.ID)
				}
			} else {
				// Reps-based types: use reps for intensity
				if ex.MaxReps > 0 && ex.WorkoutReps > 0 {
					intensity = float64(ex.WorkoutReps) / float64(ex.MaxReps) * 100
					log.Printf("    Exercise %d (reps-based): workout_reps=%d, max_reps=%d, intensity=%.1f%%", ex.ID, ex.WorkoutReps, ex.MaxReps, intensity)
				} else {
					log.Printf("    Exercise %d (reps-based): no workout reps config or max values", ex.ID)
				}
			}

			if intensity > 0 {
				sum += intensity
				count++
			}
		}

		if count > 0 {
			workoutIntensity := sum / float64(count)
			areasMap[areaID].Weeks["workout"] = workoutIntensity
			log.Printf("  Workout total: %.1f%% (from %d exercises)", workoutIntensity, count)
		} else {
			log.Printf("  Workout: no data")
		}

		log.Printf("Area %s final data: %+v", areaName, areasMap[areaID].Weeks)
	}

	areas := make([]*AreaData, 0, len(areasMap))
	for _, area := range areasMap {
		areas = append(areas, area)
	}

	log.Printf("=== Calculation complete: returning %d areas ===", len(areas))
	return map[string]interface{}{"areas": areas}, nil
}

// --- Calendar view types and methods ---

// CalendarYearDay represents a day in the year calendar view
type CalendarYearDay struct {
	Date       string `json:"date"`
	WorkoutIDs []int  `json:"workout_ids"`
}

// CalendarMonthWorkout represents a workout group in the month calendar view
type CalendarMonthWorkout struct {
	WorkoutID     int    `json:"workout_id"`
	WorkoutName   string `json:"workout_name"`
	ExerciseCount int    `json:"exercise_count"`
}

// CalendarMonthDay represents a day in the month calendar view
type CalendarMonthDay struct {
	Date       string                 `json:"date"`
	WorkoutIDs []int                  `json:"workout_ids"`
	Workouts   []CalendarMonthWorkout `json:"workouts"`
}

// CalendarWeekExercise represents an exercise in the week calendar view
type CalendarWeekExercise struct {
	ExerciseName string   `json:"exercise_name"`
	ExerciseType string   `json:"exercise_type"`
	Sets         *int     `json:"sets,omitempty"`
	Reps         *int     `json:"reps,omitempty"`
	TimeSeconds  *int     `json:"time_seconds,omitempty"`
	Weight       *float64 `json:"weight,omitempty"`
	RestSeconds  *int     `json:"rest_seconds,omitempty"`
}

// CalendarWeekWorkout represents a workout group in the week calendar view
type CalendarWeekWorkout struct {
	WorkoutID   int                    `json:"workout_id"`
	WorkoutName string                 `json:"workout_name"`
	Exercises   []CalendarWeekExercise `json:"exercises"`
}

// CalendarWeekDay represents a day in the week calendar view
type CalendarWeekDay struct {
	Date       string                `json:"date"`
	WorkoutIDs []int                 `json:"workout_ids"`
	Workouts   []CalendarWeekWorkout `json:"workouts"`
}

// GetCalendarYear returns year calendar data grouped by date
func (s *ExerciseLogService) GetCalendarYear(ctx context.Context, userID int, year string) ([]CalendarYearDay, error) {
	entries, err := s.exerciseLogRepo.GetCalendarYearData(ctx, userID, year)
	if err != nil {
		return nil, err
	}

	dayMap := make(map[string]*CalendarYearDay)
	var order []string

	for _, e := range entries {
		if _, exists := dayMap[e.Date]; !exists {
			dayMap[e.Date] = &CalendarYearDay{Date: e.Date}
			order = append(order, e.Date)
		}
		wid := 0
		if e.WorkoutID != nil {
			wid = *e.WorkoutID
		}
		dayMap[e.Date].WorkoutIDs = append(dayMap[e.Date].WorkoutIDs, wid)
	}

	result := make([]CalendarYearDay, 0, len(order))
	for _, date := range order {
		result = append(result, *dayMap[date])
	}
	return result, nil
}

// GetCalendarMonth returns month calendar data grouped by date with workout summaries
func (s *ExerciseLogService) GetCalendarMonth(ctx context.Context, userID int, year, month string) ([]CalendarMonthDay, error) {
	entries, err := s.exerciseLogRepo.GetCalendarMonthData(ctx, userID, year, month)
	if err != nil {
		return nil, err
	}

	dayMap := make(map[string]*CalendarMonthDay)
	var order []string

	for _, e := range entries {
		if _, exists := dayMap[e.Date]; !exists {
			dayMap[e.Date] = &CalendarMonthDay{Date: e.Date}
			order = append(order, e.Date)
		}
		wid := 0
		if e.WorkoutID != nil {
			wid = *e.WorkoutID
		}
		// Add workout ID to unique list
		found := false
		for _, id := range dayMap[e.Date].WorkoutIDs {
			if id == wid {
				found = true
				break
			}
		}
		if !found {
			dayMap[e.Date].WorkoutIDs = append(dayMap[e.Date].WorkoutIDs, wid)
		}
		dayMap[e.Date].Workouts = append(dayMap[e.Date].Workouts, CalendarMonthWorkout{
			WorkoutID:     wid,
			WorkoutName:   e.WorkoutName,
			ExerciseCount: e.ExerciseCount,
		})
	}

	result := make([]CalendarMonthDay, 0, len(order))
	for _, date := range order {
		result = append(result, *dayMap[date])
	}
	return result, nil
}

// GetCalendarWeek returns week calendar data with full exercise details grouped by workout
func (s *ExerciseLogService) GetCalendarWeek(ctx context.Context, userID int, startDate, endDate string) ([]CalendarWeekDay, error) {
	entries, err := s.exerciseLogRepo.GetCalendarWeekData(ctx, userID, startDate, endDate)
	if err != nil {
		return nil, err
	}

	type dayWorkoutKey struct {
		Date      string
		WorkoutID int
	}

	dayMap := make(map[string]*CalendarWeekDay)
	workoutIndices := make(map[dayWorkoutKey]int) // maps to index in day.Workouts
	var order []string

	for _, e := range entries {
		wid := 0
		if e.WorkoutID != nil {
			wid = *e.WorkoutID
		}

		// Ensure day exists
		if _, exists := dayMap[e.Date]; !exists {
			dayMap[e.Date] = &CalendarWeekDay{Date: e.Date}
			order = append(order, e.Date)
		}
		day := dayMap[e.Date]

		// Add workout ID to unique list
		found := false
		for _, id := range day.WorkoutIDs {
			if id == wid {
				found = true
				break
			}
		}
		if !found {
			day.WorkoutIDs = append(day.WorkoutIDs, wid)
		}

		// Ensure workout group exists
		key := dayWorkoutKey{Date: e.Date, WorkoutID: wid}
		if _, exists := workoutIndices[key]; !exists {
			day.Workouts = append(day.Workouts, CalendarWeekWorkout{
				WorkoutID:   wid,
				WorkoutName: e.WorkoutName,
			})
			workoutIndices[key] = len(day.Workouts) - 1
		}

		// Add exercise to the workout group
		idx := workoutIndices[key]
		day.Workouts[idx].Exercises = append(day.Workouts[idx].Exercises, CalendarWeekExercise{
			ExerciseName: e.ExerciseName,
			ExerciseType: e.ExerciseType,
			Sets:         e.Sets,
			Reps:         e.Reps,
			TimeSeconds:  e.TimeSeconds,
			Weight:       e.Weight,
			RestSeconds:  e.RestSeconds,
		})
	}

	result := make([]CalendarWeekDay, 0, len(order))
	for _, date := range order {
		result = append(result, *dayMap[date])
	}
	return result, nil
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
