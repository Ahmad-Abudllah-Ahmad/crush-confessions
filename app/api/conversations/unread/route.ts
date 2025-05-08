import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from "../../../../lib/auth-config";
import { prisma } from "../../../../lib/prisma";

// GET: Fetch only the total unread message count for the current user
export async function GET(request: NextRequest) {
  try {
    // Pass the auth options to getServerSession
    const session = await getServerSession(getAuthOptions());

    // Debug logging in production
    console.log("Session status:", !!session?.user);

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
      select: {
        id: true,
      },
    });

    const conversationIds = conversations.map(
      (conv: { id: string }) => conv.id
    );

    // Get the total count of unread messages across all conversations
    const totalUnreadMessages = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: currentUser.id },
        readStatus: false,
      },
    });

    return NextResponse.json({
      totalUnreadMessages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching unread message count:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}