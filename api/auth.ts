import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleError } from './_shared/error-handler';
import { setCorsHeaders, handleOptions } from './_shared/cors';
import { storage } from './_shared/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  try {
    const { action } = req.query;

    // Handle GET request - check authentication status
    if (req.method === 'GET') {
      // Check if login is bypassed via environment variable
      if (process.env.VITE_SKIP_LOGIN === 'true' || process.env.NODE_ENV === 'development' && process.env.VITE_SKIP_AUTH === 'true') {
        const defaultUser = {
          id: "dev-user",
          email: "developer@example.com",
          firstName: "Developer",
          lastName: "User"
        };
        return res.json({ user: defaultUser });
      }

      // For production, this would check JWT or session
      return res.status(401).json({ message: "Authentication required" });
    }

    // Handle POST request - login/logout based on action parameter
    if (req.method === 'POST') {
      // Handle logout action
      if (action === 'logout') {
        // For serverless functions, we don't have persistent sessions
        // In production, this would clear JWT tokens or session cookies
        return res.json({ message: 'Logged out successfully' });
      }

      // Handle login action (default)
      const { email, firstName, lastName } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // In development, create a simple user
      if (process.env.NODE_ENV === 'development') {
        const user = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email,
          firstName: firstName || 'User',
          lastName: lastName || '',
          profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        };

        return res.json({ user, message: 'Logged in successfully' });
      }

      // For production with storage service
      try {
        const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const user = await storage.upsertUser({
          id: userId,
          email,
          firstName: firstName || 'User',
          lastName: lastName || '',
          profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        });

        return res.json({ user, message: 'Logged in successfully' });
      } catch (storageError) {
        console.error('Storage error:', storageError);
        // Fallback to simple user creation
        const user = {
          id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          email,
          firstName: firstName || 'User',
          lastName: lastName || '',
          profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        };

        return res.json({ user, message: 'Logged in successfully' });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error: any) {
    return handleError(res, error, 'Auth API');
  }
}
