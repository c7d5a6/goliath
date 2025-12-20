# Goliath Backend

Backend service for the Goliath fitness application.

## Development

### Prerequisites
- Go 1.24.0 or higher
- SQLite3

### Running Locally

```bash
# Install dependencies
go mod download

# Run the server (default port 8080)
go run main.go

# Run with custom port
PORT=3000 go run main.go
```

## Deployment

### Prerequisites on Server
- PM2 installed (`npm install -g pm2`)
- SSH access to foundry@foundry.owlbeardm.com

### Release Script

The `release.sh` script automates building, versioning, and deploying the backend.

#### Usage

```bash
# Patch version bump (e.g., v1.0.0 -> v1.0.1)
./release.sh

# Minor version bump (e.g., v1.0.0 -> v1.1.0)
./release.sh minor

# Major version bump (e.g., v1.0.0 -> v2.0.0)
./release.sh major

# Custom version
./release.sh v1.2.3
```

#### What the script does:

1. Commits current changes with timestamp
2. Determines version number (using git tags)
3. Builds Linux AMD64 binary with version info
4. Syncs binary and migrations to server via SCP
5. Creates/updates PM2 configuration
6. Restarts the service using PM2
7. Creates git tag for the version
8. Displays useful management commands

#### Server Configuration

The service runs on port **3010** (configured in `app-pm2.json`).

Files deployed to server:
- Binary: `/home/foundry/goliath/goliath-backend`
- Migrations: `/home/foundry/goliath/migrations/`
- PM2 config: `/home/foundry/goliath/app-pm2.json`
- Logs: `/home/foundry/goliath/logs/`

### Server Management

```bash
# Check service status
ssh foundry@foundry.owlbeardm.com 'pm2 status'

# View logs
ssh foundry@foundry.owlbeardm.com 'pm2 logs goliath-backend'

# Restart service
ssh foundry@foundry.owlbeardm.com 'pm2 restart goliath-backend'

# Stop service
ssh foundry@foundry.owlbeardm.com 'pm2 stop goliath-backend'
```

## Environment Variables

- `PORT` - Server port (default: 8080, production: 3010)

## Database

The application uses SQLite3 with automatic migrations. Database file: `goliath.db`

### Migrations

Migrations are located in the `migrations/` directory and are automatically applied on startup.

## Project Structure

```
goliath-backend/
├── main.go              # Application entry point
├── database.go          # Database initialization and migrations
├── migrations.go        # Migration loader
├── entities/            # Data models
├── repositories/        # Database access layer
├── services/            # Business logic layer
├── handlers/            # HTTP handlers
├── middleware/          # HTTP middleware (CORS, JWT, etc.)
├── migrations/          # SQL migration files
├── release.sh           # Deployment script
└── app-pm2.json         # PM2 process configuration
```

## API Endpoints

### Public Endpoints
- `GET /hello` - Health check
- `GET /regions` - Get all muscle regions
- `GET /muscle-groups` - Get all muscle groups
- `GET /exercise-areas` - Get all exercise areas
- `GET /muscles` - Get all muscles
- `GET /exercises` - Get all exercises
- `GET /exercise-types` - Get exercise types
- `GET /users` - Get all users

### Admin Endpoints (requires authentication)
- `POST /exercises` - Create new exercise

## Authentication

Uses Firebase JWT tokens for authentication. Admin role required for certain endpoints.

