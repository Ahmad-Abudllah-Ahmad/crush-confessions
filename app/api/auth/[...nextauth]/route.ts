import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '../../../../lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { getAuthOptions } from '../../../../lib/auth-config'

// Extend the NextAuth types
declare module 'next-auth' {
  interface User {
    id: string
    accountStatus: string
  }
  
  interface Session {
    user: {
      id: string
      accountStatus: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    accountStatus: string
  }
}

// Create auth handler with simplified config
const handler = NextAuth({
  ...getAuthOptions(),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials) {
            console.error('No credentials provided')
            return null
          }
          
          // Input validation
          const credentialsSchema = z.object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          
          const result = credentialsSchema.safeParse(credentials)
          if (!result.success) {
            console.error('Invalid credentials format:', result.error)
            return null
          }
          
          const { email, password } = result.data
          console.log(`Attempting to authenticate user: ${email}`)
          
          // Find user
          const user = await prisma.user.findUnique({
            where: { email }
          })
          
          if (!user) {
            console.error(`No user found with email: ${email}`)
            return null
          }
          
          // Check password
          const isPasswordValid = await bcrypt.compare(password, user.password)
          
          if (!isPasswordValid) {
            console.error(`Invalid password for user: ${email}`)
            return null
          }
          
          console.log(`User authenticated successfully: ${email}`)
          
          // Return user without password but ensure all required fields are included
          return {
            id: user.id,
            email: user.email,
            name: user.displayName || null,
            accountStatus: user.accountStatus || 'active',
            image: user.profilePicture || null
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Add user data to the token when first created
        token.id = user.id
        token.accountStatus = user.accountStatus
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        // Add token data to the session
        session.user.id = token.id
        session.user.accountStatus = token.accountStatus
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  // Add debug mode for better error visibility
  debug: process.env.NODE_ENV !== 'production',
  // Session and callbacks are now managed in auth-config.ts
})

// Export the handler
export { handler as GET, handler as POST } 