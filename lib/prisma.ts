import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_DATABASE_URL

if (!databaseUrl) {
  console.warn('DATABASE_URL or NEXT_PUBLIC_DATABASE_URL is not set. Database connections will fail.')
}

// Create Prisma client with logging in development and error handling
export const prisma = globalForPrisma.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

// In development, attach to global to prevent multiple instances
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Handle potential connection issues in serverless environment
process.on('beforeExit', () => {
  void prisma.$disconnect()
})

// Handle potential errors
prisma.$use(async (params, next) => {
  try {
    return await next(params)
  } catch (error) {
    console.error('Prisma Error:', error)
    throw error
  }
})