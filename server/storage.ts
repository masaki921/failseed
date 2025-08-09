import { type Entry, type InsertEntry, type UpdateHint } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getEntry(id: string): Promise<Entry | undefined>;
  createPartialEntry(text: string, aiComfort: string, aiQuestion?: string): Promise<Entry>;
  updateEntryWithGrowth(id: string, detailText: string | undefined, aiComfort: string, aiGrowth: string, aiHint?: string): Promise<Entry>;
  updateHintStatus(id: string, hintStatus: UpdateHint["hintStatus"]): Promise<Entry | undefined>;
  getAllGrowthEntries(): Promise<Entry[]>;
}

export class MemStorage implements IStorage {
  private entries: Map<string, Entry>;

  constructor() {
    this.entries = new Map();
  }

  async getEntry(id: string): Promise<Entry | undefined> {
    return this.entries.get(id);
  }

  async createPartialEntry(text: string, aiComfort: string, aiQuestion?: string): Promise<Entry> {
    const id = randomUUID();
    const entry: Entry = {
      id,
      createdAt: new Date(),
      text,
      detailText: null,
      feel: null,
      aiComfort,
      aiQuestion: aiQuestion || null,
      aiGrowth: "", // Will be filled in step 2
      aiHint: null,
      hintStatus: "none",
    };
    this.entries.set(id, entry);
    return entry;
  }

  async updateEntryWithGrowth(
    id: string, 
    detailText: string | undefined, 
    aiComfort: string, 
    aiGrowth: string, 
    aiHint?: string
  ): Promise<Entry> {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error("Entry not found");
    }

    const updatedEntry: Entry = {
      ...entry,
      detailText: detailText || null,
      aiComfort, // Update with step 2 comfort message
      aiGrowth,
      aiHint: aiHint || null,
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

  async getAllGrowthEntries(): Promise<Entry[]> {
    // Return only completed entries (those with growth insights)
    return Array.from(this.entries.values())
      .filter(entry => entry.aiGrowth)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const storage = new MemStorage();
