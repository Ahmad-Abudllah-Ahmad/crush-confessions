'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Loader from "../../components/ui/Loader";

// ChatWindow component for displaying and sending messages
export default function ChatWindow({ conversationId, currentUserId }: { conversationId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<
    { id: string; displayName: string }[]
  >([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation details and check block status
  useEffect(() => {
    if (conversationId) {
      fetchConversationDetails();
    }
  }, [conversationId]);

  // Function to fetch conversation details
  const fetchConversationDetails = async () => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/details`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch conversation details");
      }

      const data = await response.json();

      if (!data || !data.otherUser) {
        throw new Error("Invalid conversation data received");
      }

      setOtherUser(data.otherUser);
      setIsBlocked(data.isBlocked || false);

      // Fetch messages if not blocked
      if (!data.isBlocked) {
        fetchMessages();
      }
    } catch (err: any) {
      console.error("Error fetching conversation details:", err);
      setError(err.message || "Failed to load conversation details");
      // Try to fetch messages anyway as a fallback
      fetchMessages();
    }
  };

  // Fetch messages when the component mounts or the conversation changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages();

      // Set up polling for real-time updates
      const messagesPollInterval = setInterval(() => {
        fetchMessages(false); // silent update
      }, 3000); // Poll every 3 seconds

      // Set up polling for typing status
      const typingPollInterval = setInterval(() => {
        checkTypingStatus();
      }, 1000); // Poll every second

      return () => {
        clearInterval(messagesPollInterval);
        clearInterval(typingPollInterval);
      };
    }
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to scroll to the bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Function to fetch messages
  const fetchMessages = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      if (showLoading) {
        setError(err.message || "An error occurred while fetching messages");
        console.error(err);
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Function to check typing status
  const checkTypingStatus = async () => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/typing`
      );

      if (!response.ok) {
        // Silently fail - don't show typing indicator
        setIsTyping(false);
        return;
      }

      const data = await response.json();
      setIsTyping(data.isTyping);
      setTypingUsers(data.typingUsers || []);
    } catch (err) {
      // Silently fail - don't show error for typing
      setIsTyping(false);
    }
  };

  // Function to handle typing indicator
  const handleTyping = () => {
    // Send typing status to server
    fetch(`/api/conversations/${conversationId}/typing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((err) => console.error("Error sending typing status:", err));

    // Clear existing timeout
    if (typingTimeout) clearTimeout(typingTimeout);
  };

  // Function to send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newMessage }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Clear input and refresh messages
      setNewMessage("");
      fetchMessages();
    } catch (err: any) {
      setError(err.message || "An error occurred while sending your message");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Helper function to format time for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to format date for grouping messages
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toISOString().split("T")[0]; // YYYY-MM-DD format
  };

  // Function to handle blocking a user
  const handleBlockUser = async () => {
    if (isBlocking) return;

    if (
      !confirm(
        "Are you sure you want to block this user? You will no longer be able to send or receive messages."
      )
    ) {
      return;
    }

    setIsBlocking(true);
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/block`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to block user");
      }

      setIsBlocked(true);
      alert("User has been blocked");
    } catch (err: any) {
      setError(
        err.message || "An error occurred while trying to block the user"
      );
      console.error(err);
    } finally {
      setIsBlocking(false);
    }
  };

  // Function to handle conversation deletion
  const handleDeleteConversation = () => {
    if (
      confirm(
        "Are you sure you want to delete this conversation? This action cannot be undone."
      )
    ) {
      fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.ok) {
            alert("Conversation deleted successfully");
            router.push("/chat");
          } else {
            throw new Error("Failed to delete conversation");
          }
        })
        .catch((err) => {
          console.error("Error deleting conversation:", err);
          alert("Failed to delete conversation. Please try again.");
        });
    }
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader text="Loading messages..." />
      </div>
    );
  }

  // Display error state
  if (error && !otherUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchConversationDetails();
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Group messages by date for better UI organization
  const groupedMessages: Record<string, any[]> = {};
  messages.forEach((message) => {
    const date = formatDate(message.timestamp);
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">
            {otherUser?.displayName || "Chat"}
          </h2>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleDeleteConversation}
            className="text-red-500 hover:text-red-700 focus:outline-none"
            title="Delete conversation"
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

          <button
            onClick={handleBlockUser}
            disabled={isBlocking || isBlocked}
            className={`focus:outline-none ${
              isBlocked
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-600 hover:text-gray-800"
            }`}
            title={isBlocked ? "User blocked" : "Block user"}
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
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isBlocked && (
          <div className="bg-red-100 text-red-800 p-3 mb-4 rounded-md">
            You have blocked this user. You can no longer send or receive
            messages.
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-800 p-3 mb-4 rounded-md">
            {error}
          </div>
        )}

        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center text-gray-500 my-8">
            No messages yet. Start the conversation by sending a message below.
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date} className="mb-6">
              <div className="text-center mb-4">
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              {msgs.map((message) => (
                <div
                  key={message.id}
                  className={`flex mb-3 ${
                    message.isCurrentUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-3/4 p-3 rounded-lg ${
                      message.isCurrentUser
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-white shadow rounded-bl-none"
                    }`}
                  >
                    <p className="mb-1">{message.content}</p>
                    <p
                      className={`text-xs ${
                        message.isCurrentUser
                          ? "text-purple-200"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={sendMessage}
        className="border-t border-gray-200 p-4 flex items-center"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          disabled={isBlocked || isSending}
          placeholder={
            isBlocked ? "You cannot send messages" : "Type your message..."
          }
          className={`flex-1 p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            isBlocked ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || isSending || isBlocked}
          className={`px-4 py-2 rounded-r-lg ${
            !newMessage.trim() || isSending || isBlocked
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          {isSending ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Sending
            </span>
          ) : (
            "Send"
          )}
        </button>
      </form>
    </div>
  );
}