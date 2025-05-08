// This script ensures the database is properly set up in the Netlify environment
const { execSync } = require('child_process');
const { ensureDatabaseDirectory } = require('../lib/db-init');

// Log the environment for debugging
console.log('Setting up database in environment:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

try {
  // Ensure the DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Use our helper to ensure the database directory exists and is writable
  const success = ensureDatabaseDirectory();
  if (!success) {
    console.error('Failed to ensure database directory exists and is writable');
    process.exit(1);
  }

  // Instead of running migrations, use db push to create the schema directly
  // This avoids migration conflicts with existing tables
  console.log('Setting up database schema...');
  execSync('npx prisma db push --accept-data-loss --force-reset', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  // Create a test user for easy login
  console.log('Creating test user...');
  execSync('node scripts/seed-db.js', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('Database setup completed successfully');
} catch (error) {
  console.error('Error setting up database:', error);
  process.exit(1);
}
