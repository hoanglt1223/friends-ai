import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_shared/cors';
import { requireAuth } from '../_shared/auth';
import { storage } from '../_shared/storage';
import { createPersonalitySystemPrompt, defaultPersonalities } from '../_shared/openai';
import { insertBoardMemberSchema } from '../../shared/schema';

async function handlerLogic(req: VercelRequest, res: VercelResponse, user: any) {
  const userId = user.id;
  const { id, action } = req.query;

  // Handle initialize action
  if (action === 'initialize' && req.method === 'POST') {
    // Check if user already has board members
    const existingMembers = await storage.getBoardMembersByUserId(userId);
    if (existingMembers.length > 0) {
      return res.json({ 
        message: 'Board members already initialized',
        members: existingMembers 
      });
    }

    // Create default board members (first 2 personalities)
    const defaultMembersToCreate = defaultPersonalities.slice(0, 2);
    const createdMembers: any[] = [];

    for (const personality of defaultMembersToCreate) {
      const systemPrompt = createPersonalitySystemPrompt(personality.type);
      
      const member = await storage.createBoardMember({
        userId,
        name: personality.name,
        personality: personality.type,
        description: personality.description,
        avatarUrl: personality.avatarUrl,
        systemPrompt,
        isActive: true
      });
      
      createdMembers.push(member);
    }

    return res.json({ 
      message: 'Default board members created successfully',
      members: createdMembers 
    });
  }

  // Handle individual board member operations (with ID)
  if (id && typeof id === 'string') {
    switch (req.method) {
      case 'PUT':
        const validatedUpdateData = insertBoardMemberSchema.partial().parse(req.body);
        const updatedMember = await storage.updateBoardMember(id, validatedUpdateData);
        return res.json(updatedMember);

      case 'DELETE':
        await storage.deleteBoardMember(id);
        return res.json({ success: true });

      default:
        return res.status(405).json({ message: 'Method not allowed' });
    }
  }

  // Handle board members collection operations (no ID)
  switch (req.method) {
    case 'GET':
      const members = await storage.getBoardMembersByUserId(userId);
      return res.json(members);

    case 'POST':
      // Check subscription limits
      const existingMembers = await storage.getBoardMembersByUserId(userId);
      const maxMembers = user.subscriptionTier === 'premium' ? 5 : 2;
      
      if (existingMembers.length >= maxMembers) {
        return res.status(403).json({ 
          message: `You've reached the limit of ${maxMembers} board members. Upgrade to add more.` 
        });
      }

      const validatedData = insertBoardMemberSchema.parse({ ...req.body, userId });
      
      // Generate system prompt
      const systemPrompt = createPersonalitySystemPrompt(
        validatedData.personality,
        validatedData.description
      );
      
      const member = await storage.createBoardMember({
        ...validatedData,
        systemPrompt
      });
      
      return res.json(member);

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
    console.error('Board members API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}