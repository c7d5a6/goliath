package repositories

import (
	"context"
	"database/sql"
	"errors"

	"goliath/middleware"
)

// ErrTransactionRequired is returned when a transaction is expected but not found in context
var ErrTransactionRequired = errors.New("database transaction required in context")

// BaseRepository provides common database access methods
type BaseRepository struct {
	db *sql.DB
}

// GetExecutor returns the transaction from context
// This enforces that all repository operations must run within a transaction
func (r *BaseRepository) GetExecutor(ctx context.Context) (middleware.DBExecutor, error) {
	tx, hasTx := middleware.GetTransactionFromContext(ctx)
	if !hasTx {
		return nil, ErrTransactionRequired
	}
	return tx, nil
}

