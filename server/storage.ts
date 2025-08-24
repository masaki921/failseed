import { type Entry, type InsertEntry, type UpdateHint, type ConversationMessage, type User, type InsertUser, type LoginUser, entries, users } from "@shared/schema";
import { db } from "./db";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Entry operations
  getEntry(id: string, userId: string): Promise<Entry | undefined>;
  createConversation(text: string, userId: string): Promise<Entry>;
  updateConversationHistory(id: string, messages: ConversationMessage[], conversationTurn?: number): Promise<Entry>;
  finalizeConversation(id: string, growth: string, hint?: string): Promise<Entry>;
  updateHintStatus(id: string, hintStatus: UpdateHint["hintStatus"]): Promise<Entry | undefined>;
  getAllCompletedEntries(userId: string): Promise<Entry[]>;
  
  // User operations
  createUser(userData: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getEntry(id: string, userId: string): Promise<Entry | undefined> {
    const [entry] = await db.select().from(entries).where(
      and(eq(entries.id, id), eq(entries.userId, userId))
    );
    return entry || undefined;
  }

  async createConversation(text: string, userId: string): Promise<Entry> {
    const [entry] = await db
      .insert(entries)
      .values({
        userId,
        text,
        conversationHistory: null,
        conversationTurn: 1,
        aiGrowth: null,
        aiHint: null,
        hintStatus: "none",
        isCompleted: 0,
      })
      .returning();
    return entry;
  }

  async updateConversationHistory(id: string, messages: ConversationMessage[], conversationTurn?: number): Promise<Entry> {
    const [entry] = await db
      .update(entries)
      .set({
        conversationHistory: JSON.stringify(messages),
        ...(conversationTurn && { conversationTurn }),
      })
      .where(eq(entries.id, id))
      .returning();
    
    if (!entry) {
      throw new Error("Entry not found");
    }
    
    return entry;
  }

  async finalizeConversation(id: string, growth: string, hint?: string): Promise<Entry> {
    const [entry] = await db
      .update(entries)
      .set({
        aiGrowth: growth,
        aiHint: hint || null,
        isCompleted: 1,
      })
      .where(eq(entries.id, id))
      .returning();
    
    if (!entry) {
      throw new Error("Entry not found");
    }
    
    return entry;
  }

  async updateHintStatus(id: string, hintStatus: UpdateHint["hintStatus"]): Promise<Entry | undefined> {
    const [entry] = await db
      .update(entries)
      .set({ hintStatus })
      .where(eq(entries.id, id))
      .returning();
    
    return entry || undefined;
  }

  async getAllCompletedEntries(userId: string): Promise<Entry[]> {
    const completedEntries = await db
      .select()
      .from(entries)
      .where(and(eq(entries.isCompleted, 1), eq(entries.userId, userId)))
      .orderBy(entries.createdAt);
    
    // Return only entries with growth insights, sorted by creation date descending
    return completedEntries
      .filter(entry => entry.aiGrowth)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // User management methods
  async createUser(userData: InsertUser): Promise<User> {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);
    
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}

export const storage = new DatabaseStorage();
