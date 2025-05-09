'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import ChatWindow from "./ChatWindow";
import Loader from "../../components/ui/Loader";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [showNoConversations, setShowNoConversations] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      setIsLoading(false);
      fetchConversations();
    }
  }, [status, router]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/conversations");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      setConversations(data.conversations || []);

      // If there are conversations, select the first one
      if (data.conversations && data.conversations.length > 0) {
        setSelectedConversation(data.conversations[0].id);
      } else {
        setShowNoConversations(true);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setShowNoConversations(true);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader text="Loading chat..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 container mx-auto p-4">
        {showNoConversations ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">
              No messages yet. When you and your crush both reveal interest in
              each other, a chat will appear here.
            </p>
          </div>
        ) : selectedConversation ? (
          <ChatWindow
            conversationId={selectedConversation}
            currentUserId={session?.user?.id || ""}
          />
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">
              Select a conversation to start chatting
            </p>
          </div>
        )}

        {/* My Confessions Section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-purple-800 mb-4">
            My Confessions
          </h2>
          <MyConfessions userId={session?.user?.id || ""} />
        </div>
      </main>
    </div>
  );
}

// My Confessions component
function MyConfessions({ userId }: { userId: string }) {
  const [confessions, setConfessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchConfessions();
    }
  }, [userId]);

  const fetchConfessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/confessions?feed=sent");

      if (!response.ok) {
        throw new Error("Failed to fetch confessions");
      }

      const data = await response.json();
      setConfessions(data.confessions);
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching confessions");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfession = async (confessionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this confession? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/confessions/${confessionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete confession");
      }

      // Remove the deleted confession from the UI
      setConfessions((prevConfessions) =>
        prevConfessions.filter((confession) => confession.id !== confessionId)
      );

      alert("Confession deleted successfully");
    } catch (err: any) {
      console.error("Error deleting confession:", err);
      alert("Failed to delete confession. Please try again.");
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return <div className="text-purple-600">Loading your confessions...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
        <button
          className="ml-4 text-red-500 underline"
          onClick={() => fetchConfessions()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (confessions.length === 0) {
    return (
      <p className="text-gray-600">You haven't posted any confessions yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {confessions.map((confession) => (
        <div key={confession.id} className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-block px-2 py-1 text-xs rounded-full mb-2 font-medium text-purple-800 bg-purple-100">
                {confession.visibility === "PUBLIC" ? "Public" : "Private"}
              </span>
            </div>
            <button
              onClick={() => handleDeleteConfession(confession.id)}
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
          </div>
          <p className="text-gray-800 line-clamp-3 mb-3 mt-2">
            {confession.content}
          </p>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{formatDate(confession.timestamp)}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    clipRule="evenodd"
                  />
                </svg>
                {confession.likes?.length || 0}
              </span>
              <span className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1 text-blue-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                    clipRule="evenodd"
                  />
                </svg>
                {confession.comments?.length || 0}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}