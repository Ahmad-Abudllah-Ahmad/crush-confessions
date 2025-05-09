import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '../../../../../lib/prisma'
import { getAuthOptions } from "../../../../../lib/auth-config";

export async function POST(
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

    // Get the confession with sender information
    const confession = await prisma.confession.findUnique({
      where: { id: confessionId },
      include: {
        sender: true,
      },
    });

    if (!confession) {
      return NextResponse.json(
        { message: "Confession not found" },
        { status: 404 }
      );
    }

    // Check that the current user is either the sender or the target of the confession
    const isTargetUser = confession.targetUserId === currentUser.id;
    const isSender = confession.senderId === currentUser.id;

    if (!isTargetUser && !isSender) {
      return NextResponse.json(
        {
          message:
            "You are not authorized to reveal interest in this confession",
        },
        { status: 403 }
      );
    }

    // Prevent users from revealing interest in their own confessions
    if (isSender && confession.senderId === confession.targetUserId) {
      return NextResponse.json(
        { message: "You cannot reveal interest in your own confession" },
        { status: 400 }
      );
    }

    // Determine which field to update based on the user's role
    const updateData: any = {};

    if (isSender) {
      updateData.senderRevealed = true;
    } else if (isTargetUser) {
      updateData.receiverRevealed = true;
    }

    // Update the confession with the reveal data
    const updatedConfession = await prisma.confession.update({
      where: { id: confessionId },
      data: updateData,
    });

    // Check if both users have revealed
    if (
      updatedConfession.senderRevealed &&
      updatedConfession.receiverRevealed
    ) {
      // Only create conversation if there's a valid target user
      if (confession.targetUserId) {
        // Check if a conversation already exists between the two users
        const existingConversation = await prisma.conversation.findFirst({
          where: {
            OR: [
              {
                user1Id: confession.senderId,
                user2Id: confession.targetUserId,
              },
              {
                user1Id: confession.targetUserId,
                user2Id: confession.senderId,
              },
            ],
          },
        });

        let conversationId;
        let conversationAlreadyExists = false;

        if (existingConversation) {
          // Use existing conversation
          conversationId = existingConversation.id;
          conversationAlreadyExists = true;
        } else {
          // Create a new conversation between the two users
          const newConversation = await prisma.conversation.create({
            data: {
              user1Id: confession.senderId,
              user2Id: confession.targetUserId,
              status: "ACTIVE",
            },
          });

          conversationId = newConversation.id;
        }

        // Update the confession with the conversation ID and status
        await prisma.confession.update({
          where: { id: confessionId },
          data: {
            status: "CONNECTED",
            chatChannelId: conversationId,
          },
        });

        return NextResponse.json({
          message: conversationAlreadyExists
            ? "Both users have revealed interest! A chat already exists."
            : "Both users have revealed interest! A chat has been created.",
          status: "CONNECTED",
          conversationId: conversationId,
          mutualReveal: true,
          conversationAlreadyExists,
        });
      } else {
        // Handle the case where there's no target user
        await prisma.confession.update({
          where: { id: confessionId },
          data: {
            status: "REVEALED",
          },
        });

        return NextResponse.json({
          message:
            "You have revealed interest, but there is no specific target user.",
          status: "REVEALED",
          mutualReveal: true,
        });
      }
    }

    // Determine the status of the reveal
    let newStatus = "ACTIVE";
    if (
      updatedConfession.senderRevealed ||
      updatedConfession.receiverRevealed
    ) {
      newStatus = "REVEALED";

      // Update the status if it hasn't been already
      if (confession.status === "ACTIVE") {
        await prisma.confession.update({
          where: { id: confessionId },
          data: {
            status: newStatus,
          },
        });
      }
    }

    return NextResponse.json({
      message: "Interest revealed successfully",
      status: newStatus,
      mutualReveal: false,
      senderRevealed: updatedConfession.senderRevealed,
      receiverRevealed: updatedConfession.receiverRevealed,
    });
  } catch (error) {
    console.error("Error revealing interest:", error);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}