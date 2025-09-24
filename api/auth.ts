import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleError } from './_shared/error-handler';
import { setCorsHeaders, handleOptions } from './_shared/cors';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
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

    // TODO: Implement proper authentication with JWT or similar
    return res.status(401).json({ message: "Authentication not implemented for serverless" });
  } catch (error: any) {
    return handleError(res, error, 'Auth check API');
  }
}
