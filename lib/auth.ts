import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { NextAuthOptions } from 'next-auth';

// Define extended session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accountStatus: string;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    accountStatus: string;
    displayName?: string | null;
    profilePicture?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  // Only use adapter for database sessions, not for JWT strategy
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Input validation
          const credentialsSchema = z.object({
            email: z.string().email(),
            password: z.string().min(1),
          });
          
          const result = credentialsSchema.safeParse(credentials);
          if (!result.success) {
            console.error('Invalid credentials format');
            throw new Error('Invalid credentials');
          }
          
          const { email, password } = result.data;
          
          console.log('Looking for user with email:', email);
          
          // Find user
          const user = await prisma.user.findUnique({
            where: { email },
          });
          
          if (!user) {
            console.error('No user found with email:', email);
            throw new Error('No user found with this email');
          }
          
          // Check password
          const isPasswordValid = await bcrypt.compare(password, user.password);
          
          if (!isPasswordValid) {
            console.error('Invalid password for user:', email);
            throw new Error('Invalid password');
          }
          
          // Check account status
          if (user.accountStatus !== 'ACTIVE') {
            console.error('User account is not active:', user.accountStatus);
            throw new Error('Account is not active');
          }
          
          console.log('User authenticated successfully:', email);
          
          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return userWithoutPassword as any;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.email = user.email as string;
        token.accountStatus = user.accountStatus as string;
        // @ts-ignore - User from database has these properties
        token.displayName = user.displayName || null;
        // @ts-ignore - User from database has these properties
        token.profilePicture = user.profilePicture || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.email = token.email as string | null;
        session.user.accountStatus = token.accountStatus;
        // Map displayName to name for compatibility
        session.user.name = token.displayName || null;
        // Map profilePicture to image for compatibility
        session.user.image = token.profilePicture || null;
      }
      return session;
    },
  },
}; 