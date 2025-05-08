import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .optional(),
})

// GET: Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    // Unauthorized if not logged in
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get current user with their confessions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      include: {
        sentConfessions: {
          orderBy: {
            timestamp: 'desc',
          },
          include: {
            targetUser: {
              select: {
                displayName: true,
                email: true,
              },
            },
            likes: true,
            comments: true,
          },
        },
        receivedConfessions: {
          where: {
            // Only include received confessions that are not deleted
            status: {
              not: 'DELETED',
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
          include: {
            likes: true,
            comments: true,
          },
        },
      },
    })
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Format user profile data
    const profile = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      registrationDate: user.registrationDate.toISOString(),
    }
    
    // Format sent confessions
    const sentConfessions = user.sentConfessions.map(confession => ({
      id: confession.id,
      content: confession.content,
      timestamp: confession.timestamp.toISOString(),
      status: confession.status,
      visibility: confession.visibility,
      likes: confession.likes.length,
      comments: confession.comments.length,
      targetUserName: confession.targetUser?.displayName || confession.targetUser?.email?.split('@')[0] || null,
    }))
    
    // Format received confessions
    const receivedConfessions = user.receivedConfessions.map(confession => ({
      id: confession.id,
      content: confession.content,
      timestamp: confession.timestamp.toISOString(),
      status: confession.status,
      likes: confession.likes.length,
      comments: confession.comments.length,
    }))
    
    return NextResponse.json({
      profile,
      sentConfessions,
      receivedConfessions,
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// PUT: Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    // Unauthorized if not logged in
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    })
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const result = profileUpdateSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: result.error.format() },
        { status: 400 }
      )
    }
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: result.data.displayName,
      },
    })
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        profilePicture: updatedUser.profilePicture,
        registrationDate: updatedUser.registrationDate.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
} 