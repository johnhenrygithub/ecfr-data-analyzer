// Updated from MemStorage to DatabaseStorage using javascript_database blueprint
import { 
  regulations, 
  fetchMetadata, 
  type Regulation, 
  type InsertRegulation, 
  type FetchMetadata,
  type InsertFetchMetadata 
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Regulations
  createRegulation(regulation: InsertRegulation): Promise<Regulation>;
  getAllRegulations(): Promise<Regulation[]>;
  getRegulationsByAgency(agency: string): Promise<Regulation[]>;
  deleteAllRegulations(): Promise<void>;
  
  // Metadata
  createMetadata(metadata: InsertFetchMetadata): Promise<FetchMetadata>;
  updateMetadata(id: string, metadata: Partial<InsertFetchMetadata>): Promise<FetchMetadata>;
  getLatestMetadata(): Promise<FetchMetadata | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Regulations
  async createRegulation(regulation: InsertRegulation): Promise<Regulation> {
    const [result] = await db
      .insert(regulations)
      .values(regulation)
      .returning();
    return result;
  }

  async getAllRegulations(): Promise<Regulation[]> {
    return await db.select().from(regulations);
  }

  async getRegulationsByAgency(agency: string): Promise<Regulation[]> {
    return await db
      .select()
      .from(regulations)
      .where(eq(regulations.agency, agency));
  }

  async deleteAllRegulations(): Promise<void> {
    await db.delete(regulations);
  }

  // Metadata
  async createMetadata(metadata: InsertFetchMetadata): Promise<FetchMetadata> {
    const [result] = await db
      .insert(fetchMetadata)
      .values(metadata)
      .returning();
    return result;
  }

  async updateMetadata(id: string, metadata: Partial<InsertFetchMetadata>): Promise<FetchMetadata> {
    const [result] = await db
      .update(fetchMetadata)
      .set(metadata)
      .where(eq(fetchMetadata.id, id))
      .returning();
    return result;
  }

  async getLatestMetadata(): Promise<FetchMetadata | undefined> {
    const [result] = await db
      .select()
      .from(fetchMetadata)
      .orderBy(sql`${fetchMetadata.lastFetchAt} DESC`)
      .limit(1);
    return result;
  }
}

export const storage = new DatabaseStorage();
