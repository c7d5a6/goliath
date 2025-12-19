package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

var db *sql.DB

func main() {
	// Initialize database
	var err error
	db, err = InitDB("./goliath.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Setup router
	r := gin.Default()

	r.GET("/hello", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "hello",
		})
	})

	r.GET("/regions", func(c *gin.Context) {
		// Use request context for query cancellation
		ctx := c.Request.Context()

		rows, err := db.QueryContext(ctx, `
			SELECT id, version, created_when, created_by, modified_when, modified_by, name 
			FROM region 
			ORDER BY id
		`)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		type Region struct {
			ID           int     `json:"id"`
			Version      int     `json:"version"`
			CreatedWhen  string  `json:"created_when"`
			CreatedBy    *string `json:"created_by"`
			ModifiedWhen string  `json:"modified_when"`
			ModifiedBy   *string `json:"modified_by"`
			Name         string  `json:"name"`
		}

		regions := []Region{}
		for rows.Next() {
			var region Region
			if err := rows.Scan(&region.ID, &region.Version, &region.CreatedWhen, 
				&region.CreatedBy, &region.ModifiedWhen, &region.ModifiedBy, &region.Name); err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			regions = append(regions, region)
		}

		if err := rows.Err(); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{
			"regions": regions,
			"count":   len(regions),
		})
	})

	r.GET("/muscle-groups", func(c *gin.Context) {
		// Use request context for query cancellation
		ctx := c.Request.Context()

		rows, err := db.QueryContext(ctx, `
			SELECT mg.id, mg.version, mg.created_when, mg.created_by, mg.modified_when, mg.modified_by, 
			       mg.name, mg.region_id, r.name as region_name
			FROM muscle_group mg
			JOIN region r ON mg.region_id = r.id
			ORDER BY mg.region_id, mg.id
		`)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		type MuscleGroup struct {
			ID           int     `json:"id"`
			Version      int     `json:"version"`
			CreatedWhen  string  `json:"created_when"`
			CreatedBy    *string `json:"created_by"`
			ModifiedWhen string  `json:"modified_when"`
			ModifiedBy   *string `json:"modified_by"`
			Name         string  `json:"name"`
			RegionID     int     `json:"region_id"`
			RegionName   string  `json:"region_name"`
		}

		muscleGroups := []MuscleGroup{}
		for rows.Next() {
			var mg MuscleGroup
			if err := rows.Scan(&mg.ID, &mg.Version, &mg.CreatedWhen, 
				&mg.CreatedBy, &mg.ModifiedWhen, &mg.ModifiedBy, &mg.Name, 
				&mg.RegionID, &mg.RegionName); err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			muscleGroups = append(muscleGroups, mg)
		}

		if err := rows.Err(); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{
			"muscle_groups": muscleGroups,
			"count":         len(muscleGroups),
		})
	})

	r.GET("/exercise-areas", func(c *gin.Context) {
		// Use request context for query cancellation
		ctx := c.Request.Context()

		rows, err := db.QueryContext(ctx, `
			SELECT id, version, created_when, created_by, modified_when, modified_by, name 
			FROM exercise_area 
			ORDER BY id
		`)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		type ExerciseArea struct {
			ID           int     `json:"id"`
			Version      int     `json:"version"`
			CreatedWhen  string  `json:"created_when"`
			CreatedBy    *string `json:"created_by"`
			ModifiedWhen string  `json:"modified_when"`
			ModifiedBy   *string `json:"modified_by"`
			Name         string  `json:"name"`
		}

		exerciseAreas := []ExerciseArea{}
		for rows.Next() {
			var ea ExerciseArea
			if err := rows.Scan(&ea.ID, &ea.Version, &ea.CreatedWhen, 
				&ea.CreatedBy, &ea.ModifiedWhen, &ea.ModifiedBy, &ea.Name); err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			exerciseAreas = append(exerciseAreas, ea)
		}

		if err := rows.Err(); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(200, gin.H{
			"exercise_areas": exerciseAreas,
			"count":          len(exerciseAreas),
		})
	})

	r.GET("/muscles", func(c *gin.Context) {
		// Use request context for query cancellation
		ctx := c.Request.Context()

		rows, err := db.QueryContext(ctx, `
			SELECT m.id, m.version, m.created_when, m.created_by, m.modified_when, m.modified_by, 
			       m.name, m.muscle_group_id, mg.name as muscle_group_name
			FROM muscle m
			JOIN muscle_group mg ON m.muscle_group_id = mg.id
			ORDER BY m.muscle_group_id, m.id
		`)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		type Muscle struct {
			ID              int      `json:"id"`
			Version         int      `json:"version"`
			CreatedWhen     string   `json:"created_when"`
			CreatedBy       *string  `json:"created_by"`
			ModifiedWhen    string   `json:"modified_when"`
			ModifiedBy      *string  `json:"modified_by"`
			Name            string   `json:"name"`
			MuscleGroupID   int      `json:"muscle_group_id"`
			MuscleGroupName string   `json:"muscle_group_name"`
			ExerciseAreas   []string `json:"exercise_areas"`
		}

		musclesMap := make(map[int]*Muscle)
		muscleIDs := []int{}

		for rows.Next() {
			var m Muscle
			if err := rows.Scan(&m.ID, &m.Version, &m.CreatedWhen, 
				&m.CreatedBy, &m.ModifiedWhen, &m.ModifiedBy, &m.Name, 
				&m.MuscleGroupID, &m.MuscleGroupName); err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			m.ExerciseAreas = []string{}
			musclesMap[m.ID] = &m
			muscleIDs = append(muscleIDs, m.ID)
		}

		if err := rows.Err(); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		// Get exercise areas for each muscle
		if len(muscleIDs) > 0 {
			areaRows, err := db.QueryContext(ctx, `
				SELECT mea.muscle_id, ea.name
				FROM muscle_exercise_area mea
				JOIN exercise_area ea ON mea.exercise_area_id = ea.id
				ORDER BY mea.muscle_id, ea.name
			`)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			defer areaRows.Close()

			for areaRows.Next() {
				var muscleID int
				var areaName string
				if err := areaRows.Scan(&muscleID, &areaName); err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				if muscle, ok := musclesMap[muscleID]; ok {
					muscle.ExerciseAreas = append(muscle.ExerciseAreas, areaName)
				}
			}

			if err := areaRows.Err(); err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
		}

		// Convert map to slice
		muscles := make([]Muscle, 0, len(muscleIDs))
		for _, id := range muscleIDs {
			muscles = append(muscles, *musclesMap[id])
		}

		c.JSON(200, gin.H{
			"muscles": muscles,
			"count":   len(muscles),
		})
	})

	r.GET("/exercises", func(c *gin.Context) {
		// Use request context for query cancellation
		ctx := c.Request.Context()

		rows, err := db.QueryContext(ctx, `
			SELECT id, version, created_when, created_by, modified_when, modified_by, name, type
			FROM exercise
			ORDER BY type, name
		`)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		exercisesMap := make(map[int]*Exercise)
		exerciseIDs := []int{}

		for rows.Next() {
			exercise, err := ScanExercise(rows)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			exercisesMap[exercise.ID] = exercise
			exerciseIDs = append(exerciseIDs, exercise.ID)
		}

		if err := rows.Err(); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		// Get muscles for each exercise with percentages
		if len(exerciseIDs) > 0 {
			muscleRows, err := db.QueryContext(ctx, `
				SELECT em.exercise_id, em.muscle_id, m.name, em.percentage, em.created_when, em.created_by
				FROM exercise_muscle em
				JOIN muscle m ON em.muscle_id = m.id
				ORDER BY em.exercise_id, em.percentage DESC
			`)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			defer muscleRows.Close()

			for muscleRows.Next() {
				var em ExerciseMuscle
				var createdWhen string
				if err := muscleRows.Scan(&em.ExerciseID, &em.MuscleID, &em.MuscleName, &em.Percentage, &createdWhen, &em.CreatedBy); err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				em.CreatedWhen, _ = time.Parse("2006-01-02 15:04:05", createdWhen)
				
				if exercise, ok := exercisesMap[em.ExerciseID]; ok {
					exercise.Muscles = append(exercise.Muscles, em)
				}
			}

			if err := muscleRows.Err(); err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
		}

		// Convert map to slice
		exercises := make([]Exercise, 0, len(exerciseIDs))
		for _, id := range exerciseIDs {
			exercises = append(exercises, *exercisesMap[id])
		}

		c.JSON(200, gin.H{
			"exercises": exercises,
			"count":     len(exercises),
		})
	})

	r.GET("/muscles/table", func(c *gin.Context) {
		// Use request context for query cancellation
		ctx := c.Request.Context()

		rows, err := db.QueryContext(ctx, `
			SELECT 
				m.name as muscle_name,
				r.name as region_name,
				mg.name as muscle_group_name,
				GROUP_CONCAT(ea.name, ', ') as exercise_areas
			FROM muscle m
			JOIN muscle_group mg ON m.muscle_group_id = mg.id
			JOIN region r ON mg.region_id = r.id
			LEFT JOIN muscle_exercise_area mea ON m.id = mea.muscle_id
			LEFT JOIN exercise_area ea ON mea.exercise_area_id = ea.id
			GROUP BY m.id, m.name, r.name, mg.name
			ORDER BY r.id, mg.id, m.id
		`)
		if err != nil {
			c.String(500, "Error: %v", err)
			return
		}
		defer rows.Close()

		type MuscleRow struct {
			Muscle        string
			Region        string
			MuscleGroup   string
			ExerciseAreas string
		}

		var muscles []MuscleRow
		maxMuscle, maxRegion, maxGroup, maxAreas := 20, 15, 20, 30

		for rows.Next() {
			var m MuscleRow
			var areas sql.NullString
			if err := rows.Scan(&m.Muscle, &m.Region, &m.MuscleGroup, &areas); err != nil {
				c.String(500, "Error: %v", err)
				return
			}
			if areas.Valid {
				m.ExerciseAreas = areas.String
			} else {
				m.ExerciseAreas = ""
			}

			muscles = append(muscles, m)

			// Track max widths for proper column alignment
			if len(m.Muscle) > maxMuscle {
				maxMuscle = len(m.Muscle)
			}
			if len(m.Region) > maxRegion {
				maxRegion = len(m.Region)
			}
			if len(m.MuscleGroup) > maxGroup {
				maxGroup = len(m.MuscleGroup)
			}
			if len(m.ExerciseAreas) > maxAreas {
				maxAreas = len(m.ExerciseAreas)
			}
		}

		if err := rows.Err(); err != nil {
			c.String(500, "Error: %v", err)
			return
		}

		// Build ASCII table
		var result string
		separator := fmt.Sprintf("+-%s-+-%s-+-%s-+-%s-+\n",
			repeatChar('-', maxMuscle),
			repeatChar('-', maxRegion),
			repeatChar('-', maxGroup),
			repeatChar('-', maxAreas))

		// Header
		result += separator
		result += fmt.Sprintf("| %-*s | %-*s | %-*s | %-*s |\n",
			maxMuscle, "Muscle",
			maxRegion, "Region",
			maxGroup, "Muscle Group",
			maxAreas, "Exercise Areas")
		result += separator

		// Data rows
		for _, m := range muscles {
			result += fmt.Sprintf("| %-*s | %-*s | %-*s | %-*s |\n",
				maxMuscle, m.Muscle,
				maxRegion, m.Region,
				maxGroup, m.MuscleGroup,
				maxAreas, m.ExerciseAreas)
		}
		result += separator

		result += fmt.Sprintf("\nTotal: %d muscles\n", len(muscles))

		c.String(200, result)
	})

	log.Println("Server starting on :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func repeatChar(char rune, count int) string {
	result := make([]byte, count)
	for i := 0; i < count; i++ {
		result[i] = byte(char)
	}
	return string(result)
}

