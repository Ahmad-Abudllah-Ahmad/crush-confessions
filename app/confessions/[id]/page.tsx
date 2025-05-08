'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../../../components/layout/Navbar'
import CommentSection from '../../../components/CommentSection'
import { Button } from '../../../components/ui/Button'

interface Confession {
  id: string
  content: string
  timestamp: string
  status: string
  visibility: string
  likes: number
  comments: number
  targetUserName?: string
  senderName?: string
  hasLiked: boolean
  isSender: boolean
  isReceiver: boolean
  senderRevealed: boolean
  receiverRevealed: boolean
  mutualReveal: boolean
  chatChannelId?: string | null
}

export default function ConfessionDetailPage({ params }: { params: { id: string } }) {
  const confessionId = params.id
  const { data: session, status } = useSession()
  const router = useRouter()
  const [confession, setConfession] = useState<Confession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])
  
  // Fetch confession
  useEffect(() => {
    if (status === 'authenticated') {
      fetchConfession()
    }
  }, [status, confessionId])
  
  const fetchConfession = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/confessions?confessionId=${confessionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch confession')
      }
      
      const data = await response.json()
      setConfession(data.confessions?.[0] || null)

      if (!data.confessions?.[0]) {
        throw new Error('Confession not found')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching the confession')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleLike = async () => {
    if (!confession) return
    
    try {
      const response = await fetch(`/api/confessions/${confession.id}/like`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to like confession')
      }
      
      // Update UI optimistically
      setConfession(prev => {
        if (!prev) return prev
        return {
          ...prev,
          likes: prev.hasLiked ? prev.likes - 1 : prev.likes + 1,
          hasLiked: !prev.hasLiked
        }
      })
    } catch (err) {
      console.error('Error liking confession:', err)
    }
  }
  
  const handleReveal = async () => {
    if (!confession) return
    
    try {
      const response = await fetch(`/api/confessions/${confession.id}/reveal`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to reveal interest')
      }
      
      const data = await response.json()
      
      // Refresh confession first to ensure UI updates
      await fetchConfession()
      
      // Check if this is a mutual reveal and whether the conversation already exists
      if (data.mutualReveal) {
        if (data.conversationAlreadyExists) {
          if (confirm('Both users have revealed interest! A chat already exists. Would you like to go to your messages?')) {
            router.push(`/chat?conversationId=${data.conversationId}`)
          }
        } else {
          if (confirm('Both users have revealed interest! A new chat has been created. Would you like to go to your messages?')) {
            router.push(`/chat?conversationId=${data.conversationId}`)
          }
        }
      } else {
        // For non-mutual reveals, show a simple success message
        alert('Interest revealed successfully!')
      }
    } catch (err) {
      console.error('Error revealing interest:', err)
      alert('Failed to reveal interest. Please try again.')
    }
  }
  
  const handleStartChat = () => {
    if (!confession || !confession.chatChannelId) return
    
    router.push(`/chat?conversationId=${confession.chatChannelId}`)
  }

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
  
  // Add delete confession handler
  const handleDelete = async () => {
    if (!confession) return;
    
    if (!confirm('Are you sure you want to delete this confession? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/confessions/${confession.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete confession');
      }
      
      // Redirect back to confessions page after deletion
      router.push('/confessions');
      alert('Confession deleted successfully');
    } catch (err) {
      console.error('Error deleting confession:', err);
      alert('Failed to delete confession. Please try again.');
    }
  };
  
  // Logic for showing the reveal button and its text
  const showRevealButton = () => {
    if (!confession) return false;
    
    if (confession.status === 'CONNECTED' || confession.mutualReveal) return false;
    
    if (confession.isSender && confession.senderRevealed) return false;
    if (confession.isReceiver && confession.receiverRevealed) return false;
    
    return true;
  };

  const getRevealButtonText = () => {
    if (!confession) return 'Reveal Interest';
    
    // Different text for already revealed interest
    if (confession.status === 'REVEALED') {
      return 'Confirm Interest';
    }
    
    return 'Reveal Interest';
  };
  
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-purple-600">Loading confession...</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/confessions" className="inline-flex items-center text-purple-600 hover:text-purple-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Confessions
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              className="ml-4 text-red-500 underline"
              onClick={() => fetchConfession()}
            >
              Try Again
            </button>
          </div>
        )}
        
        {confession ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {confession.visibility === 'PUBLIC' ? 'Public Confession' : 'Private Confession'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(confession.timestamp)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {confession.isSender && (
                    <button 
                      onClick={handleDelete}
                      className="text-red-500 hover:text-red-700 mr-3"
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
                  <button 
                    onClick={handleLike}
                    className={`flex items-center text-sm ${confession.hasLiked ? 'text-red-500' : 'text-gray-500'}`}
                  >
                    {confession.hasLiked ? '❤️' : '🤍'} {confession.likes}
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-800 text-lg whitespace-pre-wrap">{confession.content}</p>
              </div>
              
              <div className="flex flex-wrap justify-between items-center border-t border-gray-200 pt-4">
                <div>
                  {confession.targetUserName && (
                    <p className="text-sm text-gray-600">
                      To: <span className="font-medium">{confession.targetUserName}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    From: <span className="font-medium">{confession.senderName}</span>
                  </p>
                </div>
                
                <div className="mt-3 sm:mt-0">
                  {showRevealButton() && (
                    <Button 
                      variant="primary" 
                      onClick={handleReveal}
                      className="ml-2"
                    >
                      {getRevealButtonText()}
                    </Button>
                  )}
                  
                  {confession.mutualReveal && confession.chatChannelId && (
                    <Button
                      variant="primary"
                      onClick={handleStartChat}
                    >
                      Start Chat
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6">
              <CommentSection 
                confessionId={confession.id} 
                isConfessionOwner={confession.isSender} 
              />
            </div>
          </div>
        ) : (
          <div className="text-center p-8 bg-white rounded-lg shadow">
            <p className="text-gray-600">Confession not found</p>
          </div>
        )}
      </main>
    </div>
  )
} 