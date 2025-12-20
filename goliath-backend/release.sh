#!/bin/bash

now=$(date +"%Y-%m-%d-%H.%M.%S")

echo "Releasing goliath-backend $now"

# Navigate to backend directory
cd "$(dirname "$0")"

# Configuration
REMOTE_USER="foundry"
REMOTE_HOST="foundry.owlbeardm.com"
REMOTE_PATH="/home/foundry/goliath"
BINARY_NAME="goliath-backend"

# Commit current changes
git add --all
git commit -am "backend pre-release $now" || true

# Determine version bump using git tags
if [ -z $1 ];
then
  # Get the latest tag, default to v0.0.0 if no tags exist
  LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
  
  # Extract version numbers
  VERSION=${LATEST_TAG#v}
  IFS='.' read -r -a VERSION_PARTS <<< "$VERSION"
  MAJOR="${VERSION_PARTS[0]:-0}"
  MINOR="${VERSION_PARTS[1]:-0}"
  PATCH="${VERSION_PARTS[2]:-0}"
  
  # Increment patch version
  PATCH=$((PATCH + 1))
  NEW_VERSION="v$MAJOR.$MINOR.$PATCH"
elif [ "$1" == "minor" ];
then
  LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
  VERSION=${LATEST_TAG#v}
  IFS='.' read -r -a VERSION_PARTS <<< "$VERSION"
  MAJOR="${VERSION_PARTS[0]:-0}"
  MINOR="${VERSION_PARTS[1]:-0}"
  
  MINOR=$((MINOR + 1))
  NEW_VERSION="v$MAJOR.$MINOR.0"
elif [ "$1" == "major" ];
then
  LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
  VERSION=${LATEST_TAG#v}
  IFS='.' read -r -a VERSION_PARTS <<< "$VERSION"
  MAJOR="${VERSION_PARTS[0]:-0}"
  
  MAJOR=$((MAJOR + 1))
  NEW_VERSION="v$MAJOR.0.0"
else
  NEW_VERSION="$1"
fi

echo "Building version $NEW_VERSION"

# Build the Go binary for Linux AMD64
echo "Building binary..."
GOOS=linux GOARCH=amd64 go build -o $BINARY_NAME -ldflags "-X main.Version=$NEW_VERSION" .

if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ Binary built successfully"

# Create a temporary directory for deployment files
TEMP_DIR=$(mktemp -d)
mkdir -p "$TEMP_DIR/migrations"

# Copy necessary files
cp $BINARY_NAME "$TEMP_DIR/"
cp -r migrations/* "$TEMP_DIR/migrations/"
cp app-pm2.json "$TEMP_DIR/" 2>/dev/null || echo "Note: app-pm2.json not found, will be created on server"

echo "📦 Syncing files to server..."

# Create remote directory if it doesn't exist
ssh $REMOTE_USER@$REMOTE_HOST "mkdir -p $REMOTE_PATH/migrations"

# Copy binary
echo "Copying binary..."
scp "$TEMP_DIR/$BINARY_NAME" $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# Copy migrations
echo "Copying migrations..."
scp "$TEMP_DIR/migrations/"* $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/migrations/

# Copy or create pm2 config
if [ -f "$TEMP_DIR/app-pm2.json" ]; then
  echo "Copying pm2 config..."
  scp "$TEMP_DIR/app-pm2.json" $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
else
  echo "Creating pm2 config on server..."
  ssh $REMOTE_USER@$REMOTE_HOST "cat > $REMOTE_PATH/app-pm2.json" << 'EOF'
{
  "apps": [
    {
      "name": "goliath-backend",
      "script": "./goliath-backend",
      "cwd": "/home/foundry/goliath",
      "interpreter": "none",
      "env": {
        "PORT": "3010"
      }
    }
  ]
}
EOF
fi

# Make binary executable
echo "Setting permissions..."
ssh $REMOTE_USER@$REMOTE_HOST "chmod +x $REMOTE_PATH/$BINARY_NAME"

# Restart with pm2 (or start if not running)
echo "Restarting service with pm2..."
ssh $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_PATH && pm2 restart goliath-backend || pm2 start app-pm2.json"

# Save pm2 configuration
ssh $REMOTE_USER@$REMOTE_HOST "pm2 save"

# Clean up temporary directory
rm -rf "$TEMP_DIR"
rm $BINARY_NAME

# Create git tag
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"

# Commit version tag
git add -A
git commit -am "Release $NEW_VERSION" || true

echo ""
echo "✅ Deployed version $NEW_VERSION to $REMOTE_HOST"
echo "🚀 Service running on port 3010"
echo ""
echo "Useful commands:"
echo "  Check status:  ssh $REMOTE_USER@$REMOTE_HOST 'pm2 status'"
echo "  View logs:     ssh $REMOTE_USER@$REMOTE_HOST 'pm2 logs goliath-backend'"
echo "  Restart:       ssh $REMOTE_USER@$REMOTE_HOST 'pm2 restart goliath-backend'"
echo ""
echo "Don't forget to push the tags:"
echo "  git push origin main --tags"
echo ""

