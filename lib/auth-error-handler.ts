// Custom error handler for NextAuth
import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Custom error handler for NextAuth errors
 * This helps provide better error messages and logging for authentication issues
 */
export async function handleAuthError(
  req: NextApiRequest,
  res: NextApiResponse,
  error: Error
) {
  console.error('Authentication error:', error);

  // Log detailed information for debugging
  console.error({
    url: req.url,
    headers: req.headers,
    error: error.message,
    stack: error.stack,
  });

  // Determine the error type and redirect to the appropriate error page
  const errorType = error.name || 'Default';
  const errorMessage = encodeURIComponent(error.message || 'Unknown error');
  
  // Redirect to the error page with the error information
  res.redirect(`/auth/error?error=${errorType}&message=${errorMessage}`);
  
  return res;
}
