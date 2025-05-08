'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../components/ui/Button'

const signinSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
})

type SigninFormData = z.infer<typeof signinSchema>

export default function SigninPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })
  
  const onSubmit = async (data: SigninFormData) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Attempting to sign in with:', data.email)
      
      // First, try to sign in using credentials
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      })
      
      console.log('Sign in result:', JSON.stringify(result, null, 2))
      
      if (result?.error) {
        throw new Error(result.error || 'Invalid credentials')
      }
      
      if (result?.ok) {
        console.log('Login successful, waiting before redirect')
        
        // Add a delay to ensure the session is established
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        try {
          // Double-check that the session was created successfully
          const session = await fetch('/api/auth/session')
          const sessionData = await session.json()
          
          console.log('Session data:', sessionData)
          
          if (sessionData && sessionData.user) {
            console.log('Session confirmed, proceeding with redirect')
            
            // Get the redirect path from localStorage or default to confessions
            const redirectPath = localStorage.getItem('redirectAfterLogin') || '/confessions'
            console.log(`Redirecting to: ${redirectPath}`)
            
            // Use window.location for a full page refresh
            window.location.href = redirectPath
            
            // Clean up localStorage
            localStorage.removeItem('redirectAfterLogin')
          } else {
            console.error('Session not established after login')
            throw new Error('Session not established. Please try again.')
          }
        } catch (sessionError) {
          console.error('Error checking session:', sessionError)
          throw new Error('Error verifying your login. Please try again.')
        }
      } else {
        throw new Error('Unknown error during sign in')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Login to Crush Confessions</h1>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              UMT Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </span>
              <input
                id="email"
                type="email"
                placeholder="your.email@umt.edu.pk"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                {...register('email')}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-pink-600 hover:text-pink-700">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </span>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                {...register('password')}
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 flex flex-col items-center gap-4">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-pink-600 hover:text-pink-700 font-medium">
              Sign Up
            </Link>
          </p>
          
          <Link href="/" className="flex items-center text-sm text-gray-700 hover:text-gray-900">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
} 