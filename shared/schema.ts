import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).default("inactive"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const entries = pgTable("entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // ユーザーIDで識別
  sessionId: varchar("session_id").default('legacy'), // 後方互換性のため保持
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

// User authentication schemas
export const registerUserSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

export const loginUserSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

// User type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

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
