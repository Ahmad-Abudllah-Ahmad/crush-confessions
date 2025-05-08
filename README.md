# Crush Confessions

A web application for anonymous crush confessions with PostgreSQL database.

## Features

- User authentication and profiles
- Anonymous confession submission
- Direct messaging between users
- Comment and like system
- User following functionality

## Technology Stack

- Next.js (React framework)
- TypeScript
- Tailwind CSS
- PostgreSQL (Database)
- Prisma ORM
- NextAuth.js (Authentication)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (installed and running)

### Database Setup

1. Install PostgreSQL if you haven't already:
   - macOS: `brew install postgresql` (using Homebrew)
   - Linux: `sudo apt install postgresql postgresql-contrib`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)

2. Create a PostgreSQL database:
   ```bash
   createdb crush_confessions
   ```

3. Set up the database using our automated script:
   ```bash
   npm run db:setup
   ```
   This script will prompt you for your PostgreSQL connection details and set up the database.

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DATABASE_URL="postgresql://username:password@localhost:5432/crush_confessions"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Replace `username` and `password` with your PostgreSQL credentials.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run database migrations:
   ```bash
   npm run db:migrate
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Management

- View and manage your database with Prisma Studio:
  ```bash
  npm run db:studio
  ```

- Create a new migration after schema changes:
  ```bash
  npx prisma migrate dev --name your-migration-name
  ```

- Generate Prisma client after schema changes:
  ```bash
  npx prisma generate
  ```

## Deployment

The application is configured for deployment on Netlify, but can be deployed to any platform that supports Next.js applications.