// Database initialization helper for Netlify environment
const fs = require('fs');
const path = require('path');

/**
 * Ensures the database directory exists and is writable
 * This is particularly important for SQLite in Netlify's environment
 */
function ensureDatabaseDirectory() {
  // Get database URL from environment
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is not set');
    return false;
  }
  
  try {
    // Extract the file path from the URL
    const filePath = dbUrl.replace('file://', '');
    const dirPath = path.dirname(filePath);
    
    console.log(`Ensuring database directory exists: ${dirPath}`);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
    
    // Set permissions
    try {
      fs.chmodSync(dirPath, 0o777);
      console.log(`Set permissions on directory: ${dirPath}`);
      
      // If the database file exists, ensure it's writable too
      if (fs.existsSync(filePath)) {
        fs.chmodSync(filePath, 0o666);
        console.log(`Set permissions on database file: ${filePath}`);
      }
    } catch (permError) {
      console.warn('Warning: Could not set permissions:', permError.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring database directory:', error);
    return false;
  }
}

module.exports = {
  ensureDatabaseDirectory
};
