package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "modernc.org/sqlite"
)

// Application ID for Goliath database (0x476F6C69 = "Goli" in ASCII)
const applicationID = 0x476F6C69

// InitDB opens the database, configures it, runs migrations, and returns the connection pool
func InitDB(dbPath string) (*sql.DB, error) {
	// Check if database file exists
	isNewDB := !fileExists(dbPath)

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool
	db.SetMaxOpenConns(1)            // SQLite: one writer at a time
	db.SetMaxIdleConns(1)            // Keep one connection idle
	db.SetConnMaxLifetime(time.Hour) // Recycle connections periodically

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Validate or set application_id
	if err := validateApplicationID(db, isNewDB); err != nil {
		db.Close()
		return nil, err
	}

	// Configure SQLite pragmas
	if err := configurePragmas(db); err != nil {
		db.Close()
		return nil, err
	}

	// Run migrations
	if err := migrate(db); err != nil {
		db.Close()
		return nil, err
	}

	// Vacuum database to optimize storage
	if err := vacuumDB(db); err != nil {
		db.Close()
		return nil, err
	}

	log.Println("Database initialized successfully")
	return db, nil
}

// fileExists checks if a file exists
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

// validateApplicationID checks or sets the application_id pragma
func validateApplicationID(db *sql.DB, isNewDB bool) error {
	var currentAppID int
	err := db.QueryRow("PRAGMA application_id").Scan(&currentAppID)
	if err != nil {
		return fmt.Errorf("failed to read application_id: %w", err)
	}

	if isNewDB {
		// New database: set application_id
		if currentAppID == 0 {
			_, err := db.Exec(fmt.Sprintf("PRAGMA application_id = %d", applicationID))
			if err != nil {
				return fmt.Errorf("failed to set application_id: %w", err)
			}
			log.Printf("Set application_id to 0x%X for new database", applicationID)
		}
	} else {
		// Existing database: validate application_id
		if currentAppID != applicationID {
			return fmt.Errorf("database application_id mismatch: expected 0x%X, got 0x%X - this database was not created by Goliath", 
				applicationID, currentAppID)
		}
		log.Printf("Verified application_id: 0x%X", currentAppID)
	}

	return nil
}

// configurePragmas sets SQLite pragma flags for optimal performance and reliability
func configurePragmas(db *sql.DB) error {
	pragmas := map[string]string{
		"journal_mode": "WAL",            // Write-Ahead Logging for better concurrency
		"foreign_keys": "ON",             // Enable foreign key constraints
	}

	for pragma, value := range pragmas {
		query := fmt.Sprintf("PRAGMA %s = %s", pragma, value)
		if _, err := db.Exec(query); err != nil {
			return fmt.Errorf("failed to set pragma %s: %w", pragma, err)
		}
	}

	// Verify critical pragmas
	var journalMode string
	if err := db.QueryRow("PRAGMA journal_mode").Scan(&journalMode); err != nil {
		return fmt.Errorf("failed to verify journal_mode: %w", err)
	}
	log.Printf("Database journal_mode: %s", journalMode)

	var foreignKeys bool
	if err := db.QueryRow("PRAGMA foreign_keys").Scan(&foreignKeys); err != nil {
		return fmt.Errorf("failed to verify foreign_keys: %w", err)
	}
	log.Printf("Database foreign_keys: %v", foreignKeys)

	return nil
}

// migrate runs all database migrations using user_version pragma
func migrate(db *sql.DB) error {
	// Get current database version
	var currentVersion int
	if err := db.QueryRow("PRAGMA user_version").Scan(&currentVersion); err != nil {
		return fmt.Errorf("failed to get user_version: %w", err)
	}
	log.Printf("Current database version: %d", currentVersion)

	// Load migrations
	migrations, err := GetMigrations()
	if err != nil {
		return fmt.Errorf("failed to load migrations: %w", err)
	}

	if len(migrations) == 0 {
		log.Println("No migrations found")
		return nil
	}

	// Apply migrations
	for _, migration := range migrations {
		if migration.Version <= currentVersion {
			log.Printf("Skipping migration %d_%s (already applied)", migration.Version, migration.Name)
			continue
		}

		if err := applyMigration(db, migration); err != nil {
			return err
		}
	}

	return nil
}

// applyMigration applies a single migration in a transaction
func applyMigration(db *sql.DB, migration Migration) error {
	log.Printf("Applying migration %d_%s...", migration.Version, migration.Name)

	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction for migration %d: %w", migration.Version, err)
	}
	defer tx.Rollback()

	// Execute migration SQL
	if _, err := tx.Exec(migration.SQL); err != nil {
		return fmt.Errorf("failed to execute migration %d_%s: %w", migration.Version, migration.Name, err)
	}

	// Update user_version
	if _, err := tx.Exec(fmt.Sprintf("PRAGMA user_version = %d", migration.Version)); err != nil {
		return fmt.Errorf("failed to update user_version for migration %d: %w", migration.Version, err)
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit migration %d: %w", migration.Version, err)
	}

	log.Printf("Successfully applied migration %d_%s", migration.Version, migration.Name)
	return nil
}

// vacuumDB rebuilds the database file, repacking it into minimal disk space
func vacuumDB(db *sql.DB) error {
	log.Println("Running VACUUM to optimize database...")
	if _, err := db.Exec("VACUUM"); err != nil {
		return fmt.Errorf("failed to vacuum database: %w", err)
	}
	log.Println("Database vacuumed successfully")
	return nil
}

// pragmaSelect is a helper function to query pragma values (for debugging)
func pragmaSelect(db *sql.DB, pragmaName string) (interface{}, error) {
	var value interface{}
	query := fmt.Sprintf("PRAGMA %s", pragmaName)
	if err := db.QueryRow(query).Scan(&value); err != nil {
		return nil, fmt.Errorf("failed to query pragma %s: %w", pragmaName, err)
	}
	return value, nil
}
