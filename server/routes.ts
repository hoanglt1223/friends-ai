import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { generateAIResponse, createPersonalitySystemPrompt, defaultPersonalities } from "./openai";
import { 
  insertBoardMemberSchema, 
  insertConversationSchema, 
  insertMessageSchema,
  insertSystemSettingSchema 
} from "@shared/schema";

// Initialize Stripe only if the secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Board Member routes
  app.get('/api/board-members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const members = await storage.getBoardMembersByUserId(userId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching board members:", error);
      res.status(500).json({ message: "Failed to fetch board members" });
    }
  });

  app.post('/api/board-members', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check subscription limits
      const existingMembers = await storage.getBoardMembersByUserId(userId);
      const maxMembers = user?.subscriptionTier === 'premium' ? 5 : 2;
      
      if (existingMembers.length >= maxMembers) {
        return res.status(403).json({ 
          message: `You've reached the limit of ${maxMembers} board members. Upgrade to add more.` 
        });
      }

      const validatedData = insertBoardMemberSchema.parse({ ...req.body, userId });
      
      // Generate system prompt
      const systemPrompt = await createPersonalitySystemPrompt(
        validatedData.personality,
        req.body.customDescription
      );
      
      const member = await storage.createBoardMember({
        ...validatedData,
        systemPrompt
      });
      
      res.json(member);
    } catch (error) {
      console.error("Error creating board member:", error);
      res.status(500).json({ message: "Failed to create board member" });
    }
  });

  app.put('/api/board-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertBoardMemberSchema.partial().parse(req.body);
      const member = await storage.updateBoardMember(req.params.id, validatedData);
      res.json(member);
    } catch (error) {
      console.error("Error updating board member:", error);
      res.status(500).json({ message: "Failed to update board member" });
    }
  });

  app.delete('/api/board-members/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteBoardMember(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting board member:", error);
      res.status(500).json({ message: "Failed to delete board member" });
    }
  });

  // Initialize default board members for new users
  app.post('/api/board-members/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingMembers = await storage.getBoardMembersByUserId(userId);
      
      if (existingMembers.length === 0) {
        // Create default supportive and practical members for free users
        const defaultMembers = defaultPersonalities.slice(0, 2);
        
        for (const memberTemplate of defaultMembers) {
          const systemPrompt = await createPersonalitySystemPrompt(memberTemplate.personality);
          
          await storage.createBoardMember({
            userId,
            name: memberTemplate.name,
            personality: memberTemplate.personality,
            description: memberTemplate.description,
            avatarUrl: memberTemplate.avatarUrl,
            systemPrompt,
            isActive: true
          });
        }
      }
      
      const members = await storage.getBoardMembersByUserId(userId);
      res.json(members);
    } catch (error) {
      console.error("Error initializing board members:", error);
      res.status(500).json({ message: "Failed to initialize board members" });
    }
  });

  // Conversation routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getConversationsByUserId(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertConversationSchema.parse({ ...req.body, userId });
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesByConversationId(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // System Settings routes (Admin)
  app.get('/api/admin/settings', isAuthenticated, async (req: any, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/admin/settings/:key', isAuthenticated, async (req: any, res) => {
    try {
      const { value } = req.body;
      const setting = await storage.updateSystemSetting(req.params.key, value);
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Analytics routes (Admin)
  app.get('/api/admin/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const [userCount, todayMessages, premiumUsers] = await Promise.all([
        storage.getUserCount(),
        storage.getTodayMessageCount(),
        storage.getPremiumUserCount()
      ]);

      res.json({
        totalUsers: userCount,
        todayMessages,
        premiumUsers,
        conversionRate: userCount > 0 ? ((premiumUsers / userCount) * 100).toFixed(1) : 0
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Stripe subscription routes
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: "Payment processing is currently unavailable" });
    }
    const userId = req.user.claims.sub;
    let user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe!.subscriptions.retrieve(user.stripeSubscriptionId);
        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
        return;
      } catch (error) {
        console.error("Error retrieving existing subscription:", error);
      }
    }

    if (!user.email) {
      return res.status(400).json({ message: 'No user email on file' });
    }

    try {
      const customer = await stripe!.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
      });

      const subscription = await stripe!.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // Replace with actual price ID
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time chat
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true
  });

  // Ping interval to keep connections alive
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, 30000); // Ping every 30 seconds

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connection established from:', req.socket.remoteAddress);
    
    // Set connection timeout
    (ws as any).isAlive = true;
    
    // Handle pong responses
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'chat_message') {
          const { conversationId, content, userId, boardMemberIds } = message;

          // Save user message
          const userMessage = await storage.createMessage({
            conversationId,
            senderId: null,
            senderType: 'user',
            content,
            messageType: 'text'
          });

          // Update conversation last message time
          await storage.updateConversationLastMessage(conversationId);

          // Broadcast user message
          ws.send(JSON.stringify({
            type: 'message_sent',
            message: userMessage
          }));

          // Generate AI responses from active board members
          const boardMembers = await storage.getBoardMembersByUserId(userId);
          const activeBoardMembers = boardMembers.filter(member => 
            boardMemberIds.includes(member.id)
          );

          // Get conversation history for context
          const recentMessages = await storage.getMessagesByConversationId(conversationId);
          const conversationHistory = recentMessages.slice(-10).map(msg => ({
            role: msg.senderType === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }));

          // Generate responses from each active board member
          for (const member of activeBoardMembers) {
            try {
              // Simulate typing delay
              setTimeout(async () => {
                ws.send(JSON.stringify({
                  type: 'member_typing',
                  memberId: member.id,
                  memberName: member.name
                }));

                const aiResponse = await generateAIResponse(
                  content,
                  {
                    name: member.name,
                    personality: member.personality,
                    systemPrompt: member.systemPrompt
                  },
                  conversationHistory
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

                // Update conversation last message time
                await storage.updateConversationLastMessage(conversationId);

                // Send AI response
                ws.send(JSON.stringify({
                  type: 'ai_response',
                  message: aiMessage,
                  member: {
                    id: member.id,
                    name: member.name,
                    personality: member.personality,
                    avatarUrl: member.avatarUrl
                  }
                }));

                // Stop typing
                ws.send(JSON.stringify({
                  type: 'member_stop_typing',
                  memberId: member.id
                }));
              }, Math.random() * 2000 + 1000); // Random delay between 1-3 seconds

            } catch (error) {
              console.error(`Error generating response for ${member.name}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message'
        }));
      }
    });

    ws.on('close', (code, reason) => {
      console.log('WebSocket connection closed:', code, reason.toString());
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection_established',
      message: 'Connected to AI Board chat'
    }));
  });

  return httpServer;
}
