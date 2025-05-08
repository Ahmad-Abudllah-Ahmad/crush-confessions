import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '../../../../../lib/prisma'

// Schema for message validation
const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message is too long'),
})

// GET: Fetch messages for a conversation
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
        { message: 'You are not authorized to view this conversation' },
        { status: 403 }
      )
    }
    
    // Get messages for the conversation
    const messages = await prisma.message.findMany({
      where: { 
        conversationId 
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    })
    
    // Mark all messages from the other user as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: currentUser.id },
        readStatus: false,
      },
      data: {
        readStatus: true,
      },
    })
    
    // Format the messages
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      sender: {
        id: message.sender.id,
        displayName: message.sender.displayName || message.sender.email.split('@')[0],
        profilePicture: message.sender.profilePicture,
      },
      isCurrentUser: message.senderId === currentUser.id,
      readStatus: message.readStatus,
    }))
    
    return NextResponse.json({ messages: formattedMessages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST: Send a new message
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
        { message: 'You are not authorized to send messages in this conversation' },
        { status: 403 }
      )
    }
    
    // Parse and validate the request body
    const body = await request.json()
    const result = messageSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: result.error.format() },
        { status: 400 }
      )
    }
    
    const { content } = result.data
    
    // Create the new message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: currentUser.id,
        conversationId,
        readStatus: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    })
    
    // Format the message for the response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
      sender: {
        id: message.sender.id,
        displayName: message.sender.displayName || message.sender.email.split('@')[0],
        profilePicture: message.sender.profilePicture,
      },
      isCurrentUser: true,
      readStatus: message.readStatus,
    }
    
    return NextResponse.json(
      { 
        message: 'Message sent successfully',
        sentMessage: formattedMessage 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
} 