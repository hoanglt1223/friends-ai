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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;

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
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionTier: "premium",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Board Member operations
  async getBoardMembersByUserId(userId: string): Promise<BoardMember[]> {
    return await db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.userId, userId), eq(boardMembers.isActive, true)))
      .orderBy(boardMembers.createdAt);
  }

  async createBoardMember(boardMember: InsertBoardMember): Promise<BoardMember> {
    const [member] = await db
      .insert(boardMembers)
      .values(boardMember)
      .returning();
    return member;
  }

  async updateBoardMember(id: string, boardMember: Partial<InsertBoardMember>): Promise<BoardMember> {
    const [member] = await db
      .update(boardMembers)
      .set({ ...boardMember, updatedAt: new Date() })
      .where(eq(boardMembers.id, id))
      .returning();
    return member;
  }

  async deleteBoardMember(id: string): Promise<void> {
    await db
      .update(boardMembers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(boardMembers.id, id));
  }

  async getBoardMember(id: string): Promise<BoardMember | undefined> {
    const [member] = await db
      .select()
      .from(boardMembers)
      .where(eq(boardMembers.id, id));
    return member;
  }

  // Conversation operations
  async getConversationsByUserId(userId: string): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [conv] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return conv;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async updateConversationLastMessage(id: string): Promise<void> {
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
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
    const [msg] = await db
      .insert(messages)
      .values(message)
      .returning();
    return msg;
  }

  // System Settings operations
  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings);
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
    const [setting] = await db
      .insert(systemSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key));
    return setting;
  }

  // Analytics
  async getUserCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    return result.count;
  }

  async getTodayMessageCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.createdAt} >= ${today}`);
    return result.count;
  }

  async getPremiumUserCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.subscriptionTier, "premium"));
    return result.count;
  }
}

export const storage = new DatabaseStorage();
