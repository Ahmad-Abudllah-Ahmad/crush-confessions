'use client'

import React from "react";
import Link from 'next/link'
import { Button } from '../ui/Button'
import { Confession } from "../../lib/types";

interface ConfessionCardProps {
  confession: Confession;
  onLike?: () => void;
  onReveal?: () => void;
  onDelete?: () => void;
  currentUserId?: string;
}

export default function ConfessionCard({
  confession,
  onLike,
  onReveal,
  onDelete,
  currentUserId,
}: ConfessionCardProps) {
  const formattedDate = new Date(confession.timestamp).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const formattedTime = new Date(confession.timestamp).toLocaleTimeString(
    "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  );

  // Default handlers if not provided
  const handleLike = () => {
    if (onLike) {
      onLike();
    } else {
      // Default like handler
      fetch(`/api/confessions/${confession.id}/like`, {
        method: "POST",
      })
        .then(() => {
          window.location.reload();
        })
        .catch((err) => {
          console.error("Error liking confession:", err);
        });
    }
  };

  const handleReveal = () => {
    if (onReveal) {
      onReveal();
    } else {
      // Default reveal handler
      fetch(`/api/confessions/${confession.id}/reveal`, {
        method: "POST",
      })
        .then(() => {
          window.location.reload();
        })
        .catch((err) => {
          console.error("Error revealing interest:", err);
        });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else if (confession.isSender) {
      // Default delete handler
      if (confirm("Are you sure you want to delete this confession?")) {
        fetch(`/api/confessions/${confession.id}`, {
          method: "DELETE",
        })
          .then(() => {
            window.location.reload();
          })
          .catch((err) => {
            console.error("Error deleting confession:", err);
          });
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <div className="text-gray-500 text-sm">
            {formattedDate} at {formattedTime}
          </div>

          {confession.isSender && (
            <button
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700"
              title="Delete confession"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>

        <div className="text-gray-800 text-lg mb-4 whitespace-pre-wrap">
          {confession.content}
        </div>

        {confession.targetUserName && (
          <div className="mb-4 text-purple-600 font-medium">
            To: {confession.targetUserName}
          </div>
        )}

        {confession.senderName && (
          <div className="mb-4 text-purple-600 font-medium">
            From: {confession.senderName}
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 ${
                confession.hasLiked ? "text-red-500" : "text-gray-500"
              } hover:text-red-500`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill={confession.hasLiked ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{confession.likes}</span>
            </button>

            <Link
              href={`/confessions/${confession.id}`}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{confession.comments}</span>
            </Link>
          </div>

          <div className="flex space-x-2">
            <Link href={`/confessions/${confession.id}`}>
              <Button variant="secondary" size="sm">
                View Details
              </Button>
            </Link>

            {confession.status === "PENDING" && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleReveal}
                disabled={
                  (confession.isSender && confession.senderRevealed) ||
                  (confession.isReceiver && confession.receiverRevealed) ||
                  (confession.isSender && confession.isReceiver)
                }
              >
                {confession.isSender && confession.isReceiver
                  ? "Cannot Reveal to Self"
                  : confession.isSender && confession.senderRevealed
                  ? "Interest Revealed"
                  : confession.isReceiver && confession.receiverRevealed
                  ? "Interest Revealed"
                  : "Reveal Interest"}
              </Button>
            )}

            {confession.status === "REVEALED" && !confession.mutualReveal && (
              <div className="flex flex-col">
                <div className="text-purple-600 font-medium mb-1">
                  Interest Revealed
                </div>
                {confession.isReceiver && !confession.receiverRevealed && (
                  <Button variant="primary" size="sm" onClick={handleReveal}>
                    Reveal Back
                  </Button>
                )}
              </div>
            )}

            {confession.status === "CONNECTED" && (
              <Link href={`/chat?conversationId=${confession.chatChannelId}`}>
                <Button variant="secondary" size="sm">
                  Go to Chat
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}