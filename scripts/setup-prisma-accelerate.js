#!/usr/bin/env node

/**
 * Script to set up Prisma Accelerate database connection
 */

const fs = require('fs');
const path = require('path');

// Paths to environment files
const envPath = path.join(__dirname, '..', '.env');
const envLocalPath = path.join(__dirname, '..', '.env.local');

// Prisma Accelerate connection URLs
const DATABASE_URL = 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMjc3YTJkNzEtNmEyNS00MjU4LTg5YzAtMzExYzNkYmZjNGY3IiwidGVuYW50X2lkIjoiNWFiMTlkNTk0MGVlNmU4OTU5NjlkNTM3NTZkYzMzMTIwNjQyMjkzZTdmMGQ4YTcyMGEyNTMwOTA4ZWNlNWQ1MCIsImludGVybmFsX3NlY3JldCI6IjBmYjNhNzdhLTkwNjMtNDdiOS04ZDk5LTE2MDc1NWNlMTM4OCJ9.Jk3JFQjkoqouZguXSlc9IE_VbMYuv8v-NuiuNPzRqBg';
// Direct URL for Prisma Accelerate - this should be your actual PostgreSQL connection string
// For now, we'll use the same URL, but in production, you should use a direct connection URL
const DIRECT_URL = DATABASE_URL;

console.log('Setting up Prisma Accelerate database connection...');

// Function to update environment file with Prisma Accelerate connection
function updateEnvFile(filePath) {
  try {
    let content = '';
    
    if (fs.existsSync(filePath)) {
      content = fs.readFileSync(filePath, 'utf8');
      
      // Remove existing DATABASE_URL and related entries
      content = content.replace(/DATABASE_URL=.*(\r?\n)?/g, '');
      content = content.replace(/NEXT_PUBLIC_DATABASE_URL=.*(\r?\n)?/g, '');
      content = content.replace(/DIRECT_URL=.*(\r?\n)?/g, '');
      
      // Remove any empty lines that might have been created
      content = content.replace(/^\s*[\r\n]/gm, '');
      
      // Add a newline if the file doesn't end with one
      if (content.length > 0 && !content.endsWith('\n')) {
        content += '\n';
      }
    }
    
    // Add Prisma Accelerate connection URLs
    content += `DATABASE_URL="${DATABASE_URL}"\n`;
    content += `DIRECT_URL="${DIRECT_URL}"\n`;
    
    fs.writeFileSync(filePath, content);
    console.log(`Successfully updated ${filePath} with Prisma Accelerate connection`);
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Update both environment files
updateEnvFile(envPath);
updateEnvFile(envLocalPath);

console.log('Prisma Accelerate database connection has been set up.');
console.log('Next steps:');
console.log('1. Run: npx prisma generate');
console.log('2. Run: npx prisma migrate deploy');
