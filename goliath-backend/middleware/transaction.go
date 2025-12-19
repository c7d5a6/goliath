package middleware

import (
	"context"
	"database/sql"
	"log"

	"github.com/gin-gonic/gin"
)

// TransactionKey is the context key for database transaction
const TransactionKey ContextKey = "dbTransaction"

// Transaction middleware manages database transactions for requests
func Transaction(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start transaction
		tx, err := db.BeginTx(c.Request.Context(), nil)
		if err != nil {
			log.Printf("Failed to start transaction: %v", err)
			c.JSON(500, gin.H{"error": "Failed to start database transaction"})
			c.Abort()
			return
		}

		// Add transaction to context
		ctx := context.WithValue(c.Request.Context(), TransactionKey, tx)
		c.Request = c.Request.WithContext(ctx)

		// Track if we should commit or rollback
		shouldCommit := true

		// Ensure transaction is handled at the end
		defer func() {
			if r := recover(); r != nil {
				// Panic occurred, rollback
				if rbErr := tx.Rollback(); rbErr != nil {
					log.Printf("Failed to rollback transaction after panic: %v", rbErr)
				}
				log.Printf("Transaction rolled back due to panic: %v", r)
				panic(r) // Re-throw panic after rollback
			} else if !shouldCommit || c.IsAborted() || c.Writer.Status() >= 400 {
				// Error occurred (4xx or 5xx status), rollback
				if rbErr := tx.Rollback(); rbErr != nil {
					log.Printf("Failed to rollback transaction: %v", rbErr)
				}
				log.Printf("Transaction rolled back (status: %d, aborted: %v)", c.Writer.Status(), c.IsAborted())
			} else {
				// Success, commit
				if err := tx.Commit(); err != nil {
					log.Printf("Failed to commit transaction: %v", err)
					// If we failed to commit and haven't sent a response, send error
					if !c.Writer.Written() {
						c.JSON(500, gin.H{"error": "Failed to commit database transaction"})
					}
				}
			}
		}()

		c.Next()
	}
}

// GetTransactionFromContext retrieves the database transaction from context
func GetTransactionFromContext(ctx context.Context) (*sql.Tx, bool) {
	tx, ok := ctx.Value(TransactionKey).(*sql.Tx)
	return tx, ok
}

// GetDBFromContext gets either a transaction or the database connection
// This allows repositories to work with or without transactions
func GetDBFromContext(ctx context.Context, db *sql.DB) DBExecutor {
	if tx, ok := GetTransactionFromContext(ctx); ok {
		return tx
	}
	return db
}

// DBExecutor interface allows using either *sql.DB or *sql.Tx
type DBExecutor interface {
	ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
	QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
	QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row
}

