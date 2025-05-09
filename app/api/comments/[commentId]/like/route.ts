import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../../../lib/prisma'
import { getAuthOptions } from "../../../../../lib/auth-config";

// POST: Like a comment
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

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if the user has already liked this comment
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: currentUser.id,
          commentId,
        },
      },
    });

    if (existingLike) {
      // If the user has already liked the comment, unlike it
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId: currentUser.id,
            commentId,
          },
        },
      });

      return NextResponse.json({
        message: "Comment unliked successfully",
        liked: false,
      });
    }

    // Create the like
    await prisma.commentLike.create({
      data: {
        userId: currentUser.id,
        commentId,
      },
    });

    // Get the updated like count
    const likeCount = await prisma.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({
      message: "Comment liked successfully",
      liked: true,
      likeCount,
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}