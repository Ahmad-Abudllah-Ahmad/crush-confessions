#!/bin/bash

# PostgreSQL initialization script for Crush Confessions
# This script will:
# 1. Remove any existing database
# 2. Provision a new PostgreSQL database
# 3. Configure environment variables
# 4. Run Prisma migrations

# Display banner
echo "====================================="
echo "Crush Confessions PostgreSQL Setup"
echo "====================================="
echo

# Default values
DB_NAME="crush_confessions"
DB_USER="postgres"
DB_PASSWORD=""
DB_HOST="localhost"
DB_PORT="5432"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install PostgreSQL first."
    echo "macOS: brew install postgresql"
    echo "Linux: sudo apt install postgresql postgresql-contrib"
    echo "Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check if PostgreSQL server is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "PostgreSQL server is not running. Please start your PostgreSQL server."
    echo "macOS: brew services start postgresql"
    echo "Linux: sudo service postgresql start"
    echo "Windows: Start from Services panel"
    exit 1
fi

echo "PostgreSQL server is running."
echo

# Ask for database credentials
read -p "Database name [$DB_NAME]: " input
DB_NAME=${input:-$DB_NAME}

read -p "Database user [$DB_USER]: " input
DB_USER=${input:-$DB_USER}

read -p "Database password: " DB_PASSWORD

read -p "Database host [$DB_HOST]: " input
DB_HOST=${input:-$DB_HOST}

read -p "Database port [$DB_PORT]: " input
DB_PORT=${input:-$DB_PORT}

# Step 1: Remove existing database if it exists
echo "Checking if database '$DB_NAME' exists..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Database '$DB_NAME' exists. Dropping it..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE $DB_NAME WITH (FORCE);"
    
    if [ $? -ne 0 ]; then
        echo "Failed to drop database. Please check your credentials and try again."
        exit 1
    fi
    echo "Database dropped successfully."
else
    echo "Database '$DB_NAME' does not exist. Will create a new one."
fi

# Step 2: Create a new database
echo "Creating new database '$DB_NAME'..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

if [ $? -ne 0 ]; then
    echo "Failed to create database. Please check your credentials and try again."
    exit 1
fi

echo "Database '$DB_NAME' created successfully."

# Step 3: Create .env files with database URL
echo "Updating environment variables..."
DB_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?schema=public"

# Update .env file
if [ -f ../.env ]; then
    # Check if DATABASE_URL exists in .env
    if grep -q "DATABASE_URL=" ../.env; then
        # Replace existing DATABASE_URL
        sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$DB_URL\"|g" ../.env
    else
        # Add DATABASE_URL to .env
        echo "DATABASE_URL=\"$DB_URL\"" >> ../.env
    fi
else
    # Create new .env file
    echo "DATABASE_URL=\"$DB_URL\"" > ../.env
fi

# Create .env.local for Next.js
if [ -f ../.env.local ]; then
    # Check if NEXT_PUBLIC_DATABASE_URL exists in .env.local
    if grep -q "NEXT_PUBLIC_DATABASE_URL=" ../.env.local; then
        # Replace existing NEXT_PUBLIC_DATABASE_URL
        sed -i '' "s|NEXT_PUBLIC_DATABASE_URL=.*|NEXT_PUBLIC_DATABASE_URL=\"$DB_URL\"|g" ../.env.local
    else
        # Add NEXT_PUBLIC_DATABASE_URL to .env.local
        echo "NEXT_PUBLIC_DATABASE_URL=\"$DB_URL\"" >> ../.env.local
    fi
else
    # Create new .env.local file
    echo "NEXT_PUBLIC_DATABASE_URL=\"$DB_URL\"" > ../.env.local
fi

echo "Environment variables updated with PostgreSQL connection string."
echo

# Step 4: Run Prisma migrations
echo "Generating Prisma client..."
cd ..
npx prisma generate

if [ $? -ne 0 ]; then
    echo "Failed to generate Prisma client. Please check the error message above."
    exit 1
fi

echo "Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
    echo "Failed to run migrations. Please check the error message above."
    exit 1
fi

# Create a post-deploy script for CI/CD
echo "Creating post-deploy script for CI/CD..."
mkdir -p .github/workflows

cat > .github/workflows/db-migrations.yml << EOF
name: Database Migrations

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}
EOF

echo "CI/CD migration workflow created at .github/workflows/db-migrations.yml"
echo

# Create a Vercel configuration file if it doesn't exist
if [ ! -f ../vercel.json ]; then
    cat > ../vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "git": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
EOF
    echo "Created vercel.json configuration file."
fi

# Update package.json to include database scripts
echo "Updating package.json with database scripts..."
# This is a placeholder - in a real script we would use jq or another tool to properly modify JSON
echo "Please manually ensure your package.json has these scripts:"
echo "  \"db:reset\": \"prisma migrate reset --force\","
echo "  \"db:migrate\": \"prisma migrate deploy\","
echo "  \"db:generate\": \"prisma generate\","
echo "  \"db:studio\": \"prisma studio\""
echo

echo "PostgreSQL database setup completed successfully!"
echo
echo "Next steps:"
echo "1. Run 'npm run dev' to start your application"
echo "2. If deploying to Vercel, add the DATABASE_URL secret in your project settings"
echo "3. Ensure your deployment has a post-deploy hook that runs 'npx prisma migrate deploy'"
echo
echo "Your database is now ready for use with your Next.js application!"
