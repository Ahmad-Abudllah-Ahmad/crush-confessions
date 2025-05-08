'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/Button';

interface User {
  id: string;
  displayName: string | null;
  email: string;
}

interface Reply {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  user: User;
  userLiked: boolean;
  mentions: string[];
  revealRequested: boolean;
  revealApproved: boolean;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  user: User;
  userLiked: boolean;
  replies: Reply[];
  mentions: string[];
  revealRequested: boolean;
  revealApproved: boolean;
}

interface CommentSectionProps {
  confessionId: string;
  isConfessionOwner?: boolean;
}

export default function CommentSection({ confessionId, isConfessionOwner = false }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newReply, setNewReply] = useState<{ [key: string]: string }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch comments when the component mounts
  useEffect(() => {
    fetchComments();
  }, [confessionId]);

  // Function to fetch comments
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?confessionId=${confessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data.comments || []);
      
      // Get current user ID and store it
      if (data.currentUserId) {
        setCurrentUserId(data.currentUserId);
        // Store in window for access in the component
        if (typeof window !== 'undefined') {
          (window as any).userId = data.currentUserId;
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    }
  };

  // Function to post a new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confessionId,
          content: newComment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      setNewComment('');
      await fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to post a reply to a comment
  const handleSubmitReply = async (commentId: string) => {
    const replyContent = newReply[commentId];
    if (!replyContent?.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confessionId,
          content: replyContent,
          parentCommentId: commentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post reply');
      }

      // Clear the reply input and hide the reply form
      setNewReply({ ...newReply, [commentId]: '' });
      setReplyingTo(null);
      await fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error posting reply:', error);
      setError('Failed to post reply');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to like/unlike a comment
  const handleLikeComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to like/unlike comment');
      }

      await fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error liking comment:', error);
      setError('Failed to like/unlike comment');
    }
  };

  // Function to handle reveal identity request
  const handleRevealRequest = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'request' }),
      });

      if (!response.ok) {
        throw new Error('Failed to request identity reveal');
      }

      await fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error requesting identity reveal:', error);
      setError('Failed to request identity reveal');
    }
  };

  // Function to approve a reveal request
  const handleApproveReveal = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/reveal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve identity reveal');
      }

      const result = await response.json();
      
      // If a conversation was created or exists, show proper notification
      if (result.conversationId) {
        if (result.conversationAlreadyExists) {
          if (confirm('Identity reveal approved! A chat already exists. Would you like to go to your messages?')) {
            window.location.href = `/chat?conversationId=${result.conversationId}`;
          }
        } else {
          if (confirm('Identity reveal approved! A chat has been created. Would you like to go to your messages?')) {
            window.location.href = `/chat?conversationId=${result.conversationId}`;
          }
        }
      }

      await fetchComments(); // Refresh comments
    } catch (error) {
      console.error('Error approving identity reveal:', error);
      setError('Failed to approve identity reveal');
    }
  };

  // Helper function to format date
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

  // Function to toggle reply form visibility
  const toggleReplyForm = (commentId: string) => {
    if (replyingTo === commentId) {
      setReplyingTo(null);
    } else {
      setReplyingTo(commentId);
      // Initialize the reply input if it doesn't exist yet
      if (!newReply[commentId]) {
        setNewReply({ ...newReply, [commentId]: '' });
      }
    }
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Comments</h3>
      
      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="flex items-start gap-2">
        <textarea
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
        />
        <Button 
          type="submit" 
          variant="primary" 
          disabled={isLoading || !newComment.trim()}
          className="px-4 py-2"
        >
          {isLoading ? 'Posting...' : 'Post'}
        </Button>
      </form>
      
      {error && (
        <div className="p-2 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}
      
      {/* Comments list */}
      <div className="space-y-4 mt-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-3">
              {/* Comment header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white">
                    {comment.user.displayName?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {comment.revealApproved ? comment.user.displayName : 'Anonymous'}
                      {comment.revealRequested && !comment.revealApproved && (
                        <span className="ml-2 text-xs text-yellow-600 font-normal">(Identity reveal requested)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
              </div>
              
              {/* Comment content */}
              <p className="mt-2 text-gray-700">{comment.content}</p>
              
              {/* Comment actions */}
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <button 
                  onClick={() => handleLikeComment(comment.id)}
                  className={`flex items-center gap-1 ${comment.userLiked ? 'text-red-500' : ''}`}
                >
                  {comment.userLiked ? '❤️' : '🤍'} {comment.likes > 0 ? comment.likes : ''}
                </button>
                <button 
                  onClick={() => toggleReplyForm(comment.id)}
                  className="flex items-center gap-1"
                >
                  Reply
                </button>
                
                {/* Reveal identity request button (only visible to the comment owner) */}
                {!comment.revealRequested && !comment.revealApproved && currentUserId && comment.user.id === currentUserId && (
                  <button 
                    onClick={() => handleRevealRequest(comment.id)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    Request Reveal ID
                  </button>
                )}
                
                {/* Approve reveal button (only visible to confession owner) */}
                {isConfessionOwner && comment.revealRequested && !comment.revealApproved && (
                  <button 
                    onClick={() => handleApproveReveal(comment.id)}
                    className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                  >
                    Approve Reveal
                  </button>
                )}
              </div>
              
              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="mt-3 pl-4 border-l-2 border-gray-200">
                  <div className="flex items-start gap-2">
                    <textarea
                      className="flex-1 p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder={`Reply to ${comment.user.displayName || 'Anonymous'}...`}
                      value={newReply[comment.id] || ''}
                      onChange={(e) => setNewReply({ ...newReply, [comment.id]: e.target.value })}
                      rows={1}
                    />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      disabled={isLoading || !newReply[comment.id]?.trim()}
                      className="px-3 py-1 text-xs"
                      onClick={() => handleSubmitReply(comment.id)}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="pt-2">
                      {/* Reply header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center text-white text-xs">
                            {reply.user.displayName?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">
                              {reply.revealApproved ? reply.user.displayName : 'Anonymous'}
                              {reply.revealRequested && !reply.revealApproved && (
                                <span className="ml-2 text-xs text-yellow-600 font-normal">(Identity reveal requested)</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Reply content */}
                      <p className="mt-1 text-gray-700 text-sm">{reply.content}</p>
                      
                      {/* Reply actions */}
                      <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                        <button 
                          onClick={() => handleLikeComment(reply.id)}
                          className={`flex items-center gap-1 ${reply.userLiked ? 'text-red-500' : ''}`}
                        >
                          {reply.userLiked ? '❤️' : '🤍'} {reply.likes > 0 ? reply.likes : ''}
                        </button>
                        
                        {/* Reveal identity request button (only visible to the reply owner) */}
                        {!reply.revealRequested && !reply.revealApproved && currentUserId && reply.user.id === currentUserId && (
                          <button 
                            onClick={() => handleRevealRequest(reply.id)}
                            className="text-purple-600 hover:text-purple-800"
                          >
                            Request Reveal ID
                          </button>
                        )}
                        
                        {/* Approve reveal button (only visible to confession owner) */}
                        {isConfessionOwner && reply.revealRequested && !reply.revealApproved && (
                          <button 
                            onClick={() => handleApproveReveal(reply.id)}
                            className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700"
                          >
                            Approve Reveal
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 