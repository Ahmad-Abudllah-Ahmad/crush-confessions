// This script creates a test user in the database
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating test user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Create a test user with UMT email
    const user = await prisma.user.upsert({
      where: { email: 'test@umt.edu.pk' },
      update: {
        password: hashedPassword,
        accountStatus: 'ACTIVE',
      },
      create: {
        email: 'test@umt.edu.pk',
        password: hashedPassword,
        accountStatus: 'ACTIVE',
      },
    });
    
    console.log(`Created test user with email: ${user.email}`);
    console.log('You can log in with:');
    console.log('Email: test@umt.edu.pk');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
