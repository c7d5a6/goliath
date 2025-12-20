package main

import (
	"context"
	"log"
	"os"

	"goliath/handlers"
	"goliath/middleware"
	"goliath/repositories"
	"goliath/services"

	firebase "firebase.google.com/go/v4"
	"github.com/gin-gonic/gin"
	"google.golang.org/api/option"
)

func main() {
	// Initialize database
	db, err := InitDB("./goliath.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Initialize Firebase
	opt := option.WithCredentialsFile("./goliath-firebase.json")
	app, err := firebase.NewApp(context.Background(), nil, opt)
	if err != nil {
		log.Fatalf("Error initializing Firebase app: %v", err)
	}

	// Get Firebase Auth client
	authClient, err := app.Auth(context.Background())
	if err != nil {
		log.Fatalf("Error getting Firebase Auth client: %v", err)
	}
	log.Println("Firebase initialized successfully")

	// Initialize repositories
	regionRepo := repositories.NewRegionRepository(db)
	muscleGroupRepo := repositories.NewMuscleGroupRepository(db)
	exerciseAreaRepo := repositories.NewExerciseAreaRepository(db)
	muscleRepo := repositories.NewMuscleRepository(db)
	exerciseRepo := repositories.NewExerciseRepository(db)
	userRepo := repositories.NewUserRepository(db)

	// Initialize services
	muscleService := services.NewMuscleService(muscleRepo, muscleGroupRepo, regionRepo, exerciseAreaRepo)
	exerciseService := services.NewExerciseService(exerciseRepo)
	userService := services.NewUserService(userRepo)

	// Initialize handlers
	muscleHandlers := handlers.NewMuscleHandlers(muscleService)
	exerciseHandlers := handlers.NewExerciseHandlers(exerciseService)
	userHandlers := handlers.NewUserHandlers(userService)

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
		public.GET("/exercise-types", exerciseHandlers.GetExerciseTypes)

		// User-related routes
		public.GET("/users", userHandlers.GetUsers)
	}

	// Admin-only routes
	admin := r.Group("/")
	admin.Use(middleware.RequireAdmin())
	{
		// Create exercise requires admin role (transaction is already global)
		admin.POST("/exercises", exerciseHandlers.CreateExercise)
	}

	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s...\n", port)
	if err := r.Run(":" + port); err != nil {
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

