package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"goliath/handlers"
	"goliath/middleware"
	"goliath/repositories"
	"goliath/services"

	firebase "firebase.google.com/go/v4"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/option"
)

// shutdownTimeout bounds how long in-flight requests may finish after a stop signal.
const shutdownTimeout = 10 * time.Second

func main() {
	if err := run(); err != nil {
		log.Fatalf("goliath: %v", err)
	}
}

// run wires dependencies and serves until shutdown, so deferred cleanup always runs.
func run() error {
	// Initialize database
	db, err := InitDB("./goliath.db")
	if err != nil {
		return fmt.Errorf("initialize database: %w", err)
	}
	defer db.Close()

	// Initialize Firebase
	opt := option.WithCredentialsFile("./goliath-firebase.json")
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		return fmt.Errorf("initialize Firebase app: %w", err)
	}

	// Get Firebase Auth client
	authClient, err := app.Auth(context.Background())
	if err != nil {
		return fmt.Errorf("get Firebase Auth client: %w", err)
	}
	log.Println("Firebase initialized successfully")

	// Initialize repositories
	regionRepo := repositories.NewRegionRepository(db)
	muscleGroupRepo := repositories.NewMuscleGroupRepository(db)
	exerciseAreaRepo := repositories.NewExerciseAreaRepository(db)
	muscleRepo := repositories.NewMuscleRepository(db)
	exerciseRepo := repositories.NewExerciseRepository(db)
	userRepo := repositories.NewUserRepository(db)
	workoutRepo := repositories.NewWorkoutRepository(db)
	workoutExerciseRepo := repositories.NewWorkoutExerciseRepository(db)
	exerciseLogRepo := repositories.NewExerciseLogRepository(db)

	// Initialize services
	muscleService := services.NewMuscleService(
		muscleRepo,
		muscleGroupRepo,
		regionRepo,
		exerciseAreaRepo,
	)
	exerciseService := services.NewExerciseService(exerciseRepo)
	userService := services.NewUserService(userRepo)
	workoutService := services.NewWorkoutService(workoutRepo, workoutExerciseRepo)
	exerciseLogService := services.NewExerciseLogService(exerciseLogRepo)

	// Initialize handlers
	muscleHandlers := handlers.NewMuscleHandlers(muscleService)
	exerciseHandlers := handlers.NewExerciseHandlers(exerciseService)
	userHandlers := handlers.NewUserHandlers(userService)
	workoutHandlers := handlers.NewWorkoutHandlers(workoutService)
	exerciseLogHandlers := handlers.NewExerciseLogHandlers(exerciseLogService, db)

	// Setup router
	r := gin.Default()

	// Apply global middleware in order:
	// 1. CORS - handle cross-origin requests
	r.Use(middleware.CORS())

	// 2. Firebase JWT (optional) - extract user info from token if present
	r.Use(middleware.JWT(middleware.JWTConfig{
		AuthClient: authClient,
		Required:   false, // Allow requests without JWT
	}))

	// 3. User Loader - load full user details if JWT was present
	r.Use(middleware.UserLoader(db))

	// 4. Transaction - wrap ALL requests in database transaction
	// Required because all repository operations now require a transaction
	r.Use(middleware.Transaction(db))

	// Health check endpoint (public, no auth required)
	r.GET("/hello", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "hello",
		})
	})

	// Public routes - no authentication required
	public := r.Group("/")
	{
		// Muscle-related routes
		public.GET("/regions", muscleHandlers.GetRegions)
		public.GET("/muscle-groups", muscleHandlers.GetMuscleGroups)
		public.GET("/exercise-areas", muscleHandlers.GetExerciseAreas)
		public.GET("/muscles", muscleHandlers.GetMuscles)

		// Exercise-related routes
		public.GET("/exercises", exerciseHandlers.GetExercises)
		public.GET("/exercises/:id", exerciseHandlers.GetExercise)
		public.GET("/exercise-types", exerciseHandlers.GetExerciseTypes)
	}

	// Authenticated user routes - requires authentication but not admin
	auth := r.Group("/")
	auth.Use(middleware.RequireAuth())
	{
		// User info
		auth.GET("/me", userHandlers.GetMe)

		// Workout routes - users can only access their own workouts
		auth.GET("/workouts", workoutHandlers.GetWorkouts)
		auth.GET("/workouts/:id", workoutHandlers.GetWorkout)
		auth.POST("/workouts", workoutHandlers.CreateWorkout)
		auth.PUT("/workouts/:id", workoutHandlers.UpdateWorkout)
		auth.DELETE("/workouts/:id", workoutHandlers.DeleteWorkout)

		// Workout exercise routes - manage exercises within workouts
		auth.GET("/workouts/:id/exercises", workoutHandlers.GetWorkoutExercises)
		auth.POST("/workouts/:id/exercises", workoutHandlers.AddExerciseToWorkout)
		auth.PUT("/workouts/:id/exercises/:exercise_id", workoutHandlers.UpdateWorkoutExercise)
		auth.DELETE("/workouts/:id/exercises/:exercise_id", workoutHandlers.RemoveExerciseFromWorkout)
		auth.GET("/workouts/:id/exercise-areas", workoutHandlers.GetWorkoutExerciseAreas)

		// Exercise log routes - track completed exercises
		auth.GET("/exercise-logs", exerciseLogHandlers.GetExerciseLogs)
		auth.GET("/exercise-logs/calendar/year", exerciseLogHandlers.GetCalendarYear)
		auth.GET("/exercise-logs/calendar/month", exerciseLogHandlers.GetCalendarMonth)
		auth.GET("/exercise-logs/calendar/week", exerciseLogHandlers.GetCalendarWeek)
		auth.GET("/exercise-logs/:id", exerciseLogHandlers.GetExerciseLog)
		auth.POST("/exercise-logs", exerciseLogHandlers.CreateExerciseLog)
		auth.PUT("/exercise-logs/:id", exerciseLogHandlers.UpdateExerciseLog)
		auth.DELETE("/exercise-logs/:id", exerciseLogHandlers.DeleteExerciseLog)
		auth.GET("/exercises/:id/logs", exerciseLogHandlers.GetExerciseLogsByExercise)
		auth.GET("/workouts/:id/logs", exerciseLogHandlers.GetExerciseLogsByWorkout)
		auth.GET("/workouts/:id/latest-logs", exerciseLogHandlers.GetLatestLogsByWorkout)
		auth.GET("/workouts/:id/intensity", exerciseLogHandlers.GetWorkoutIntensity)
	}

	// Admin-only routes
	admin := r.Group("/")
	admin.Use(middleware.RequireAdmin())
	{
		// Create and update exercise requires admin role (transaction is already global)
		admin.POST("/exercises", exerciseHandlers.CreateExercise)
		admin.PUT("/exercises/:id", exerciseHandlers.UpdateExercise)

		// User management - admin only
		admin.GET("/users", userHandlers.GetUsers)
	}

	return serve(r, os.Getenv("PORT"))
}

// serve runs the router until SIGINT or SIGTERM, then drains in-flight requests.
// It listens on loopback only: the reverse proxy is the sole public entry point.
func serve(handler http.Handler, port string) error {
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:              "127.0.0.1:" + port,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 16,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	errc := make(chan error, 1)
	go func() {
		log.Printf("Server starting on %s...", srv.Addr)
		errc <- srv.ListenAndServe()
	}()

	select {
	case err := <-errc:
		return fmt.Errorf("listen on %s: %w", srv.Addr, err)
	case <-ctx.Done():
	}

	log.Println("Shutting down...")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shut down server: %w", err)
	}
	return nil
}
