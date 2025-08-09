import { type Entry, type InsertEntry, type UpdateHint, type ConversationMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getEntry(id: string): Promise<Entry | undefined>;
  createConversation(text: string): Promise<Entry>;
  updateConversationHistory(id: string, messages: ConversationMessage[]): Promise<Entry>;
  finalizeConversation(id: string, growth: string, hint?: string): Promise<Entry>;
  updateHintStatus(id: string, hintStatus: UpdateHint["hintStatus"]): Promise<Entry | undefined>;
  getAllCompletedEntries(): Promise<Entry[]>;
}

export class MemStorage implements IStorage {
  private entries: Map<string, Entry>;

  constructor() {
    this.entries = new Map();
  }

  async getEntry(id: string): Promise<Entry | undefined> {
    return this.entries.get(id);
  }

  async createConversation(text: string): Promise<Entry> {
    const id = randomUUID();
    const entry: Entry = {
      id,
      createdAt: new Date(),
      text,
      conversationHistory: null,
      aiGrowth: null,
      aiHint: null,
      hintStatus: "none",
      isCompleted: 0,
    };
    this.entries.set(id, entry);
    return entry;
  }

  async updateConversationHistory(id: string, messages: ConversationMessage[]): Promise<Entry> {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error("Entry not found");
    }

    const updatedEntry: Entry = {
      ...entry,
      conversationHistory: JSON.stringify(messages),
    };

    this.entries.set(id, updatedEntry);
    return updatedEntry;
  }

  async finalizeConversation(id: string, growth: string, hint?: string): Promise<Entry> {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error("Entry not found");
    }

    const updatedEntry: Entry = {
      ...entry,
      aiGrowth: growth,
      aiHint: hint || null,
      isCompleted: 1,
    };

    this.entries.set(id, updatedEntry);
    return updatedEntry;
  }

  async updateHintStatus(id: string, hintStatus: UpdateHint["hintStatus"]): Promise<Entry | undefined> {
    const entry = this.entries.get(id);
    if (!entry) {
      return undefined;
    }

    const updatedEntry: Entry = {
      ...entry,
      hintStatus,
    };

    this.entries.set(id, updatedEntry);
    return updatedEntry;
  }

  async getAllCompletedEntries(): Promise<Entry[]> {
    // Return only completed entries (those with growth insights)
    return Array.from(this.entries.values())
      .filter(entry => entry.isCompleted === 1 && entry.aiGrowth)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
