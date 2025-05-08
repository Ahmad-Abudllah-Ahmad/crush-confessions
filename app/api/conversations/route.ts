import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../lib/prisma'
import { z } from 'zod'
import { getAuthOptions } from "../../../lib/auth-config";

// Schema for conversation creation
const createConversationSchema = z.object({
  targetUserId: z.string().min(1, "Target user ID is required"),
});

// GET: Fetch conversations for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(getAuthOptions());

    // Unauthorized if not logged in
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Find all conversations where the current user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: currentUser.id }, { user2Id: currentUser.id }],
        status: "ACTIVE",
      },
      include: {
        user1: {
          select: {
            id: true,
            displayName: true,
            profilePicture: true,
            email: true,
          },
        },
        user2: {
          select: {
            id: true,
            displayName: true,
            profilePicture: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
    });

    // Get unread message counts for all conversations
    const unreadCountsPromises = conversations.map(
      async (conversation: any) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: currentUser.id },
            readStatus: false,
          },
        });
        return { conversationId: conversation.id, count: unreadCount };
      }
    );

    const unreadCounts = await Promise.all(unreadCountsPromises);
    const unreadCountsMap = unreadCounts.reduce(
      (
        acc: Record<string, number>,
        item: { conversationId: string; count: number }
      ) => {
        acc[item.conversationId] = item.count;
        return acc;
      },
      {} as Record<string, number>
    );

    // Format conversations for the response
    const formattedConversations = conversations.map((conversation: any) => {
      const otherUser =
        conversation.user1Id === currentUser.id
          ? conversation.user2
          : conversation.user1;

      return {
        id: conversation.id,
        otherUser: {
          id: otherUser.id,
          displayName: otherUser.displayName || otherUser.email.split("@")[0],
          profilePicture: otherUser.profilePicture,
        },
        lastMessage: conversation.messages[0]
          ? {
              content: conversation.messages[0].content,
              timestamp: conversation.messages[0].timestamp.toISOString(),
              senderId: conversation.messages[0].senderId,
              isCurrentUser:
                conversation.messages[0].senderId === currentUser.id,
            }
          : null,
        unreadCount: unreadCountsMap[conversation.id] || 0,
      };
    });

    // Calculate total unread messages across all conversations
    let totalUnreadMessages = 0;
    for (const count of Object.values(unreadCountsMap)) {
      totalUnreadMessages += Number(count);
    }

    return NextResponse.json({
      conversations: formattedConversations,
      totalUnreadMessages,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// POST: Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(getAuthOptions());

    // Unauthorized if not logged in
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = createConversationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 }
      );
    }

    const { targetUserId } = result.data;

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: "Target user not found" },
        { status: 404 }
      );
    }

    // Check if the user is trying to create a conversation with themselves
    if (currentUser.id === targetUserId) {
      return NextResponse.json(
        { message: "Cannot create a conversation with yourself" },
        { status: 400 }
      );
    }

    // Check if a conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            user1Id: currentUser.id,
            user2Id: targetUserId,
          },
          {
            user1Id: targetUserId,
            user2Id: currentUser.id,
          },
        ],
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        message: "Conversation already exists",
        conversationId: existingConversation.id,
      });
    }

    // Create a new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        user1Id: currentUser.id,
        user2Id: targetUserId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      {
        message: "Conversation created successfully",
        conversation: {
          id: newConversation.id,
          createdAt: newConversation.startTimestamp.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}