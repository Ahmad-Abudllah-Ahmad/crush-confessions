import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { getAuthOptions } from "../../../lib/auth-config";

// Schema for validation when creating a comment
const commentSchema = z.object({
  confessionId: z.string().uuid("Invalid confession ID"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(500, "Comment is too long"),
  parentCommentId: z.string().uuid("Invalid parent comment ID").optional(),
});

// Function to extract @mentions from comment text
function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex) || [];
  return matches.map((mention) => mention.substring(1)); // Remove @ symbol
}

// POST: Create a new comment
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
    const result = commentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: result.error.format() },
        { status: 400 }
      );
    }

    const { confessionId, content, parentCommentId } = result.data;

    // Check if confession exists
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
    });

    if (!confession) {
      return NextResponse.json(
        { message: "Confession not found" },
        { status: 404 }
      );
    }

    // If it's a reply, check if parent comment exists
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
      });

      if (!parentComment) {
        return NextResponse.json(
          { message: "Parent comment not found" },
          { status: 404 }
        );
      }

      // Ensure parent comment belongs to the same confession
      if (parentComment.confessionId !== confessionId) {
        return NextResponse.json(
          { message: "Parent comment does not belong to this confession" },
          { status: 400 }
        );
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        confessionId,
        userId: currentUser.id,
        parentCommentId,
        createdAt: new Date(),
        revealRequested: false,
        revealApproved: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    // Format the comment for the response
    const formattedComment = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      user: {
        id: comment.user.id,
        displayName: comment.user.displayName || "Anonymous",
        email: comment.user.email,
      },
      likes: 0,
      userLiked: false,
      replies: [],
      mentions: extractMentions(content),
      revealRequested: comment.revealRequested,
      revealApproved: comment.revealApproved,
    };

    return NextResponse.json(
      {
        message: "Comment created successfully",
        comment: formattedComment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}

// GET: Fetch comments for a confession
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(getAuthOptions());

    // Unauthorized if not logged in
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the confession ID from the URL
    const url = new URL(request.url);
    const confessionId = url.searchParams.get("confessionId");

    if (!confessionId) {
      return NextResponse.json(
        { message: "Confession ID is required" },
        { status: 400 }
      );
    }

    // Get all comments for the confession
    const comments = await prisma.comment.findMany({
      where: {
        confessionId,
        parentCommentId: null, // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
            commentLikes: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        commentLikes: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Format the comments for the response
    const formattedComments = comments.map((comment: any) => {
      // Check if the current user has liked this comment
      const userLiked = comment.commentLikes.some(
        (like: any) => like.userId === currentUser.id
      );

      // Format the replies
      const formattedReplies = comment.replies.map((reply: any) => {
        const replyUserLiked = reply.commentLikes.some(
          (like: any) => like.userId === currentUser.id
        );

        return {
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt.toISOString(),
          likes: reply.commentLikes.length,
          user: {
            id: reply.user.id,
            displayName: reply.user.displayName || "Anonymous",
            email: reply.user.email,
          },
          userLiked: replyUserLiked,
          mentions: extractMentions(reply.content),
          revealRequested: reply.revealRequested,
          revealApproved: reply.revealApproved,
        };
      });

      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        likes: comment.commentLikes.length,
        user: {
          id: comment.user.id,
          displayName: comment.user.displayName || "Anonymous",
          email: comment.user.email,
        },
        userLiked: userLiked,
        replies: formattedReplies,
        mentions: extractMentions(comment.content),
        revealRequested: comment.revealRequested,
        revealApproved: comment.revealApproved,
      };
    });

    return NextResponse.json({
      comments: formattedComments,
      currentUserId: currentUser.id,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
