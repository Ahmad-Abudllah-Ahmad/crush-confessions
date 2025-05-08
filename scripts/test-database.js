#!/usr/bin/env node

/**
 * Script to test the Prisma Accelerate database connection
 */

const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('Testing connection to Prisma Accelerate database...');
  
  try {
    // Initialize Prisma client
    const prisma = new PrismaClient();
    
    // Test connection by counting users
    const userCount = await prisma.user.count();
    console.log(`Connection successful! Found ${userCount} users in the database.`);
    
    // Create a test user if no users exist
    if (userCount === 0) {
      console.log('Creating a test user...');
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashedpassword123', // In a real app, this would be properly hashed
          displayName: 'Test User',
          accountStatus: 'ACTIVE'
        }
      });
      console.log('Test user created:', testUser.id);
    }
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        accountStatus: true,
        registrationDate: true
      }
    });
    
    console.log('Users in database:');
    console.table(users);
    
    // Disconnect from the database
    await prisma.$disconnect();
    console.log('Database connection test completed successfully!');
    
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
}

// Run the test
testDatabaseConnection().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
