import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const entries = pgTable("entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  text: text("text").notNull(), // Initial event description
  detailText: text("detail_text"), // Additional details from step 2
  feel: text("feel"), // User's feelings (optional)
  aiComfort: text("ai_comfort").notNull(), // AI's comforting response
  aiQuestion: text("ai_question"), // AI's follow-up question
  aiGrowth: text("ai_growth").notNull(), // AI's growth insight
  aiHint: text("ai_hint"), // AI's actionable hint
  hintStatus: text("hint_status").default("none").notNull(), // 'none' | 'tried' | 'skipped'
});

export const insertEntrySchema = createInsertSchema(entries).omit({
  id: true,
  createdAt: true,
});

export const step1Schema = z.object({
  text: z.string().min(1, "出来事を入力してください"),
});

export const step2Schema = z.object({
  entryId: z.string(),
  detailText: z.string().optional(),
});

export const updateHintSchema = z.object({
  hintStatus: z.enum(["none", "tried", "skipped"]),
});

export type Entry = typeof entries.$inferSelect;
export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Step1Input = z.infer<typeof step1Schema>;
export type Step2Input = z.infer<typeof step2Schema>;
export type UpdateHint = z.infer<typeof updateHintSchema>;

// AI Response types
export interface AIStep1Response {
  comfort: string;
  question?: string;
  entryId: string;
}

export interface AIStep2Response {
  comfort: string;
  growth: string;
  hint?: string;
  entryId: string;
}
