'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  
  // Fetch unread message count
  useEffect(() => {
    if (status !== 'authenticated') return
    
    const fetchUnreadMessages = async () => {
      try {
        const response = await fetch('/api/conversations/unread')
        if (response.ok) {
          const data = await response.json()
          setUnreadMessages(data.totalUnreadMessages || 0)
        }
      } catch (error) {
        console.error('Error fetching unread messages:', error)
      }
    }
    
    // Initial fetch
    fetchUnreadMessages()
    
    // Poll every 3 seconds for real-time updates
    const interval = setInterval(fetchUnreadMessages, 3000)
    
    // If user is on the chat page, update unread count when they navigate away
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadMessages()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Clear unread count when on the chat page
    if (pathname === '/chat') {
      setUnreadMessages(0)
    }
    
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [status, pathname])
  
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-purple-800">
                CrushConfessions
              </h1>
            </Link>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {status === 'authenticated' ? (
                <>
                  <NavLink href="/confessions">Confessions</NavLink>
                  <div className="relative">
                    <NavLink href="/chat">Messages</NavLink>
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </div>
                  <NavLink href="/profile">Profile</NavLink>
                  <button
                    onClick={() => {
                      signOut({ redirect: false }).then(() => {
                        router.push('/');
                      });
                    }}
                    className="text-gray-600 hover:text-purple-800 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <NavLink href="/auth/signin">Sign In</NavLink>
                  <Link
                    href="/auth/signup"
                    className="bg-purple-600 text-white hover:bg-purple-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
          
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-purple-800 p-2"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {status === 'authenticated' ? (
              <>
                <MobileNavLink href="/confessions">Confessions</MobileNavLink>
                <div className="relative inline-block w-full">
                  <MobileNavLink href="/chat">Messages</MobileNavLink>
                  {unreadMessages > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>
                <MobileNavLink href="/profile">Profile</MobileNavLink>
                <button
                  onClick={() => {
                    signOut({ redirect: false }).then(() => {
                      router.push('/');
                    });
                  }}
                  className="w-full text-left text-gray-600 hover:bg-gray-100 hover:text-purple-800 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <MobileNavLink href="/auth/signin">Sign In</MobileNavLink>
                <MobileNavLink href="/auth/signup">Sign Up</MobileNavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

// Desktop Navigation Link
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-gray-600 hover:text-purple-800 px-3 py-2 rounded-md text-sm font-medium"
    >
      {children}
    </Link>
  )
}

// Mobile Navigation Link
function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-gray-600 hover:bg-gray-100 hover:text-purple-800 block px-3 py-2 rounded-md text-base font-medium"
    >
      {children}
    </Link>
  )
} 