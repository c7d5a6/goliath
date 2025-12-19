package middleware

import (
	"context"
	"strings"

	"firebase.google.com/go/v4/auth"
	"github.com/gin-gonic/gin"
)

// ContextKey is a custom type for context keys to avoid collisions
type ContextKey string

const (
	// UserIDKey is the context key for user ID (Firebase UID)
	UserIDKey ContextKey = "userID"
	// UserEmailKey is the context key for user email
	UserEmailKey ContextKey = "userEmail"
	// FirebaseUIDKey is the context key for Firebase UID
	FirebaseUIDKey ContextKey = "firebaseUID"
)

// JWTConfig holds JWT configuration for Firebase
type JWTConfig struct {
	AuthClient *auth.Client
	Required   bool // If true, request fails without valid JWT
}

// JWT middleware validates Firebase JWT tokens and adds user info to context
func JWT(config JWTConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		
		if authHeader == "" {
			// No token provided
			if config.Required {
				c.JSON(401, gin.H{"error": "Authorization header required"})
				c.Abort()
				return
			}
			// Token not required, continue without user
			c.Next()
			return
		}

		// Extract token from "Bearer <token>" format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			if config.Required {
				c.JSON(401, gin.H{"error": "Invalid authorization header format. Expected: Bearer <token>"})
				c.Abort()
				return
			}
			c.Next()
			return
		}

		tokenString := tokenParts[1]

		// Verify Firebase token
		token, err := config.AuthClient.VerifyIDToken(c.Request.Context(), tokenString)
		if err != nil {
			if config.Required {
				c.JSON(401, gin.H{"error": "Invalid or expired Firebase token"})
				c.Abort()
				return
			}
			c.Next()
			return
		}

		// Add Firebase UID to context
		ctx := context.WithValue(c.Request.Context(), FirebaseUIDKey, token.UID)
		c.Request = c.Request.WithContext(ctx)

		// Add email to context if available
		if email, ok := token.Claims["email"].(string); ok {
			ctx = context.WithValue(c.Request.Context(), UserEmailKey, email)
			c.Request = c.Request.WithContext(ctx)
		}

		// If user_id custom claim exists, add it to context
		if userID, ok := token.Claims["user_id"].(float64); ok {
			ctx = context.WithValue(c.Request.Context(), UserIDKey, int(userID))
			c.Request = c.Request.WithContext(ctx)
		}

		c.Next()
	}
}

// GetUserIDFromContext retrieves user ID from context
func GetUserIDFromContext(ctx context.Context) (int, bool) {
	userID, ok := ctx.Value(UserIDKey).(int)
	return userID, ok
}

// GetUserEmailFromContext retrieves user email from context
func GetUserEmailFromContext(ctx context.Context) (string, bool) {
	email, ok := ctx.Value(UserEmailKey).(string)
	return email, ok
}

// GetFirebaseUIDFromContext retrieves Firebase UID from context
func GetFirebaseUIDFromContext(ctx context.Context) (string, bool) {
	uid, ok := ctx.Value(FirebaseUIDKey).(string)
	return uid, ok
}

