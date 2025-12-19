package middleware

import (
	"context"
	"database/sql"
	"log"

	"github.com/gin-gonic/gin"
)

// UserContextKey is the context key for the full user object
const UserContextKey ContextKey = "user"

// User represents a user in the system (dummy struct for now)
type User struct {
	ID       int    `json:"id"`
	Email    string `json:"email"`
	Username string `json:"username"`
	FullName string `json:"full_name"`
}

// UserLoader middleware loads user details from database based on JWT claims
// This is a dummy implementation until the user table is created
func UserLoader(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try to get user ID from context (set by JWT middleware)
		userID, hasUserID := GetUserIDFromContext(c.Request.Context())
		
		if !hasUserID {
			// No user ID in context, skip loading
			c.Next()
			return
		}

		// Load user from database
		user, err := loadUserFromDB(c.Request.Context(), db, userID)
		if err != nil {
			log.Printf("Failed to load user %d: %v", userID, err)
			// Don't fail the request, just continue without user details
			c.Next()
			return
		}

		// Add full user object to context
		ctx := context.WithValue(c.Request.Context(), UserContextKey, user)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

// loadUserFromDB loads a user from the database
// This is a DUMMY implementation - returns a mock user
// TODO: Replace with actual database query when user table exists
func loadUserFromDB(ctx context.Context, db *sql.DB, userID int) (*User, error) {
	// DUMMY IMPLEMENTATION
	// In real implementation, this would query the database:
	// var user User
	// err := db.QueryRowContext(ctx, 
	//     "SELECT id, email, username, full_name FROM users WHERE id = ?", 
	//     userID,
	// ).Scan(&user.ID, &user.Email, &user.Username, &user.FullName)
	// if err != nil {
	//     return nil, err
	// }
	// return &user, nil

	// For now, return a dummy user
	email, _ := GetUserEmailFromContext(ctx)
	user := &User{
		ID:       userID,
		Email:    email,
		Username: "dummy_user",
		FullName: "Dummy User",
	}
	
	log.Printf("Loaded dummy user: ID=%d, Email=%s", user.ID, user.Email)
	return user, nil
}

// GetUserFromContext retrieves the user from context
func GetUserFromContext(ctx context.Context) (*User, bool) {
	user, ok := ctx.Value(UserContextKey).(*User)
	return user, ok
}

// RequireAuth middleware ensures a user is authenticated
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		_, hasUser := GetUserFromContext(c.Request.Context())
		if !hasUser {
			c.JSON(401, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}
		c.Next()
	}
}

