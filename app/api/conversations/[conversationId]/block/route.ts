import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../../../lib/prisma'

// POST: Block or unblock a user in a conversation
export async function POST(
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
    
    // Check if the conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })
    
    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found' },
        { status: 404 }
      )
    }
    
    // Verify that the current user is a participant in the conversation
    if (conversation.user1Id !== currentUser.id && conversation.user2Id !== currentUser.id) {
      return NextResponse.json(
        { message: 'You are not authorized to block/unblock users in this conversation' },
        { status: 403 }
      )
    }
    
    // Determine the other user's ID
    const otherUserId = conversation.user1Id === currentUser.id 
      ? conversation.user2Id 
      : conversation.user1Id
    
    // Check if the block already exists
    const existingBlock = await prisma.userBlock.findFirst({
      where: {
        blockerId: currentUser.id,
        blockedId: otherUserId,
      },
    })
    
    // Toggle block status
    if (existingBlock) {
      // Unblock: Delete the existing block
      await prisma.userBlock.delete({
        where: {
          id: existingBlock.id,
        },
      })
      
      // Update the conversation status to ACTIVE
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'ACTIVE',
        },
      })
      
      return NextResponse.json({
        message: 'User unblocked successfully',
        isBlocked: false,
      })
    } else {
      // Block: Create a new block
      await prisma.userBlock.create({
        data: {
          blockerId: currentUser.id,
          blockedId: otherUserId,
        },
      })
      
      // Update the conversation status
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: 'BLOCKED',
        },
      })
      
      return NextResponse.json({
        message: 'User blocked successfully',
        isBlocked: true,
      })
    }
  } catch (error) {
    console.error('Error toggling block status:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
} 