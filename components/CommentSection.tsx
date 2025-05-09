'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Cache control
  const dataFetchedRef = useRef(false);
  const lastFetchTime = useRef(0);
  const CACHE_DURATION = 60000; // 1 minute cache
  
  // Flag to track if component is mounted
  const isMountedRef = useRef(true);

  // Function to fetch comments with caching
  const fetchComments = useCallback(async (force = false) => {
    // Don't fetch if we already have data and it's not stale, unless forced
    const now = Date.now();
    if (!force && comments.length > 0 && now - lastFetchTime.current < CACHE_DURATION) {
      return;
    }
    
    try {
      const response = await fetch(`/api/comments?confessionId=${confessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      
      // Only update if component is still mounted
      if (isMountedRef.current) {
        setComments(data.comments || []);
        lastFetchTime.current = now;
        
        // Get current user ID and store it
        if (data.currentUserId) {
          setCurrentUserId(data.currentUserId);
        }
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      if (isMountedRef.current) {
        setError('Failed to load comments');
      }
    }
  }, [confessionId, comments.length]);

  // Fetch comments when the component mounts
  useEffect(() => {
    if (!dataFetchedRef.current) {
      fetchComments();
      dataFetchedRef.current = true;
    }
    
    // Set up cleanup when component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchComments]);

  // Function to post a new comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsLoading(true);
    setError(null);
    
    // Save the comment content before clearing the input
    const commentContent = newComment;
    // Clear input immediately for better UX
    setNewComment('');
    
    // Create temporary optimistic comment
    const optimisticComment: Comment = {
      id: 'temp-' + Date.now(),
      content: commentContent,
      createdAt: new Date().toISOString(),
      likes: 0,
      user: { 
        id: currentUserId || 'unknown',
        displayName: 'You',
        email: ''
      },
      userLiked: false,
      replies: [],
      mentions: [],
      revealRequested: false,
      revealApproved: false
    };
    
    // Update UI optimistically
    setComments(prevComments => [optimisticComment, ...prevComments]);

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confessionId,
          content: commentContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      // Get the actual comment from the response
      const data = await response.json();
      if (data.comment) {
        // Replace temporary comment with the real one
        setComments(prevComments => 
          prevComments.map(c => c.id === optimisticComment.id ? data.comment : c)
        );
      } else {
        // Fallback to fetching all comments if we didn't get the created comment
        fetchComments(true);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post comment');
      
      // Remove the optimistic comment
      setComments(prevComments => 
        prevComments.filter(c => c.id !== optimisticComment.id)
      );
      // Restore the comment text
      setNewComment(commentContent);
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
    
    // Clear the reply input immediately for better UX
    setNewReply({ ...newReply, [commentId]: '' });
    setReplyingTo(null);
    
    // Create temporary optimistic reply
    const parentComment = comments.find(c => c.id === commentId);
    if (!parentComment) {
      setError('Comment not found');
      setIsLoading(false);
      return;
    }
    
    const optimisticReply: Reply = {
      id: 'temp-reply-' + Date.now(),
      content: replyContent,
      createdAt: new Date().toISOString(),
      likes: 0,
      user: { 
        id: currentUserId || 'unknown',
        displayName: 'You',
        email: ''
      },
      userLiked: false,
      mentions: [],
      revealRequested: false,
      revealApproved: false
    };
    
    // Add optimistic reply to the parent comment
    setComments(prevComments => 
      prevComments.map(c => c.id === commentId 
        ? { ...c, replies: [...c.replies, optimisticReply] }
        : c
      )
    );

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
      
      // Get the actual reply from the response
      const data = await response.json();
      if (data.comment) {
        // Update the comment with the real reply
        setComments(prevComments => 
          prevComments.map(c => {
            if (c.id === commentId) {
              // Remove optimistic reply and add the real one
              const updatedReplies = c.replies.filter(r => r.id !== optimisticReply.id);
              return { 
                ...c, 
                replies: [...updatedReplies, data.comment] 
              };
            }
            return c;
          })
        );
      } else {
        // Fallback to fetching all comments if we didn't get the created reply
        fetchComments(true);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      setError('Failed to post reply');
      
      // Remove the optimistic reply
      setComments(prevComments => 
        prevComments.map(c => c.id === commentId 
          ? { ...c, replies: c.replies.filter(r => r.id !== optimisticReply.id) }
          : c
        )
      );
      // Restore the reply text and show the form again
      setNewReply({ ...newReply, [commentId]: replyContent });
      setReplyingTo(commentId);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to like/unlike a comment with optimistic UI update
  const handleLikeComment = async (commentId: string) => {
    // Find if it's a top-level comment or a reply
    let isReply = false;
    let parentCommentId = '';
    
    // Check if it's a reply
    for (const comment of comments) {
      const reply = comment.replies.find(r => r.id === commentId);
      if (reply) {
        isReply = true;
        parentCommentId = comment.id;
        break;
      }
    }
    
    // Optimistic UI update
    setComments(prevComments => {
      if (isReply) {
        // It's a reply
        return prevComments.map(c => {
          if (c.id === parentCommentId) {
            return {
              ...c,
              replies: c.replies.map(r => {
                if (r.id === commentId) {
                  return {
                    ...r,
                    userLiked: !r.userLiked,
                    likes: r.userLiked ? r.likes - 1 : r.likes + 1
                  };
                }
                return r;
              })
            };
          }
          return c;
        });
      } else {
        // It's a top-level comment
        return prevComments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              userLiked: !c.userLiked,
              likes: c.userLiked ? c.likes - 1 : c.likes + 1
            };
          }
          return c;
        });
      }
    });

    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to like/unlike comment');
      }
      
      // No need to refresh all comments - our optimistic update is sufficient
    } catch (error) {
      console.error('Error liking comment:', error);
      setError('Failed to like/unlike comment');
      
      // Revert the optimistic update if the API call fails
      fetchComments(true);
    }
  };

  // Function to handle reveal identity request
  const handleRevealRequest = async (commentId: string) => {
    // Find if it's a top-level comment or a reply
    let isReply = false;
    let parentCommentId = '';
    
    // Check if it's a reply
    for (const comment of comments) {
      const reply = comment.replies.find(r => r.id === commentId);
      if (reply) {
        isReply = true;
        parentCommentId = comment.id;
        break;
      }
    }
    
    // Optimistic UI update
    setComments(prevComments => {
      if (isReply) {
        // It's a reply
        return prevComments.map(c => {
          if (c.id === parentCommentId) {
            return {
              ...c,
              replies: c.replies.map(r => {
                if (r.id === commentId) {
                  return {
                    ...r,
                    revealRequested: true
                  };
                }
                return r;
              })
            };
          }
          return c;
        });
      } else {
        // It's a top-level comment
        return prevComments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              revealRequested: true
            };
          }
          return c;
        });
      }
    });

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
      
      // No need to refresh all comments
    } catch (error) {
      console.error('Error requesting identity reveal:', error);
      setError('Failed to request identity reveal');
      
      // Revert the optimistic update
      fetchComments(true);
    }
  };

  // Function to approve a reveal request
  const handleApproveReveal = async (commentId: string) => {
    // No optimistic update here since we want to wait for the server's response
    // about conversation creation
    
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
      
      // Update the comment's reveal status
      setComments(prevComments => {
        // Check if it's a reply by searching through all comments
        for (const comment of prevComments) {
          const replyIndex = comment.replies.findIndex(r => r.id === commentId);
          if (replyIndex >= 0) {
            // It's a reply
            return prevComments.map(c => {
              if (c.id === comment.id) {
                const updatedReplies = [...c.replies];
                updatedReplies[replyIndex] = {
                  ...updatedReplies[replyIndex],
                  revealApproved: true
                };
                return { ...c, replies: updatedReplies };
              }
              return c;
            });
          }
        }
        
        // It's a top-level comment
        return prevComments.map(c => {
          if (c.id === commentId) {
            return { ...c, revealApproved: true };
          }
          return c;
        });
      });
      
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
          <button 
            className="ml-2 underline"
            onClick={() => {
              setError(null);
              fetchComments(true);
            }}
          >
            Refresh
          </button>
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