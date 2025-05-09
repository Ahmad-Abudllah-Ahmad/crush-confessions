'use client'

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
// import ChatWindow from "./ChatWindow";
import Loader from "../../components/ui/Loader";

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      setIsLoading(false);
    }
  }, [status, router]);

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
        <ChatWindow />
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
      const response = await fetch('/api/confessions?feed=sent');
      
      if (!response.ok) {
        throw new Error('Failed to fetch confessions');
      }
      
      const data = await response.json();
      setConfessions(data.confessions);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching confessions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteConfession = async (confessionId: string) => {
    if (!confirm('Are you sure you want to delete this confession? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/confessions/${confessionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete confession');
      }
      
      // Remove the deleted confession from the UI
      setConfessions(prevConfessions => 
        prevConfessions.filter(confession => confession.id !== confessionId)
      );
      
      alert('Confession deleted successfully');
    } catch (err: any) {
      console.error('Error deleting confession:', err);
      alert('Failed to delete confession. Please try again.');
    }
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    return <p className="text-gray-600">You haven't posted any confessions yet.</p>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {confessions.map(confession => (
        <div key={confession.id} className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-block px-2 py-1 text-xs rounded-full mb-2 font-medium text-purple-800 bg-purple-100">
                {confession.visibility === 'PUBLIC' ? 'Public' : 'Private'}
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
          <p className="text-gray-800 line-clamp-3 mb-3 mt-2">{confession.content}</p>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{formatDate(confession.timestamp)}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                {confession.likes?.length || 0}
              </span>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
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

