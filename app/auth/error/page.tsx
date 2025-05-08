'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string>("")
  const [errorDescription, setErrorDescription] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [showDebugInfo, setShowDebugInfo] = useState<boolean>(false)

  useEffect(() => {
    const errorParam = searchParams.get("error")
    const messageParam = searchParams.get("message")
    
    // Map error codes to user-friendly messages
    const errorMessages: Record<string, string> = {
      "Configuration": "There is a problem with the server configuration. This is typically related to environment variables or database setup.",
      "AccessDenied": "You do not have permission to sign in.",
      "Verification": "The verification link may have been used or is invalid.",
      "CredentialsSignin": "The email or password you entered is incorrect.",
      "Default": "An unexpected error occurred during authentication."
    }
    
    // Set the error message based on the error code
    if (errorParam) {
      setError(errorParam)
      setErrorDescription(errorMessages[errorParam] || errorMessages.Default)
    } else {
      setError("Unknown")
      setErrorDescription(errorMessages.Default)
    }
    
    // Set the original error message if available
    if (messageParam) {
      setErrorMessage(decodeURIComponent(messageParam))
    }
  }, [searchParams])

  // Handle configuration errors specifically
  const getConfigurationHelp = () => {
    if (error === "Configuration") {
      return (
        <div className="mt-4 text-sm text-gray-700 bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Possible Solutions:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Ensure NEXTAUTH_SECRET is properly set in your environment variables</li>
            <li>Check that NEXTAUTH_URL matches your deployment URL</li>
            <li>Verify your database connection is working correctly</li>
            <li>Make sure all required environment variables are set</li>
          </ul>
        </div>
      )
    }
    return null
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Authentication Error</h1>
          <p className="text-red-600 mt-2">{error}</p>
        </div>
        
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorDescription}
        </div>
        
        {getConfigurationHelp()}
        
        {errorMessage && showDebugInfo && (
          <div className="mt-4 mb-4 text-xs bg-gray-800 text-white p-3 rounded overflow-auto max-h-32">
            <p className="font-mono">{errorMessage}</p>
          </div>
        )}
        
        <div className="flex flex-col space-y-4">
          <Link 
            href="/auth/signin"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center"
          >
            Return to Sign In
          </Link>
          
          <Link 
            href="/"
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded text-center"
          >
            Go to Home Page
          </Link>
          
          {errorMessage && (
            <button 
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {showDebugInfo ? "Hide" : "Show"} Debug Information
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
