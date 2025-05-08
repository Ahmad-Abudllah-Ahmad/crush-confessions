import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

// This endpoint checks the database connection health
// It can be called by a cron job to ensure the database is working
export async function GET(request: NextRequest) {
  try {
    // Attempt to query the database to verify connection
    const result = await prisma.$queryRaw`SELECT 1 as connection_test`;
    
    return NextResponse.json({ 
      status: 'ok',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