// Replace the placeholder ChatWindow component with a functional one
function ChatWindow({ conversationId, currentUserId }: { conversationId: string; currentUserId: string }) {
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
  const [isBlockedBy, setIsBlockedBy] = useState(false);
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
      setOtherUser(data.otherUser);
      setIsBlocked(data.isBlocked || false);
      setIsBlockedBy(data.isBlockedBy || false);

      // Fetch messages if not blocked and not blocked by other user
      if (!data.isBlocked && !data.isBlockedBy) {
        fetchMessages();
      }
    } catch (err) {
      console.error("Error fetching conversation details:", err);
      // Try to fetch messages anyway
      fetchMessages();
    }
  };

  // Mark messages as read when the user views them and when they send a new message
  useEffect(() => {
    if (conversationId && !isBlocked) {
      // Fetch messages initially and mark them as read
      fetchMessages();

      // Set up polling for new messages
      const messagesPollInterval = setInterval(() => {
        fetchMessages(false);
      }, 3000);

      // Set up polling for typing status
      const typingPollInterval = setInterval(() => {
        checkTypingStatus();
      }, 5000);

      // Clean up on unmount
      return () => {
        clearInterval(messagesPollInterval);
        clearInterval(typingPollInterval);
      };
    }
  }, [conversationId, isBlocked]);

  // Mark messages as read whenever user is actively viewing the conversation
  useEffect(() => {
    if (conversationId && !isBlocked) {
      // Create a function to mark messages as read
      const markMessagesAsRead = () => {
        fetch(`/api/conversations/${conversationId}/messages`, {
          method: "GET", // The GET endpoint already marks messages as read
        }).catch((err) =>
          console.error("Error marking messages as read:", err)
        );
      };

      // Mark as read initially and when window gets focus
      markMessagesAsRead();

      const handleFocus = () => {
        markMessagesAsRead();
      };

      window.addEventListener("focus", handleFocus);

      return () => {
        window.removeEventListener("focus", handleFocus);
      };
    }
  }, [conversationId, isBlocked]);

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
          body: JSON.stringify({
            content: newMessage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Add the new message to the list
      setMessages((prev) => [...prev, data.sentMessage]);
      setNewMessage("");
    } catch (err: any) {
      setError(err.message || "An error occurred while sending the message");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Format time for display
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for grouping messages by day
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toISOString().split("T")[0];
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: any, message: any) => {
    // Format the timestamp correctly
    const timestamp = message.timestamp || new Date().toISOString();
    // Create a date string in YYYY-MM-DD format for grouping
    const date = new Date(timestamp).toISOString().split("T")[0];

    // Check if the message was sent by the current user
    const isCurrentUser = message.sender?.id === currentUserId;

    // If this date doesn't exist in our groups, create it
    if (!groups[date]) {
      groups[date] = [];
    }

    // Add the message to the appropriate date group with the isCurrentUser flag
    groups[date].push({
      ...message,
      isCurrentUser,
    });

    return groups;
  }, {});

  // Create a typing indicator message
  const renderTypingIndicator = () => {
    if (!isTyping || typingUsers.length === 0) return null;

    const typingUserNames = typingUsers
      .map((user) => user.displayName)
      .join(", ");
    const typingText =
      typingUsers.length === 1
        ? `${typingUserNames} is typing...`
        : `${typingUserNames} are typing...`;

    return (
      <div className="flex justify-start mb-4">
        <div className="bg-gray-100 rounded-lg p-3 flex items-center">
          <span className="text-sm text-gray-600 mr-2">{typingText}</span>
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  };

  // Function to toggle block status for the other user
  const handleToggleBlock = async () => {
    if (!otherUser) return;

    const action = isBlocked ? "unblock" : "block";

    // Confirm action
    if (
      !confirm(
        `Are you sure you want to ${action} ${
          otherUser.displayName || "this user"
        }?${
          isBlocked
            ? ""
            : " You won't be able to send or receive messages from them."
        }`
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
        throw new Error(`Failed to ${action} user`);
      }

      const data = await response.json();

      // Update UI based on the response
      setIsBlocked(data.isBlocked);
      alert(
        `${otherUser.displayName || "User"} has been ${action}ed successfully.`
      );

      // If blocking, redirect to conversations list
      if (data.isBlocked) {
        router.push("/chat");
      } else {
        // If unblocking, refresh the conversation details
        fetchConversationDetails();
      }
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      alert(`Failed to ${action} user. Please try again.`);
    } finally {
      setIsBlocking(false);
    }
  };

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
            onClick={() => {
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
            }}
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
            onClick={handleToggleBlock}
            className={`${
              isBlocked
                ? "text-green-500 hover:text-green-700"
                : "text-red-500 hover:text-red-700"
            } focus:outline-none`}
            title={isBlocked ? "Unblock user" : "Block user"}
            disabled={isBlocking}
          >
            {isBlocked ? (
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
                  d="M8 11V9a4 4 0 118 0v2m-4 0h4m-4 0H8m0 0v2a4 4 0 104 0v-2"
                />
              </svg>
            ) : (
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
            )}
          </button>
        </div>
      </div>

      {isBlocked ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
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
            </div>
            <p className="text-gray-700 font-medium">
              You have blocked this user.
            </p>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              You cannot send or receive messages from this user.
            </p>

            <button
              onClick={handleToggleBlock}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none"
              disabled={isBlocking}
            >
              {isBlocking ? "Unblocking..." : "Unblock User"}
            </button>
          </div>
        </div>
      ) : isBlockedBy ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-red-500 mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m0 0v2m0-2h2m-2 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">
              You have been blocked by this user.
            </p>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              You cannot send or receive messages from this user until they
              unblock you.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="text-purple-600">Loading messages...</div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center p-4">
                {error}
                <button
                  className="ml-2 text-purple-600 underline"
                  onClick={() => fetchMessages()}
                >
                  Try Again
                </button>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-center text-gray-500 my-4">
                This is the beginning of your conversation
              </p>
            ) : (
              Object.entries(groupedMessages).map(
                ([date, dayMessages]: [string, any]) => (
                  <div key={date} className="mb-4">
                    <div className="text-center my-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {new Date(date).toLocaleDateString(undefined, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {dayMessages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`mb-4 flex ${
                          message.isCurrentUser
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {!message.isCurrentUser && (
                          <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-semibold mr-2 self-end">
                            {message.sender?.displayName
                              ?.substring(0, 1)
                              ?.toUpperCase() || "A"}
                          </div>
                        )}
                        <div
                          className={`max-w-[75%] rounded-lg p-3 ${
                            message.isCurrentUser
                              ? "bg-purple-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <p className="text-gray-800">{message.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                        {message.isCurrentUser && (
                          <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-white font-semibold ml-2 self-end">
                            You
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )
            )}

            {/* Typing indicator */}
            {renderTypingIndicator()}

            {/* Invisible div to scroll to */}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <form onSubmit={sendMessage} className="flex items-center">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  // Trigger typing indicator when user types
                  handleTyping();
                }}
                disabled={isSending}
              />
              <button
                type="submit"
                className={`px-4 py-2 rounded-r-md ${
                  isSending || !newMessage.trim()
                    ? "bg-purple-400 text-white cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
                disabled={isSending || !newMessage.trim()}
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}