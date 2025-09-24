import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_shared/cors';
import { getAuthenticatedUserData } from '../_shared/auth';
import { storage } from '../_shared/storage';
import { insertConversationSchema } from '../../shared/schema';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  const corsResult = handleCors(req, res);
  if (corsResult) return;

  try {
    const user = await getAuthenticatedUserData(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = user.id;
    const { id, resource } = req.query;

    // Handle conversation messages (with ID and resource=messages)
    if (id && typeof id === 'string' && resource === 'messages') {
      if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
      }
      
      const messages = await storage.getMessagesByConversationId(id);
      return res.json(messages);
    }

    // Handle conversations collection operations (no ID)
    switch (req.method) {
      case 'GET':
        const conversations = await storage.getConversationsByUserId(userId);
        return res.json(conversations);

      case 'POST':
        const validatedData = insertConversationSchema.parse({ ...req.body, userId });
        const conversation = await storage.createConversation(validatedData);
        return res.json(conversation);

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in conversations:', error);
    res.status(500).json({ message: 'Failed to process conversations request' });
  }
}