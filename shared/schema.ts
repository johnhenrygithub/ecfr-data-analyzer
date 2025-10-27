import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// eCFR regulations data table
export const regulations = pgTable("regulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agency: text("agency").notNull(),
  title: text("title").notNull(),
  chapter: text("chapter"),
  section: text("section"),
  textContent: text("text_content").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  checksum: text("checksum").notNull(),
  // Pre-calculated metrics to avoid re-analysis of truncated text
  sentenceCount: integer("sentence_count").notNull().default(0),
  uniqueWords: integer("unique_words").notNull().default(0),
  avgSentenceLength: integer("avg_sentence_length").notNull().default(0), // stored as integer (actual * 100)
  vocabularyDiversity: integer("vocabulary_diversity").notNull().default(0), // stored as integer (actual * 10000)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  agencyIdx: index("agency_idx").on(table.agency),
}));

// Metadata for tracking data fetch operations
export const fetchMetadata = pgTable("fetch_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lastFetchAt: timestamp("last_fetch_at").notNull().defaultNow(),
  status: text("status").notNull(), // 'success' | 'error' | 'in_progress'
  totalRegulations: integer("total_regulations").notNull().default(0),
  errorMessage: text("error_message"),
  progressCurrent: integer("progress_current").default(0),
  progressTotal: integer("progress_total").default(0),
  currentTitle: text("current_title"),
});

// Insert schemas
export const insertRegulationSchema = createInsertSchema(regulations).omit({
  id: true,
  createdAt: true,
});

export const insertFetchMetadataSchema = createInsertSchema(fetchMetadata).omit({
  id: true,
});

// Types
export type Regulation = typeof regulations.$inferSelect;
export type InsertRegulation = z.infer<typeof insertRegulationSchema>;
export type FetchMetadata = typeof fetchMetadata.$inferSelect;
export type InsertFetchMetadata = z.infer<typeof insertFetchMetadataSchema>;

// Analysis result types (not stored in DB, computed on-the-fly)
export interface AgencyAnalysis {
  agency: string;
  totalWordCount: number;
  averageWordCount: number;
  regulationCount: number;
  checksum: string;
  rci: number; // Regulatory Complexity Index
  avgSentenceLength: number;
  vocabularyDiversity: number;
}

export interface WordCountAnalysis {
  agency: string;
  totalWords: number;
  averageWords: number;
  count: number;
}

export interface ChecksumData {
  agency: string;
  checksum: string;
  lastUpdated: string;
}
