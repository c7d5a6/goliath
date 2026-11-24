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

Deployed with the shared owl procedure (`deploy/deploy.sh`, identical in every project, and
`deploy/deploy.conf`). It builds locally, ships a release to `~/goliath/releases/<id>`, switches
the `current` symlink, restarts the `owl-goliath` systemd unit and health-checks `/healthz`,
rolling back automatically on failure. Only committed code is deployed.

```bash
./deploy/deploy.sh init       # first time only: server folder, .env, systemd unit, Caddy site
./deploy/deploy.sh            # build, ship, switch, restart, health check
./deploy/deploy.sh rollback   # back one release
./deploy/deploy.sh status
./deploy/deploy.sh logs
```

Server state lives in `~/goliath/shared/`: `.env` and `data/` (`goliath.db` and
`goliath-firebase.json`). They survive releases and rollbacks.

## Environment Variables

- `PORT` - Server port (default: 8080, production: 3010). Listens on 127.0.0.1 only.
- `DB_PATH` - SQLite file (default: `data/goliath.db`)
- `FIREBASE_CREDENTIALS` - Firebase service account JSON (default: `data/goliath-firebase.json`)
- `GIN_MODE` - set to `release` in production

See `.env.example`.

## Database

The application uses SQLite3 with automatic migrations. Database file: `data/goliath.db`

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
├── deploy/              # Deploy script and config (owl procedure)
└── .env.example         # Template for the server .env
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

