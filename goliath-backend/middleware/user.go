package middleware

import (
	"context"
	"database/sql"
	"log"

	"goliath/entities"

	"github.com/gin-gonic/gin"
)

// UserContextKey is the context key for the full user object
const UserContextKey ContextKey = "user"

// UserLoader middleware loads user details from database based on Firebase UID
func UserLoader(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Try to get Firebase UID from context (set by JWT middleware)
		firebaseUID, hasUID := GetFirebaseUIDFromContext(c.Request.Context())
		
		if !hasUID {
			// No Firebase UID in context, skip loading
			c.Next()
			return
		}

		// Load user from database by Firebase UID
		user, err := loadUserByFirebaseUID(c.Request.Context(), db, firebaseUID)
		if err != nil {
			log.Printf("Failed to load user with Firebase UID %s: %v", firebaseUID, err)
			// Don't fail the request, just continue without user details
			c.Next()
			return
		}

		if user == nil {
			// User not found in database
			log.Printf("User not found for Firebase UID: %s", firebaseUID)
			c.Next()
			return
		}

		// Add full user object to context
		ctx := context.WithValue(c.Request.Context(), UserContextKey, user)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

// loadUserByFirebaseUID loads a user from the database by Firebase UID
func loadUserByFirebaseUID(ctx context.Context, db *sql.DB, firebaseUID string) (*entities.User, error) {
	var user entities.User
	err := db.QueryRowContext(ctx, `
		SELECT id, version, created_when, created_by, modified_when, modified_by, email, role, firebase_uid
		FROM user 
		WHERE firebase_uid = ?
	`, firebaseUID).Scan(
		&user.ID,
		&user.Version,
		&user.CreatedWhen,
		&user.CreatedBy,
		&user.ModifiedWhen,
		&user.ModifiedBy,
		&user.Email,
		&user.Role,
		&user.FirebaseUID,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // User not found
		}
		return nil, err
	}
	
	log.Printf("Loaded user: ID=%d, Email=%s, Role=%s, Firebase UID=%s", user.ID, user.Email, user.Role, firebaseUID)
	return &user, nil
}

// GetUserFromContext retrieves the user from context
func GetUserFromContext(ctx context.Context) (*entities.User, bool) {
	user, ok := ctx.Value(UserContextKey).(*entities.User)
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

// RequireRole middleware ensures a user has a specific role
func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, hasUser := GetUserFromContext(c.Request.Context())
		if !hasUser {
			c.JSON(401, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}
		
		if user.Role != role {
			c.JSON(403, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// RequireAdmin middleware ensures a user has admin role
func RequireAdmin() gin.HandlerFunc {
	return RequireRole("ADMIN")
}

// IsAdmin checks if a user has admin role
func IsAdmin(user *entities.User) bool {
	return user != nil && user.Role == "ADMIN"
}

// IsUser checks if a user has user role
func IsUser(user *entities.User) bool {
	return user != nil && user.Role == "USER"
}

