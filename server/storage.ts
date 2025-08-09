import { type Entry, type InsertEntry, type UpdateHint, type ConversationMessage, entries } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getEntry(id: string): Promise<Entry | undefined>;
  createConversation(text: string): Promise<Entry>;
  updateConversationHistory(id: string, messages: ConversationMessage[], conversationTurn?: number): Promise<Entry>;
  finalizeConversation(id: string, growth: string, hint?: string): Promise<Entry>;
  updateHintStatus(id: string, hintStatus: UpdateHint["hintStatus"]): Promise<Entry | undefined>;
  getAllCompletedEntries(): Promise<Entry[]>;
}

export class DatabaseStorage implements IStorage {
  async getEntry(id: string): Promise<Entry | undefined> {
    const [entry] = await db.select().from(entries).where(eq(entries.id, id));
    return entry || undefined;
  }

  async createConversation(text: string): Promise<Entry> {
    const [entry] = await db
      .insert(entries)
      .values({
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

  async getAllCompletedEntries(): Promise<Entry[]> {
    const completedEntries = await db
      .select()
      .from(entries)
      .where(eq(entries.isCompleted, 1))
      .orderBy(entries.createdAt);
    
    // Return only entries with growth insights, sorted by creation date descending
    return completedEntries
      .filter(entry => entry.aiGrowth)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new DatabaseStorage();
