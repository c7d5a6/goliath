package middleware

import (
	"database/sql"

	"github.com/gin-gonic/gin"
)

// Chain combines multiple middleware functions into one
func Chain(middlewares ...gin.HandlerFunc) gin.HandlerFunc {
	return func(c *gin.Context) {
		for _, middleware := range middlewares {
			middleware(c)
			if c.IsAborted() {
				return
			}
		}
	}
}

// AuthRequired creates a middleware chain that requires authentication
func AuthRequired(db *sql.DB) gin.HandlerFunc {
	return Chain(
		RequireAuth(),
	)
}

// WithTransaction wraps a route handler with transaction management
func WithTransaction(db *sql.DB, handler gin.HandlerFunc) gin.HandlerFunc {
	return Chain(
		Transaction(db),
		handler,
	)
}

