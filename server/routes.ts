import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  fetchTitles, 
  fetchTitleContent, 
  extractTextFromXML,
  analyzeText,
  analyzeTextIncremental,
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
      const agencies = Array.from(new Set(regulations.map(r => r.agency)));
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
      for (const [agency, regs] of Array.from(agencyMap.entries())) {
        const totalWordCount = regs.reduce((sum: number, r) => sum + r.wordCount, 0);
        const averageWordCount = totalWordCount / regs.length;
        
        // Aggregate pre-calculated metrics (no re-analysis needed)
        const totalSentences = regs.reduce((sum: number, r) => sum + r.sentenceCount, 0);
        const totalUniqueWords = regs.reduce((sum: number, r) => sum + r.uniqueWords, 0);
        
        // Calculate weighted averages
        const avgSentenceLength = totalWordCount / totalSentences;
        const vocabularyDiversity = totalUniqueWords / totalWordCount;
        
        // Calculate combined checksum from individual checksums (not from truncated text)
        const combinedChecksums = regs.map(r => r.checksum).sort().join('');
        const checksum = calculateChecksum(combinedChecksums);
        
        const rci = calculateRCI(avgSentenceLength, vocabularyDiversity);
        
        analysis.push({
          agency,
          totalWordCount,
          averageWordCount,
          regulationCount: regs.length,
          checksum,
          rci,
          avgSentenceLength,
          vocabularyDiversity,
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

  // GET /api/historical/title/:number - Get historical trends for a specific title
  app.get("/api/historical/title/:number", async (req, res) => {
    try {
      const titleNumber = parseInt(req.params.number);
      const startYear = parseInt(req.query.start_year as string) || 2017;
      const endYear = parseInt(req.query.end_year as string) || new Date().getFullYear();

      if (isNaN(titleNumber) || titleNumber < 1 || titleNumber > 50) {
        return res.status(400).json({ error: "Invalid title number" });
      }

      // First, get title metadata to know the title name
      const titles = await fetchTitles();
      const title = titles.find(t => t.number === titleNumber);
      if (!title) {
        return res.status(404).json({ error: "Title not found" });
      }

      const trends = [];
      let consecutiveFailures = 0;
      const MAX_CONSECUTIVE_FAILURES = 3; // Circuit breaker: stop after 3 consecutive failures
      
      // Fetch data for each year
      for (let year = startYear; year <= endYear; year++) {
        // Circuit breaker: if we've had too many consecutive failures, stop trying
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.log(`Stopping after ${consecutiveFailures} consecutive failures - eCFR API appears to be down`);
          break;
        }
        
        try {
          // Use January 15th as the snapshot date for each year
          const date = `${year}-01-15`;
          
          console.log(`Fetching historical data for Title ${titleNumber} (${year})...`);
          const xmlContent = await fetchTitleContent(titleNumber, date);
          
          if (!xmlContent) {
            console.log(`No content available for Title ${titleNumber} in ${year}`);
            consecutiveFailures++;
            continue;
          }

          // Analyze the historical content
          const analysis = analyzeTextIncremental(xmlContent);
          
          if (analysis.wordCount === 0) {
            console.log(`No text content for Title ${titleNumber} in ${year}`);
            consecutiveFailures++;
            continue;
          }

          trends.push({
            year,
            date,
            wordCount: analysis.wordCount,
            sentenceCount: analysis.sentenceCount,
            avgSentenceLength: analysis.avgSentenceLength,
            vocabularyDiversity: analysis.vocabularyDiversity,
            uniqueWords: analysis.uniqueWords,
            rci: calculateRCI(analysis.avgSentenceLength, analysis.vocabularyDiversity),
          });

          console.log(`Analyzed Title ${titleNumber} (${year}): ${analysis.wordCount} words`);
          
          // Reset consecutive failures on success
          consecutiveFailures = 0;
          
          // Trigger garbage collection after each year
          if (global.gc) global.gc();
          
        } catch (yearError) {
          console.error(`Error processing Title ${titleNumber} for year ${year}:`, yearError);
          consecutiveFailures++;
          // Continue with next year
        }
      }

      res.json({
        titleNumber,
        titleName: title.name,
        trends,
        startYear,
        endYear,
      });

    } catch (error) {
      console.error("Error fetching historical trends:", error);
      res.status(500).json({ error: "Failed to fetch historical trends" });
    }
  });

  // POST /api/fetch - Fetch and store eCFR data
  // Optional body: { titleNumbers: [1, 2, 3] } to fetch specific titles only
  app.post("/api/fetch", async (req, res) => {
    try {
      const { titleNumbers } = req.body || {};
      
      // Create initial metadata entry
      const metadata = await storage.createMetadata({
        lastFetchAt: new Date(),
        status: 'in_progress',
        totalRegulations: 0,
        progressCurrent: 0,
        progressTotal: 0,
        currentTitle: 'Initializing...',
      });

      // Fetch in background (don't block response)
      performECFRFetch(metadata.id, titleNumbers).catch(err => {
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
 * @param metadataId - ID of the metadata entry to update
 * @param titleNumbers - Optional array of specific title numbers to fetch
 */
async function performECFRFetch(metadataId: string, titleNumbers?: number[]) {
  try {
    console.log("Starting eCFR data fetch...");
    
    // Fetch titles
    const titles = await fetchTitles();
    console.log(`Found ${titles.length} titles`);
    
    // Filter non-reserved titles
    let validTitles = titles.filter(t => !t.reserved);
    
    // Further filter by specific title numbers if provided
    if (titleNumbers && titleNumbers.length > 0) {
      validTitles = validTitles.filter(t => titleNumbers.includes(t.number));
      console.log(`Filtering to ${validTitles.length} requested titles: ${titleNumbers.join(', ')}`);
      
      // Delete only the specific titles being refreshed
      const agencyNamesToDelete = validTitles.map(t => t.name);
      console.log(`Deleting existing data for agencies: ${agencyNamesToDelete.join(', ')}`);
      await storage.deleteRegulationsByAgencies(agencyNamesToDelete);
    } else {
      // Fetching all titles - clear everything first
      console.log('Fetching all titles - clearing existing data');
      await storage.deleteAllRegulations();
    }
    
    const totalTitles = validTitles.length;
    
    // Update metadata with total count
    await storage.updateMetadata(metadataId, {
      progressTotal: totalTitles,
      currentTitle: 'Starting fetch...',
    });
    
    let totalRegulations = 0;
    let currentProgress = 0;
    
    // Process titles in smaller batches to reduce memory pressure
    // Use batch size of 1 for very large titles
    const BATCH_SIZE = 1;
    for (let i = 0; i < validTitles.length; i += BATCH_SIZE) {
      const batch = validTitles.slice(i, i + BATCH_SIZE);
      
      for (const title of batch) {
        currentProgress++;
        
        try {
          // Update progress (in-place update, not creating new row)
          await storage.updateMetadata(metadataId, {
            progressCurrent: currentProgress,
            currentTitle: `Title ${title.number}: ${title.name}`,
          });
          
          console.log(`[${currentProgress}/${totalTitles}] Fetching title ${title.number}: ${title.name}`);
          
          let xmlContent = await fetchTitleContent(title.number, title.latest_issue_date);
          if (!xmlContent) {
            console.log(`No content for title ${title.number} - skipping`);
            continue;
          }
          
          // Check XML size before processing
          const xmlSize = xmlContent.length;
          console.log(`XML size for ${title.name}: ${xmlSize} characters`);
          
          // Skip extremely large titles that would cause memory issues
          // Title 40 (156M chars) may work in production with higher RAM allocation
          // Development environment is limited to 2GB, but production can be configured with more
          const MAX_XML_SIZE = 200_000_000; // 200 million characters (supports Title 40 at 156M)
          if (xmlSize > MAX_XML_SIZE) {
            console.log(`⚠️  Title ${title.number} (${title.name}) is too large (${xmlSize} chars). Skipping to prevent memory crash.`);
            xmlContent = null;
            if (global.gc) global.gc();
            continue;
          }
          
          // Use incremental analysis to avoid building full text string in memory
          // This processes text in chunks during XML parsing (critical for Title 40)
          // Checksum is calculated incrementally too - NEVER builds full text string!
          console.log(`Starting incremental analysis for ${title.name}...`);
          const analysis = analyzeTextIncremental(xmlContent);
          
          // Free XML content immediately after extraction to reduce memory
          xmlContent = null;
          if (global.gc) global.gc();
          
          if (analysis.wordCount === 0) {
            console.log(`No text content for title ${title.number} - skipping`);
            continue;
          }
          
          console.log(`Analysis complete for ${title.name}: ${analysis.wordCount} words, ${analysis.sentenceCount} sentences`);
          
          // Use the incrementally calculated checksum
          const checksum = analysis.checksum;
          
          // Store empty sample since we never built the full text
          const textSample = '';
          
          // Trigger garbage collection
          if (global.gc) global.gc();
          
          // Store regulation with metrics and truncated text sample
          // Metrics are pre-calculated from full text to avoid re-analysis of truncated data
          await storage.createRegulation({
            agency: title.name,
            title: `Title ${title.number}`,
            chapter: '',
            section: '',
            textContent: textSample,
            wordCount: analysis.wordCount,
            checksum,
            // Store metrics as integers to avoid floating point precision issues
            sentenceCount: analysis.sentenceCount,
            uniqueWords: analysis.uniqueWords,
            avgSentenceLength: Math.round(analysis.avgSentenceLength * 100), // Store as integer * 100
            vocabularyDiversity: Math.round(analysis.vocabularyDiversity * 10000), // Store as integer * 10000
          });
          
          totalRegulations++;
          
          // Update regulation count
          await storage.updateMetadata(metadataId, {
            totalRegulations,
          });
          
          console.log(`Stored regulation for ${title.name} (${analysis.wordCount} words)`);
          
          // Force GC hint after each title (if available)
          if (global.gc) {
            global.gc();
          }
        } catch (titleError) {
          console.error(`Error processing title ${title.number} (${title.name}):`, titleError);
          console.log(`Skipping title ${title.number} and continuing with next title`);
          // Continue with next title instead of failing entire fetch
        }
      }
      
      // Longer delay between batches to allow GC to complete
      if (i + BATCH_SIZE < validTitles.length) {
        if (global.gc) global.gc();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Get the actual total regulation count from database
    const allRegulations = await storage.getAllRegulations();
    const actualTotalCount = allRegulations.length;
    
    // Update metadata with final success status and correct total count
    await storage.updateMetadata(metadataId, {
      status: 'success',
      totalRegulations: actualTotalCount,
      currentTitle: 'Complete',
      progressCurrent: totalTitles,
    });
    
    console.log(`eCFR fetch complete. Stored ${totalRegulations} regulations in this fetch. Total in database: ${actualTotalCount}.`);
  } catch (error) {
    console.error("Error in performECFRFetch:", error);
    
    // Get the actual total regulation count from database even on error
    try {
      const allRegulations = await storage.getAllRegulations();
      const actualTotalCount = allRegulations.length;
      
      await storage.updateMetadata(metadataId, {
        status: 'error',
        totalRegulations: actualTotalCount,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        progressCurrent: null,
        progressTotal: null,
        currentTitle: null,
      });
    } catch (metadataError) {
      // If we can't even update metadata, just log it
      console.error("Error updating metadata on fetch failure:", metadataError);
    }
  }
}
