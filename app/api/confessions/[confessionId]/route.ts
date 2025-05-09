import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../../lib/prisma'
import { getAuthOptions } from "../../../../lib/auth-config";

// DELETE: Delete a confession
export async function DELETE(
  request: NextRequest,
  { params }: { params: { confessionId: string } }
) {
  try {
    const session = await getServerSession(getAuthOptions());
    const confessionId = params.confessionId;

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

    // Find the confession
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
    });

    if (!confession) {
      return NextResponse.json(
        { message: "Confession not found" },
        { status: 404 }
      );
    }

    // Check if the current user is the creator of the confession
    if (confession.senderId !== currentUser.id) {
      return NextResponse.json(
        { message: "You are not authorized to delete this confession" },
        { status: 403 }
      );
    }

    // First delete related data (likes, comments, etc.)

    // Delete all likes for this confession
    await prisma.like.deleteMany({
      where: { confessionId },
    });

    // Find all comment IDs for this confession
    const comments = await prisma.comment.findMany({
      where: { confessionId },
      select: { id: true },
    });

    const commentIds = comments.map((comment: { id: string }) => comment.id);

    // Delete all comment likes for these comments
    if (commentIds.length > 0) {
      await prisma.commentLike.deleteMany({
        where: {
          commentId: {
            in: commentIds,
          },
        },
      });
    }

    // Delete all comments for this confession
    await prisma.comment.deleteMany({
      where: { confessionId },
    });

    // Delete the confession itself
    await prisma.confession.delete({
      where: { id: confessionId },
    });

    return NextResponse.json({
      message: "Confession deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting confession:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}