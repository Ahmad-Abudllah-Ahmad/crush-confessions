'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Navbar from '../../components/layout/Navbar'
import { Button } from '../../components/ui/Button'

interface UserProfile {
  id: string
  email: string
  displayName: string | null
  profilePicture: string | null
  registrationDate: string
}

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [myConfessions, setMyConfessions] = useState<any[]>([])
  const [receivedConfessions, setReceivedConfessions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'sent' | 'received'>('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])
  
  // Fetch user profile data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserProfile()
    }
  }, [status])
  
  const fetchUserProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/profile')
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const data = await response.json()
      setUserProfile(data.profile)
      setMyConfessions(data.sentConfessions || [])
      setReceivedConfessions(data.receivedConfessions || [])
      
      // Update form with current values
      reset({
        displayName: data.profile.displayName || '',
      })
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching your profile')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userProfile?.displayName || '',
    },
  })
  
  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }
      
      const result = await response.json()
      setUserProfile(prev => prev ? { ...prev, ...data } : null)
      setSuccess('Profile updated successfully')
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your profile')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }
  
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-xl text-purple-600">Loading profile...</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-purple-800 mb-6">Your Profile</h1>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-4 text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`px-4 py-4 text-sm font-medium ${
                    activeTab === 'sent'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Confessions ({myConfessions.length})
                </button>
                <button
                  onClick={() => setActiveTab('received')}
                  className={`px-4 py-4 text-sm font-medium ${
                    activeTab === 'received'
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Received Confessions ({receivedConfessions.length})
                </button>
              </nav>
            </div>
            
            {activeTab === 'profile' && (
              <div className="p-6">
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                  </div>
                )}
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <div className="bg-gray-100 px-3 py-2 rounded-md text-gray-700">
                      {userProfile?.email || session?.user?.email}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Your email address cannot be changed
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="How you want to appear to others"
                      {...register('displayName')}
                      disabled={isSaving}
                    />
                    {errors.displayName && (
                      <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
                    )}
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSaving}
                      className="w-full md:w-auto"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                  <p className="text-gray-600 mb-4">
                    Deleting your account will permanently remove all your data, including your confessions and messages.
                  </p>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        // Delete account API call would go here
                      }
                    }}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            )}
            
            {activeTab === 'sent' && (
              <div className="p-6">
                {myConfessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">You haven&apos;t sent any confessions yet.</p>
                    <Button
                      variant="primary"
                      className="mt-4"
                      onClick={() => router.push('/confessions/new')}
                    >
                      Create Confession
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myConfessions.map((confession: any) => (
                      <div key={confession.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-2">
                          {new Date(confession.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <p className="text-gray-800 mb-2">{confession.content}</p>
                        <div className="flex justify-between">
                          <div className="text-sm">
                            Status: <span className="font-medium">{confession.status}</span>
                          </div>
                          {confession.targetUserName && (
                            <div className="text-sm text-purple-600">
                              To: {confession.targetUserName}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'received' && (
              <div className="p-6">
                {receivedConfessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">You haven&apos;t received any confessions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedConfessions.map((confession: any) => (
                      <div key={confession.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-500 mb-2">
                          {new Date(confession.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <p className="text-gray-800 mb-2">{confession.content}</p>
                        <div className="flex justify-between">
                          <div className="text-sm">
                            Status: <span className="font-medium">{confession.status}</span>
                          </div>
                          {confession.status === 'ACTIVE' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                // Handle reveal interest
                              }}
                            >
                              Reveal Interest
                            </Button>
                          )}
                          {confession.status === 'CONNECTED' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => router.push('/chat')}
                            >
                              Go to Chat
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 