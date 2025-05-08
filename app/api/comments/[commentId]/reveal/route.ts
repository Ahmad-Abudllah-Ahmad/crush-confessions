import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../../../lib/prisma'
import { getAuthOptions } from "../../../../../lib/auth-config";

// POST: Request to reveal identity or approve reveal request
export async function POST(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getServerSession(getAuthOptions());
    const commentId = params.commentId;

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

    // Get the comment with related data
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        confession: true,
        user: true,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    const confession = comment.confession;
    const isCommentOwner = comment.userId === currentUser.id;
    const isConfessionOwner = confession.senderId === currentUser.id;

    // Parse the request body to get action type
    const { action } = await request.json();

    // Handle request to reveal identity
    if (action === "request" && isCommentOwner) {
      // Update the comment to set revealRequested flag to true
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { revealRequested: true },
      });

      return NextResponse.json({
        message: "Identity reveal requested successfully",
        revealRequested: true,
        revealApproved: false,
      });
    }

    // Handle approval of reveal request
    if (action === "approve" && isConfessionOwner) {
      // Check if the comment has a reveal request pending
      if (!comment.revealRequested) {
        return NextResponse.json(
          { message: "This comment does not have a pending reveal request" },
          { status: 400 }
        );
      }

      // Update the comment to set revealApproved flag to true
      const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { revealApproved: true },
      });

      // If this is a mutual reveal (both parties approved), create a conversation
      if (updatedComment.revealApproved) {
        // Check if a conversation already exists between these users
        const existingConversation = await prisma.conversation.findFirst({
          where: {
            OR: [
              {
                user1Id: confession.senderId,
                user2Id: comment.userId,
              },
              {
                user1Id: comment.userId,
                user2Id: confession.senderId,
              },
            ],
          },
        });

        if (existingConversation) {
          // Use existing conversation
          return NextResponse.json({
            message: "Identity reveal approved! A chat already exists.",
            revealRequested: true,
            revealApproved: true,
            conversationId: existingConversation.id,
            conversationAlreadyExists: true,
          });
        }

        // Create a conversation between the confession owner and comment owner
        const conversation = await prisma.conversation.create({
          data: {
            user1Id: confession.senderId,
            user2Id: comment.userId,
            status: "ACTIVE",
          },
        });

        return NextResponse.json({
          message: "Identity reveal approved! A chat has been created.",
          revealRequested: true,
          revealApproved: true,
          conversationId: conversation.id,
          conversationAlreadyExists: false,
        });
      }

      return NextResponse.json({
        message: "Identity reveal approved successfully",
        revealRequested: true,
        revealApproved: true,
      });
    }

    return NextResponse.json(
      { message: "Invalid action or permissions" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing reveal request:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}