package main

import (
	"context"
	"log"

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
	
	// 4. Transaction - wrap requests in database transaction
	// Note: Commented out by default as it wraps ALL routes in transactions
	// Uncomment if you want all routes to use transactions, or apply selectively
	// r.Use(middleware.Transaction(db))

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

	// Protected routes - authentication required (when you want to enable auth)
	// Uncomment the following to require authentication:
	// protected := r.Group("/")
	// protected.Use(middleware.RequireAuth())
	// {
	//     // Example: Create exercise requires authentication + transaction
	//     protected.POST("/exercises", 
	//         middleware.Transaction(db),
	//         exerciseHandlers.CreateExercise,
	//     )
	// }

	// For now, allow creating exercises without auth (with transaction management)
	r.POST("/exercises", 
		middleware.Transaction(db),
		exerciseHandlers.CreateExercise,
	)

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

