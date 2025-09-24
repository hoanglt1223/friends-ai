import { VercelRequest, VercelResponse } from '@vercel/node';
import * as client from "openid-client";
import { storage } from "./storage";

// Simple JWT verification for serverless (you may want to use a proper JWT library)
export async function verifyToken(token: string): Promise<any> {
  try {
    // For now, we'll use a simple approach
    // In production, you should use proper JWT verification
    const config = await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
    
    // Use the openid-client library to get user info
    const userinfo = await client.fetchUserInfo(config, token, client.skipSubjectCheck);
    return userinfo;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function getAuthenticatedUser(req: VercelRequest): Promise<any> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const claims = await verifyToken(token);
  
  if (!claims) {
    return null;
  }
  
  // Upsert user in database
  const user = await storage.upsertUser({
    id: claims.sub,
    email: claims.email,
    firstName: claims.given_name || claims.name?.split(' ')[0] || '',
    lastName: claims.family_name || claims.name?.split(' ').slice(1).join(' ') || '',
    profileImageUrl: claims.picture,
  });
  
  return { user, claims };
}

export function requireAuth(handler: (req: VercelRequest, res: VercelResponse, user: any) => Promise<any>) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const authResult = await getAuthenticatedUser(req);
    
    if (!authResult) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    return await handler(req, res, authResult.user);
  };
}

// For development/testing - simple session-based auth fallback
export function getSessionUser(req: VercelRequest): any {
  // This would need to be implemented based on your session strategy
  // For now, return null to force token-based auth
  return null;
}

// Helper function to get authenticated user data directly
export async function getAuthenticatedUserData(req: VercelRequest): Promise<any> {
  const authResult = await getAuthenticatedUser(req);
  return authResult ? authResult.user : null;
}