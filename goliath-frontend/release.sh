#!/bin/bash

now=$(date +"%Y-%m-%d-%H.%M.%S")

echo "Releasing goliath-frontend $now"

# Navigate to frontend directory
cd "$(dirname "$0")"

# Commit current changes
git add --all
git commit -am "gh-pages pre-release $now" || true

# Clean previous build
rm -rf dist

# Determine version bump
if [ -z $1 ];
then
  version=$(npm version patch)
elif [ "$1" == "minor" ];
then
  version=$(npm version minor)
elif [ "$1" == "major" ];
then
  version=$(npm version major)
else
  version=$(npm version $1)
fi

echo "Building version $version"

# Install dependencies and build
npm ci
npm run build

# Commit version bump
git add -A
git commit -am "prerelease $version" || true
cd "$(dirname "$0")"
cd ..

# Switch to gh-pages branch
git checkout gh-pages
git pull origin gh-pages || true


# Clean old files
rm -f *.js *.json *.txt *.png *.css *.svg *.html *.ico
rm -rf assets

# Copy new build
cp -a dist/. ./

# Create 404.html for SPA routing
cp index.html 404.html

# Create CNAME file for custom domain
echo "goliath.c7d5a6.com" > CNAME

# Create .nojekyll to prevent Jekyll processing
touch .nojekyll

# Commit and push
git add -A
git commit -am "gh-pages release $version"
git push origin gh-pages

# Switch back to main/master branch
git checkout main || git checkout master

echo "✅ Deployed version $version to GitHub Pages"
echo "🌐 Site will be available at: https://goliath.c7d5a6.com"

