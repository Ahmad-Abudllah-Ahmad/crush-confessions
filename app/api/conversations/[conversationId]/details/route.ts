import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../../../lib/prisma'

// GET: Get conversation details
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession()
    const conversationId = params.conversationId
    
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
    
    // Get the conversation with both users
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profilePicture: true,
          },
        },
        user2: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });
    
    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found' },
        { status: 404 }
      )
    }
    
    // Check if the current user is a participant in the conversation
    if (conversation.user1Id !== currentUser.id && conversation.user2Id !== currentUser.id) {
      return NextResponse.json(
        { message: 'You are not authorized to view this conversation' },
        { status: 403 }
      )
    }
    
    // Determine the other user in the conversation
    const otherUser = conversation.user1Id === currentUser.id 
      ? conversation.user2 
      : conversation.user1
    
    // Check if the current user has blocked the other user
    const isBlocked = await prisma.userBlock.findFirst({
      where: {
        blockerId: currentUser.id,
        blockedId: otherUser.id,
      }
    }) !== null
    
    // Check if the current user is blocked by the other user
    const isBlockedBy = await prisma.userBlock.findFirst({
      where: {
        blockerId: otherUser.id,
        blockedId: currentUser.id,
      }
    }) !== null
    
    // Format the response
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        // createdAt: conversation.createdAt,
        // updatedAt: conversation.updatedAt,
      },
      currentUser: {
        id: currentUser.id,
        displayName: currentUser.displayName || currentUser.email.split("@")[0],
        email: currentUser.email,
        profilePicture: currentUser.profilePicture,
      },
      otherUser: {
        id: otherUser.id,
        displayName: otherUser.displayName || otherUser.email.split("@")[0],
        email: otherUser.email,
        profilePicture: otherUser.profilePicture,
      },
      isBlocked,
      isBlockedBy,
      canMessage: !isBlocked && !isBlockedBy,
    });
  } catch (error) {
    console.error('Error fetching conversation details:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
} 