// Authentication configuration for both development and production environments
import { AuthOptions } from 'next-auth';

// Determine the correct NEXTAUTH_URL based on environment
export const getAuthUrl = (): string => {
  // For deployment environments
  if (process.env.NEXTAUTH_URL) {
    // Strip any path segments and ensure we use just the base URL
    try {
      const url = new URL(process.env.NEXTAUTH_URL);
      return `${url.protocol}//${url.host}`;
    } catch (e) {
      console.error("Invalid NEXTAUTH_URL format:", e);
      return process.env.NEXTAUTH_URL;
    }
  }
  
  // Fallback for development
  return 'http://localhost:3000';
};

// Get the NextAuth secret
export const getAuthSecret = (): string => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error('NEXTAUTH_SECRET is not set, using fallback secret');
    return 'fallback-secret-do-not-use-in-production';
  }
  return secret;
};

// Export common auth options to be used across the application
export const getAuthOptions = (): Partial<AuthOptions> => {
  const isProd = process.env.NODE_ENV === 'production';
  const authUrl = getAuthUrl();
  
  return {
    secret: getAuthSecret(),
    debug: true, // Enable debug mode to help troubleshoot issues
    useSecureCookies: isProd,
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    cookies: {
      sessionToken: {
        name: `next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: isProd,
          maxAge: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    callbacks: {
      // This callback is called whenever a JSON Web Token is created or updated
      async jwt({ token, user }) {
        if (user) {
          // Add user data to the token when first created
          token.id = user.id;
          token.accountStatus = user.accountStatus;
        }
        return token;
      },
      // This callback is called whenever a session is checked
      async session({ session, token }) {
        if (session.user && token) {
          // Add token data to the session
          session.user.id = token.id;
          session.user.accountStatus = token.accountStatus;
        }
        return session;
      },
    },
    logger: {
      error: (code, metadata) => {
        console.error(`Auth error: ${code}`, metadata);
      },
      warn: (code) => {
        console.warn(`Auth warning: ${code}`);
      },
      debug: (code, metadata) => {
        if (!isProd) {
          console.debug(`Auth debug: ${code}`, metadata);
        }
      },
    },
    // Custom error handling is implemented in the error page component
  };
};
