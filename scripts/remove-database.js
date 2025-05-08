#!/usr/bin/env node

/**
 * Script to remove database connection strings from environment files
 */

const fs = require('fs');
const path = require('path');

// Paths to environment files
const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');

console.log('Removing database connection strings from environment files...');

// Function to remove database-related entries from env files
function removeDbConnectionsFromFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Remove DATABASE_URL and NEXT_PUBLIC_DATABASE_URL lines
      content = content.replace(/DATABASE_URL=.*(\r?\n)?/g, '');
      content = content.replace(/NEXT_PUBLIC_DATABASE_URL=.*(\r?\n)?/g, '');
      
      // Remove any empty lines that might have been created
      content = content.replace(/^\s*[\r\n]/gm, '');
      
      fs.writeFileSync(filePath, content);
      console.log(`Successfully removed database connections from ${filePath}`);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  } else {
    console.log(`File ${filePath} does not exist, skipping.`);
  }
}

// Remove database connections from both files
removeDbConnectionsFromFile(envPath);
removeDbConnectionsFromFile(envLocalPath);

console.log('Database connection strings have been removed from environment files.');
console.log('To set up a new database, run: npm run db:setup');
