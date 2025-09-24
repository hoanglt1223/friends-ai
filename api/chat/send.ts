import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleCors } from '../_shared/cors';
import { requireAuth } from '../_shared/auth';
import { storage } from '../_shared/storage';
import { generateAIResponse } from '../_shared/openai';
import { insertMessageSchema } from '../../shared/schema';

async function handlerLogic(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { conversationId, content, boardMemberIds, messageType = 'text', fileUrl, metadata } = req.body;

    if (!conversationId || !content || !boardMemberIds || !Array.isArray(boardMemberIds)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // For media messages, store the fileUrl in metadata
    const messageMetadata = messageType !== 'text' && fileUrl ? 
      { ...metadata, fileUrl } : 
      metadata;

    // Save user message
    const userMessage = await storage.createMessage({
      conversationId,
      senderId: null,
      senderType: 'user',
      content,
      messageType: messageType as 'text' | 'image' | 'audio',
      metadata: messageMetadata
    });

    // Update conversation last message time
    await storage.updateConversationLastMessage(conversationId);

    // Get active board members
    const boardMembers = await storage.getBoardMembersByUserId(user.id);
    const activeBoardMembers = boardMembers.filter(member => 
      boardMemberIds.includes(member.id)
    );

    // Get conversation history for context
    const recentMessages = await storage.getMessagesByConversationId(conversationId);

    // Generate responses from each active board member
    const aiResponses: Array<{
      message: any;
      member: {
        id: string;
        name: string;
        personality: string;
        avatarUrl: string | null;
      };
    }> = [];
    for (const member of activeBoardMembers) {
      try {
        const aiResponse = await generateAIResponse(
          member,
          recentMessages.slice(-10),
          content
        );

        // Save AI response
        const aiMessage = await storage.createMessage({
          conversationId,
          senderId: member.id,
          senderType: 'ai',
          content: aiResponse.content,
          messageType: 'text',
          metadata: {
            personality: aiResponse.personality,
            followUpQuestions: aiResponse.followUpQuestions
          }
        });

        aiResponses.push({
          message: aiMessage,
          member: {
            id: member.id,
            name: member.name,
            personality: member.personality,
            avatarUrl: member.avatarUrl
          }
        });
      } catch (error) {
        console.error(`Error generating response for ${member.name}:`, error);
      }
    }

    // Update conversation last message time again
    await storage.updateConversationLastMessage(conversationId);

    res.json({
      userMessage,
      aiResponses
    });
  } catch (error) {
    console.error('Error in chat/send:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  if (handleCors(req, res)) return;

  try {
    return await requireAuth(handlerLogic)(req, res);
  } catch (error) {
    console.error('Chat send API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}