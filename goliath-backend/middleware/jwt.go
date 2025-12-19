package middleware

import (
	"context"
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// ContextKey is a custom type for context keys to avoid collisions
type ContextKey string

const (
	// UserIDKey is the context key for user ID
	UserIDKey ContextKey = "userID"
	// UserEmailKey is the context key for user email
	UserEmailKey ContextKey = "userEmail"
)

// JWTConfig holds JWT configuration
type JWTConfig struct {
	SecretKey string
	Required  bool // If true, request fails without valid JWT
}

// JWT middleware validates JWT tokens and adds user info to context
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

		// Parse and validate token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(config.SecretKey), nil
		})

		if err != nil {
			if config.Required {
				c.JSON(401, gin.H{"error": "Invalid or expired token"})
				c.Abort()
				return
			}
			c.Next()
			return
		}

		// Extract claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Add user info to context
			if userID, ok := claims["user_id"].(float64); ok {
				ctx := context.WithValue(c.Request.Context(), UserIDKey, int(userID))
				c.Request = c.Request.WithContext(ctx)
			}
			
			if email, ok := claims["email"].(string); ok {
				ctx := context.WithValue(c.Request.Context(), UserEmailKey, email)
				c.Request = c.Request.WithContext(ctx)
			}
		} else {
			if config.Required {
				c.JSON(401, gin.H{"error": "Invalid token claims"})
				c.Abort()
				return
			}
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

