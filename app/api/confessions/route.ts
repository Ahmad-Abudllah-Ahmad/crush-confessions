import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '../../../lib/prisma'
import { getAuthOptions } from "../../../lib/auth-config";

// Schema for validation when creating a confession
const confessionSchema = z.object({
  content: z
    .string()
    .min(10, 'Confession must be at least 10 characters')
    .max(1000, 'Confession must be less than 1000 characters'),
  targetUserEmail: z
    .string()
    .email('Please enter a valid email address')
    .endsWith('@umt.edu.pk', 'Only @umt.edu.pk email addresses are allowed')
    .or(z.string().length(0)),
  visibility: z.enum(['PUBLIC', 'PRIVATE']),
})

// GET: Fetch confessions with proper session isolation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(getAuthOptions());
    
    // Unauthorized if not logged in
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    })
    
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }
    
    // Get query parameters
    const url = new URL(request.url);
    const feedType = url.searchParams.get('feed') || 'all';
    const confessionId = url.searchParams.get('confessionId');
    
    let whereClause = {};
    
    // If a specific confession ID is provided, fetch just that one
    if (confessionId) {
      whereClause = { id: confessionId };
    } else {
      // Apply filter based on feed type
      switch (feedType) {
        case 'sent':
          // Only show confessions sent by the current user
          whereClause = { senderId: currentUser.id };
          break;
        case 'received':
          // Only show confessions targeting the current user
          whereClause = { targetUserId: currentUser.id };
          break;
        default:
          // Show both public confessions and those targeting the current user
          whereClause = {
            OR: [
              { visibility: 'PUBLIC' },
              { targetUserId: currentUser.id },
            ],
          };
      }
    }
    
    // Fetch confessions based on the filter
    const confessions = await prisma.confession.findMany({
      where: whereClause,
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        likes: true,
        comments: true,
        targetUser: {
          select: {
            displayName: true,
            email: true,
          },
        },
        sender: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    })
    
    // Check which confessions the current user has liked
    const userLikes = await prisma.like.findMany({
      where: {
        userId: currentUser.id,
      },
      select: {
        confessionId: true,
      },
    })
    
    const userLikedConfessionIds = new Set(userLikes.map((like: any) => like.confessionId))
    
    // Format confessions for the response
    const formattedConfessions = confessions.map((confession: any) => {
      // Determine if the current user is the sender or receiver
      const isSender = confession.senderId === currentUser.id;
      const isReceiver = confession.targetUserId === currentUser.id;
      
      return {
        id: confession.id,
        content: confession.content,
        timestamp: confession.timestamp.toISOString(),
        status: confession.status,
        visibility: confession.visibility,
        likes: confession.likes.length,
        comments: confession.comments.length,
        targetUserName: confession.targetUser?.displayName || 'Anonymous',
        senderName: isSender ? 'You' : (confession.sender?.displayName || 'Anonymous'),
        hasLiked: userLikedConfessionIds.has(confession.id),
        isSender,
        isReceiver,
        senderRevealed: confession.senderRevealed,
        receiverRevealed: confession.receiverRevealed,
        mutualReveal: confession.senderRevealed && confession.receiverRevealed,
        chatChannelId: (confession.senderRevealed && confession.receiverRevealed) ? confession.chatChannelId : null,
      };
    });
    
    return NextResponse.json({ confessions: formattedConfessions })
  } catch (error) {
    console.error('Error fetching confessions:', error)
    return NextResponse.json(
      { message: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// POST: Create a new confession
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
    const result = confessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 }
      );
    }

    const { content, targetUserEmail, visibility } = result.data;

    // Find target user if email provided
    let targetUser = null;
    if (targetUserEmail) {
      targetUser = await prisma.user.findUnique({
        where: { email: targetUserEmail },
      });

      if (!targetUser && visibility === "PRIVATE") {
        return NextResponse.json(
          { message: "Target user not found. They need to register first." },
          { status: 404 }
        );
      }
    }

    // Ensure private confessions have a target
    if (visibility === "PRIVATE" && !targetUser) {
      return NextResponse.json(
        { message: "Private confessions must have a target user" },
        { status: 400 }
      );
    }

    // Create the confession
    const confession = await prisma.confession.create({
      data: {
        content,
        visibility,
        senderId: currentUser.id,
        targetUserId: targetUser?.id || null,
        senderRevealed: false,
        receiverRevealed: false,
      },
    });

    return NextResponse.json(
      {
        message: "Confession created successfully",
        confession: {
          id: confession.id,
          content: confession.content,
          timestamp: confession.timestamp.toISOString(),
          status: confession.status,
          visibility: confession.visibility,
          senderRevealed: confession.senderRevealed,
          receiverRevealed: confession.receiverRevealed,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating confession:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}