package repositories

import (
	"context"
	"database/sql"

	"goliath/entities"
)

// UserRepository handles database operations for users
type UserRepository struct {
	BaseRepository
}

// NewUserRepository creates a new UserRepository
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{
		BaseRepository: BaseRepository{db: db},
	}
}

// GetAll retrieves all users from the database
func (r *UserRepository) GetAll(ctx context.Context) ([]entities.User, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	rows, err := executor.QueryContext(ctx, `
		SELECT id, version, created_when, created_by, modified_when, modified_by, email, role, firebase_uid
		FROM user
		ORDER BY created_when DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := []entities.User{}
	for rows.Next() {
		var user entities.User
		if err := rows.Scan(
			&user.ID,
			&user.Version,
			&user.CreatedWhen,
			&user.CreatedBy,
			&user.ModifiedWhen,
			&user.ModifiedBy,
			&user.Email,
			&user.Role,
			&user.FirebaseUID,
		); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

// GetByID retrieves a user by ID
func (r *UserRepository) GetByID(ctx context.Context, id int) (*entities.User, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	var user entities.User
	err = executor.QueryRowContext(ctx, `
		SELECT id, version, created_when, created_by, modified_when, modified_by, email, role, firebase_uid
		FROM user
		WHERE id = ?
	`, id).Scan(
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
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

// GetByEmail retrieves a user by email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*entities.User, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	var user entities.User
	err = executor.QueryRowContext(ctx, `
		SELECT id, version, created_when, created_by, modified_when, modified_by, email, role, firebase_uid
		FROM user
		WHERE email = ?
	`, email).Scan(
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
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

// GetByFirebaseUID retrieves a user by Firebase UID
func (r *UserRepository) GetByFirebaseUID(ctx context.Context, firebaseUID string) (*entities.User, error) {
	executor, err := r.GetExecutor(ctx)
	if err != nil {
		return nil, err
	}
	var user entities.User
	err = executor.QueryRowContext(ctx, `
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
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

