import {
  users,
  boardMembers,
  conversations,
  messages,
  systemSettings,
  type User,
  type UpsertUser,
  type BoardMember,
  type InsertBoardMember,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type SystemSetting,
  type InsertSystemSetting,
} from "../../shared/schema";
import { db } from "./database";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Board Member operations
  getBoardMembersByUserId(userId: string): Promise<BoardMember[]>;
  createBoardMember(boardMember: InsertBoardMember): Promise<BoardMember>;
  updateBoardMember(id: string, boardMember: Partial<InsertBoardMember>): Promise<BoardMember>;
  deleteBoardMember(id: string): Promise<void>;
  getBoardMember(id: string): Promise<BoardMember | undefined>;

  // Conversation operations
  getConversationsByUserId(userId: string): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: string): Promise<Conversation | undefined>;
  updateConversationLastMessage(id: string): Promise<void>;

  // Message operations
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // System Settings operations
  getSystemSettings(): Promise<SystemSetting[]>;
  updateSystemSetting(key: string, value: string): Promise<SystemSetting>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;

  // Analytics
  getUserCount(): Promise<number>;
  getTodayMessageCount(): Promise<number>;
  getPremiumUserCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!userData.id) {
      // If no ID provided, create a new user
      const [newUser] = await db
        .insert(users)
        .values({ ...userData, createdAt: new Date(), updatedAt: new Date() })
        .returning();
      return newUser;
    }

    const existingUser = await this.getUser(userData.id);
    
    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, userData.id))
        .returning();
      return updatedUser;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({ ...userData, createdAt: new Date(), updatedAt: new Date() })
        .returning();
      return newUser;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Board Member operations
  async getBoardMembersByUserId(userId: string): Promise<BoardMember[]> {
    return await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.userId, userId), eq(boardMembers.isActive, true)))
      .orderBy(desc(boardMembers.createdAt));
  }

  async createBoardMember(boardMember: InsertBoardMember): Promise<BoardMember> {
    const [newMember] = await db
      .insert(boardMembers)
      .values({ ...boardMember, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return newMember;
  }

  async updateBoardMember(id: string, boardMember: Partial<InsertBoardMember>): Promise<BoardMember> {
    const [updatedMember] = await db
      .update(boardMembers)
      .set({ ...boardMember, updatedAt: new Date() })
      .where(eq(boardMembers.id, id))
      .returning();
    return updatedMember;
  }

  async deleteBoardMember(id: string): Promise<void> {
    await db
      .update(boardMembers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(boardMembers.id, id));
  }

  async getBoardMember(id: string): Promise<BoardMember | undefined> {
    const result = await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.id, id), eq(boardMembers.isActive, true)))
      .limit(1);
    return result[0];
  }

  // Conversation operations
  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values({ ...conversation, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return newConversation;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return result[0];
  }

  async updateConversationLastMessage(id: string): Promise<void> {
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, id));
  }

  // Message operations
  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({ ...message, createdAt: new Date() })
      .returning();
    return newMessage;
  }

  // System Settings operations
  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    const existing = await this.getSystemSetting(key);
    
    if (existing) {
      const [updated] = await db
        .update(systemSettings)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemSettings)
        .values({ 
          key, 
          value, 
          updatedAt: new Date() 
        })
        .returning();
      return created;
    }
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
    return result[0];
  }

  // Analytics
  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  async getTodayMessageCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.createdAt} >= ${todayTimestamp}`);
    return result[0].count;
  }

  async getPremiumUserCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionTier, "premium"));
    return result[0].count;
  }
}

export const storage = new DatabaseStorage();