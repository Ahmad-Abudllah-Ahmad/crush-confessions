import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../../../lib/prisma'

// Map to store typing status
// Format: { conversationId: { userId: timestamp } }
const typingUsers = new Map<string, Map<string, number>>();

// Function to get users typing in a conversation
const getTypingUsers = (conversationId: string, currentUserId: string) => {
  const conversationTyping = typingUsers.get(conversationId) || new Map();
  const now = Date.now();
  
  // Filter out stale typing indicators (older than 3 seconds)
  const activeTypers = Array.from(conversationTyping.entries())
    .filter(([userId, timestamp]) => {
      return userId !== currentUserId && now - timestamp < 3000;
    })
    .map(([userId]) => userId);
  
  return activeTypers;
};

// POST: Update typing status
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession();
    const conversationId = params.conversationId;
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });
    
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { user1Id: currentUser.id },
          { user2Id: currentUser.id }
        ]
      }
    });
    
    if (!conversation) {
      return NextResponse.json(
        { message: 'Conversation not found or you do not have access' },
        { status: 404 }
      );
    }
    
    // Get or create typing map for this conversation
    if (!typingUsers.has(conversationId)) {
      typingUsers.set(conversationId, new Map());
    }
    
    const conversationTyping = typingUsers.get(conversationId)!;
    
    // Update typing status with current timestamp
    conversationTyping.set(currentUser.id, Date.now());
    
    return NextResponse.json({
      message: 'Typing status updated',
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    );
  }
}

// GET: Get typing status
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession();
    const conversationId = params.conversationId;

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Get typing users excluding current user
    const typingUserIds = getTypingUsers(conversationId, currentUser.id);

    // Fetch user info for typing users
    let typingUserDetails: { id: string; displayName: string }[] = [];
    if (typingUserIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: typingUserIds,
          },
        },
        select: {
          id: true,
          displayName: true,
        },
      });

      typingUserDetails = users.map(
        (user: { id: string; displayName: string | null }) => ({
          id: user.id,
          displayName: user.displayName || "Anonymous",
        })
      );
    }

    return NextResponse.json({
      isTyping: typingUserDetails.length > 0,
      typingUsers: typingUserDetails,
    });
  } catch (error) {
    console.error("Error getting typing status:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}