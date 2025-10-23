import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  fetchTitles, 
  fetchTitleContent, 
  extractTextFromStructure,
  analyzeText,
  calculateChecksum,
  calculateRCI 
} from "./ecfr-service";
import type { AgencyAnalysis } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // GET /api/metadata - Get latest fetch metadata
  app.get("/api/metadata", async (req, res) => {
    try {
      const metadata = await storage.getLatestMetadata();
      if (!metadata) {
        // Return default metadata if none exists
        res.json({
          id: '0',
          lastFetchAt: new Date().toISOString(),
          status: 'pending',
          totalRegulations: 0,
          errorMessage: null,
        });
      } else {
        res.json(metadata);
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);
      res.status(500).json({ error: "Failed to fetch metadata" });
    }
  });

  // GET /api/agencies - Get list of all unique agencies
  app.get("/api/agencies", async (req, res) => {
    try {
      const regulations = await storage.getAllRegulations();
      const agencies = [...new Set(regulations.map(r => r.agency))];
      res.json(agencies);
    } catch (error) {
      console.error("Error fetching agencies:", error);
      res.status(500).json({ error: "Failed to fetch agencies" });
    }
  });

  // GET /api/agency/:name - Get all regulations for a specific agency
  app.get("/api/agency/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const regulations = await storage.getRegulationsByAgency(name);
      res.json(regulations);
    } catch (error) {
      console.error("Error fetching agency regulations:", error);
      res.status(500).json({ error: "Failed to fetch agency regulations" });
    }
  });

  // GET /api/analysis/agencies - Get complete analysis for all agencies
  app.get("/api/analysis/agencies", async (req, res) => {
    try {
      const regulations = await storage.getAllRegulations();
      
      // Group by agency
      const agencyMap = new Map<string, typeof regulations>();
      for (const reg of regulations) {
        if (!agencyMap.has(reg.agency)) {
          agencyMap.set(reg.agency, []);
        }
        agencyMap.get(reg.agency)!.push(reg);
      }

      // Calculate analysis for each agency
      const analysis: AgencyAnalysis[] = [];
      for (const [agency, regs] of agencyMap.entries()) {
        const totalWordCount = regs.reduce((sum, r) => sum + r.wordCount, 0);
        const averageWordCount = totalWordCount / regs.length;
        
        // Recalculate complexity metrics from all text
        const allText = regs.map(r => r.textContent).join(' ');
        const textAnalysis = analyzeText(allText);
        
        // Calculate combined checksum
        const combinedText = regs.map(r => r.textContent).sort().join('');
        const checksum = calculateChecksum(combinedText);
        
        const rci = calculateRCI(textAnalysis.avgSentenceLength, textAnalysis.vocabularyDiversity);
        
        analysis.push({
          agency,
          totalWordCount,
          averageWordCount,
          regulationCount: regs.length,
          checksum,
          rci,
          avgSentenceLength: textAnalysis.avgSentenceLength,
          vocabularyDiversity: textAnalysis.vocabularyDiversity,
        });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error computing agency analysis:", error);
      res.status(500).json({ error: "Failed to compute analysis" });
    }
  });

  // GET /api/analysis/wordcount - Get word count analysis
  app.get("/api/analysis/wordcount", async (req, res) => {
    try {
      const regulations = await storage.getAllRegulations();
      
      const agencyMap = new Map<string, typeof regulations>();
      for (const reg of regulations) {
        if (!agencyMap.has(reg.agency)) {
          agencyMap.set(reg.agency, []);
        }
        agencyMap.get(reg.agency)!.push(reg);
      }

      const wordCountAnalysis = Array.from(agencyMap.entries()).map(([agency, regs]) => ({
        agency,
        totalWords: regs.reduce((sum, r) => sum + r.wordCount, 0),
        averageWords: regs.reduce((sum, r) => sum + r.wordCount, 0) / regs.length,
        count: regs.length,
      }));

      res.json(wordCountAnalysis);
    } catch (error) {
      console.error("Error computing word count:", error);
      res.status(500).json({ error: "Failed to compute word count" });
    }
  });

  // GET /api/analysis/checksums - Get checksums for all agencies
  app.get("/api/analysis/checksums", async (req, res) => {
    try {
      const regulations = await storage.getAllRegulations();
      
      const agencyMap = new Map<string, typeof regulations>();
      for (const reg of regulations) {
        if (!agencyMap.has(reg.agency)) {
          agencyMap.set(reg.agency, []);
        }
        agencyMap.get(reg.agency)!.push(reg);
      }

      const checksums = Array.from(agencyMap.entries()).map(([agency, regs]) => {
        const combinedText = regs.map(r => r.textContent).sort().join('');
        return {
          agency,
          checksum: calculateChecksum(combinedText),
          lastUpdated: new Date(Math.max(...regs.map(r => new Date(r.createdAt).getTime()))).toISOString(),
        };
      });

      res.json(checksums);
    } catch (error) {
      console.error("Error computing checksums:", error);
      res.status(500).json({ error: "Failed to compute checksums" });
    }
  });

  // POST /api/fetch - Fetch and store eCFR data
  app.post("/api/fetch", async (req, res) => {
    try {
      // Start fetch operation
      await storage.createMetadata({
        lastFetchAt: new Date(),
        status: 'in_progress',
        totalRegulations: 0,
      });

      // Fetch in background (don't block response)
      performECFRFetch().catch(err => {
        console.error("Background fetch failed:", err);
      });

      res.json({ message: "Fetch started", status: "in_progress" });
    } catch (error) {
      console.error("Error starting fetch:", error);
      res.status(500).json({ error: "Failed to start fetch" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

/**
 * Background task to fetch eCFR data
 */
async function performECFRFetch() {
  try {
    console.log("Starting eCFR data fetch...");
    
    // Clear existing regulations
    await storage.deleteAllRegulations();
    
    // Fetch titles
    const titles = await fetchTitles();
    console.log(`Found ${titles.length} titles`);
    
    let totalRegulations = 0;
    
    // Fetch content for first 5 titles to avoid timeout (sample data)
    const samplesToFetch = titles.slice(0, 5);
    
    for (const title of samplesToFetch) {
      console.log(`Fetching title ${title.identifier}: ${title.name}`);
      
      const content = await fetchTitleContent(title.identifier);
      if (!content) {
        console.log(`No content for title ${title.identifier}`);
        continue;
      }
      
      // Extract text
      const text = extractTextFromStructure(content);
      if (!text || text.trim().length === 0) {
        console.log(`No text content for title ${title.identifier}`);
        continue;
      }
      
      // Analyze text
      const analysis = analyzeText(text);
      const checksum = calculateChecksum(text);
      
      // Store regulation
      await storage.createRegulation({
        agency: title.name,
        title: title.identifier,
        chapter: content.label || '',
        section: content.identifier || '',
        textContent: text.substring(0, 50000), // Limit to 50k chars to avoid storage issues
        wordCount: analysis.wordCount,
        checksum,
      });
      
      totalRegulations++;
      console.log(`Stored regulation for ${title.name} (${analysis.wordCount} words)`);
    }
    
    // Update metadata
    await storage.createMetadata({
      lastFetchAt: new Date(),
      status: 'success',
      totalRegulations,
    });
    
    console.log(`eCFR fetch complete. Stored ${totalRegulations} regulations.`);
  } catch (error) {
    console.error("Error in performECFRFetch:", error);
    
    await storage.createMetadata({
      lastFetchAt: new Date(),
      status: 'error',
      totalRegulations: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
