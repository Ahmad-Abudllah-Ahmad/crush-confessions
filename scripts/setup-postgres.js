#!/usr/bin/env node

/**
 * PostgreSQL database setup script
 * This script helps set up the PostgreSQL database for the application
 * It will:
 * 1. Reset any existing database (optional)
 * 2. Configure a new PostgreSQL database
 * 3. Set up environment variables
 * 4. Run Prisma migrations
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default PostgreSQL connection values
const defaults = {
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'crush_confessions',
};

// Function to prompt for input with default values
function prompt(question, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${question} (${defaultValue}): `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

// Function to prompt for yes/no questions
function promptYesNo(question, defaultValue = 'n') {
  return new Promise((resolve) => {
    rl.question(`${question} (y/n) [${defaultValue}]: `, (answer) => {
      const response = (answer || defaultValue).toLowerCase();
      resolve(response === 'y' || response === 'yes');
    });
  });
}

async function setupDatabase() {
  console.log('===================================');
  console.log('Crush Confessions PostgreSQL Setup');
  console.log('===================================');
  console.log('');
  
  // Get database connection details
  const host = await prompt('PostgreSQL host', defaults.host);
  const port = await prompt('PostgreSQL port', defaults.port);
  const user = await prompt('PostgreSQL username', defaults.user);
  const password = await prompt('PostgreSQL password', defaults.password);
  const database = await prompt('Database name', defaults.database);
  
  // Ask if the user wants to reset the database
  const resetDatabase = await promptYesNo('Do you want to reset the database? WARNING: This will delete all data');
  
  if (resetDatabase) {
    try {
      console.log('Resetting database...');
      // Try to drop the database if it exists
      execSync(`PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -c "DROP DATABASE IF EXISTS ${database} WITH (FORCE);"`, { 
        stdio: 'inherit' 
      });
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      const continueSetup = await promptYesNo('Continue with setup anyway?');
      if (!continueSetup) {
        rl.close();
        process.exit(1);
      }
    }
  }
  
  // Create the database if it doesn't exist
  try {
    console.log(`Creating database '${database}' if it doesn't exist...`);
    execSync(`PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -c "SELECT 1 FROM pg_database WHERE datname = '${database}'" | grep -q 1 || PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -c "CREATE DATABASE ${database}"`, { 
      stdio: 'inherit' 
    });
    console.log('Database created or already exists');
  } catch (error) {
    console.error('Error creating database:', error);
    const continueSetup = await promptYesNo('Continue with setup anyway?');
    if (!continueSetup) {
      rl.close();
      process.exit(1);
    }
  }
  
  // Construct the DATABASE_URL
  const databaseUrl = `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  
  // Update .env file
  try {
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      
      // Replace existing DATABASE_URL or add a new one
      if (envContent.includes('DATABASE_URL=')) {
        envContent = envContent.replace(
          /DATABASE_URL=.*/,
          `DATABASE_URL="${databaseUrl}"`
        );
      } else {
        envContent += `\nDATABASE_URL="${databaseUrl}"\n`;
      }
    } else {
      envContent = `DATABASE_URL="${databaseUrl}"\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('.env file updated with PostgreSQL connection string');
  } catch (error) {
    console.error('Error updating .env file:', error);
    process.exit(1);
  }
  
  // Update .env.local file for Next.js
  try {
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    let envLocalContent = '';
    
    if (fs.existsSync(envLocalPath)) {
      envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
      
      // Replace existing NEXT_PUBLIC_DATABASE_URL or add a new one
      if (envLocalContent.includes('NEXT_PUBLIC_DATABASE_URL=')) {
        envLocalContent = envLocalContent.replace(
          /NEXT_PUBLIC_DATABASE_URL=.*/,
          `NEXT_PUBLIC_DATABASE_URL="${databaseUrl}"`
        );
      } else {
        envLocalContent += `\nNEXT_PUBLIC_DATABASE_URL="${databaseUrl}"\n`;
      }
    } else {
      envLocalContent = `NEXT_PUBLIC_DATABASE_URL="${databaseUrl}"\n`;
    }
    
    fs.writeFileSync(envLocalPath, envLocalContent);
    console.log('.env.local file updated with PostgreSQL connection string');
  } catch (error) {
    console.error('Error updating .env.local file:', error);
    // Continue even if .env.local update fails
  }
  
  // Generate Prisma client
  try {
    console.log('Generating Prisma client...');
    execSync('npx prisma generate', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('Prisma client generated successfully');
  } catch (error) {
    console.error('Error generating Prisma client:', error);
    process.exit(1);
  }
  
  // Run Prisma migrations
  try {
    console.log('Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('Database migrations completed successfully');
    
    // Ask if the user wants to seed the database
    const seedDatabase = await promptYesNo('Do you want to seed the database with test data?');
    if (seedDatabase) {
      console.log('Seeding database...');
      execSync('node scripts/seed-db.js', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('Database seeded successfully');
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    console.log('You may need to create the database first. Try running:');
    console.log(`createdb ${database}`);
    process.exit(1);
  }
  
  console.log('');
  console.log('PostgreSQL setup completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run "npm run dev" to start your application');
  console.log('2. If deploying to Vercel, add the DATABASE_URL secret in your project settings');
  console.log('3. Ensure your deployment has a post-deploy hook that runs "npx prisma migrate deploy"');
  
  rl.close();
}

setupDatabase().catch(error => {
  console.error('Setup failed:', error);
  rl.close();
  process.exit(1);
});
