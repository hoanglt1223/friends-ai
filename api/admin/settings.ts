import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_shared/cors';
import { requireAuth } from '../_shared/auth';
import { storage } from '../_shared/storage';

async function handlerLogic(req: VercelRequest, res: VercelResponse, user: any) {
    // TODO: Add admin role check here

    switch (req.method) {
      case 'GET':
        const settings = await storage.getSystemSettings();
        return res.json(settings);

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  const corsResult = handleCors(req, res);
  if (corsResult) return corsResult;

  try {
    return await requireAuth(handlerLogic)(req, res);
  } catch (error) {
    console.error('Settings API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}