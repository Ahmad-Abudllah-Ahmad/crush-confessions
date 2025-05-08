import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { confessionId: string } }
) {
  try {
    const session = await getServerSession()
    const confessionId = params.confessionId
    
    // Unauthorized if not logged in
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    })
    
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Check if confession exists
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
    })
    
    if (!confession) {
      return NextResponse.json(
        { message: 'Confession not found' },
        { status: 404 }
      )
    }
    
    // Check if user has already liked this confession
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_confessionId: {
          userId: currentUser.id,
          confessionId,
        },
      },
    })
    
    // Toggle like
    if (existingLike) {
      // Unlike: remove existing like
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      })
      
      return NextResponse.json({
        message: 'Confession unliked successfully',
        liked: false,
      })
    } else {
      // Like: create new like
      await prisma.like.create({
        data: {
          userId: currentUser.id,
          confessionId,
        },
      })
      
      return NextResponse.json({
        message: 'Confession liked successfully',
        liked: true,
      })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
} 