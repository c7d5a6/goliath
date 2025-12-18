package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
)

const migrationsPath = "./migrations"

// Migration represents a database migration loaded from a file
type Migration struct {
	Version int
	Name    string
	SQL     string
}

// GetMigrations loads all migration files from the migrations directory
func GetMigrations() ([]Migration, error) {
	// Ensure migrations directory exists
	if err := os.MkdirAll(migrationsPath, 0755); err != nil {
		return nil, fmt.Errorf("failed to create migrations directory: %w", err)
	}

	// Read all files in migrations directory
	entries, err := os.ReadDir(migrationsPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read migrations directory: %w", err)
	}

	var migrations []Migration
	// Pattern: <version>_<name>.sql (e.g., 001_create_users_table.sql)
	pattern := regexp.MustCompile(`^(\d+)_(.+)\.sql$`)

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		filename := entry.Name()
		matches := pattern.FindStringSubmatch(filename)
		if matches == nil {
			log.Printf("Warning: Skipping file with invalid name format: %s", filename)
			continue
		}

		version, err := strconv.Atoi(matches[1])
		if err != nil {
			log.Printf("Warning: Invalid version number in file %s: %v", filename, err)
			continue
		}

		name := matches[2]
		filePath := filepath.Join(migrationsPath, filename)

		// Read migration SQL
		sqlBytes, err := os.ReadFile(filePath)
		if err != nil {
			return nil, fmt.Errorf("failed to read migration file %s: %w", filename, err)
		}

		migrations = append(migrations, Migration{
			Version: version,
			Name:    name,
			SQL:     string(sqlBytes),
		})
	}

	// Sort migrations by version
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Version < migrations[j].Version
	})

	log.Printf("Loaded %d migration(s) from %s", len(migrations), migrationsPath)
	return migrations, nil
}
