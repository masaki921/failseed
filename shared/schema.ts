import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const entries = pgTable("entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").default('legacy').notNull(), // セッションIDでユーザーを識別
  createdAt: timestamp("created_at").defaultNow().notNull(),
  text: text("text").notNull(), // Initial event description
  conversationHistory: text("conversation_history"), // JSON array of conversation messages
  conversationTurn: integer("conversation_turn").default(1).notNull(), // Track conversation turns
  aiGrowth: text("ai_growth"), // AI's growth insight (filled when conversation concludes)
  aiHint: text("ai_hint"), // AI's actionable hint
  hintStatus: text("hint_status").default("none").notNull(), // 'none' | 'tried' | 'skipped'
  isCompleted: integer("is_completed").default(0).notNull(), // 0 = ongoing, 1 = completed
});

export const insertEntrySchema = createInsertSchema(entries).omit({
  id: true,
  createdAt: true,
});

export const startConversationSchema = z.object({
  text: z.string().min(1, "出来事を入力してください"),
});

export const continueConversationSchema = z.object({
  entryId: z.string(),
  message: z.string().min(1, "メッセージを入力してください"),
});

export const finalizeConversationSchema = z.object({
  entryId: z.string(),
});

export const updateHintSchema = z.object({
  hintStatus: z.enum(["none", "tried", "skipped"]),
});

export type Entry = typeof entries.$inferSelect;
export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type ContinueConversationInput = z.infer<typeof continueConversationSchema>;
export type FinalizeConversationInput = z.infer<typeof finalizeConversationSchema>;
export type UpdateHint = z.infer<typeof updateHintSchema>;

// Conversation message structure
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// AI Response types
export interface AIConversationResponse {
  message: string;
  shouldFinalize: boolean; // AI decides when to conclude and extract learning
  entryId: string;
}

export interface AIFinalizationResponse {
  growth: string;
  hint?: string;
  entryId: string;
}
