import { createHash } from "crypto";
import sax from "sax";

const ECFR_API_BASE = "https://www.ecfr.gov/api/versioner/v1";

interface ECFRTitle {
  number: number;
  name: string;
  reserved: boolean;
  latest_issue_date: string;
}

interface ECFRStructure {
  identifier: string;
  label: string;
  type: string;
  children?: ECFRStructure[];
  text?: string;
}

/**
 * Fetches the list of all CFR titles from the eCFR API
 */
export async function fetchTitles(): Promise<ECFRTitle[]> {
  try {
    const response = await fetch(`${ECFR_API_BASE}/titles`);
    if (!response.ok) {
      throw new Error(`Failed to fetch titles: ${response.statusText}`);
    }
    const data = await response.json();
    return data.titles || [];
  } catch (error) {
    console.error("Error fetching eCFR titles:", error);
    throw error;
  }
}

/**
 * Fetches the full regulatory text content for a specific title on a specific date
 * Returns XML content as text
 */
export async function fetchTitleContent(titleNumber: number, date: string): Promise<string | null> {
  try {
    const response = await fetch(`${ECFR_API_BASE}/full/${date}/title-${titleNumber}.xml`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch title ${titleNumber}: ${response.statusText}`);
    }
    const xmlText = await response.text();
    return xmlText;
  } catch (error) {
    console.error(`Error fetching title ${titleNumber} content:`, error);
    return null;
  }
}

/**
 * Extracts plain text from XML regulatory content using streaming parser
 * This avoids loading the entire XML into memory and prevents regex memory issues
 */
export function extractTextFromXML(xmlContent: string): string {
  const textChunks: string[] = [];
  let currentText = '';
  
  // Create a streaming SAX parser
  const parser = sax.parser(true, {
    lowercase: true,
    normalize: true,
  });
  
  // Collect text content as we encounter it
  parser.ontext = (text) => {
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      currentText += trimmed + ' ';
      
      // Flush to array every 10000 characters to avoid string concatenation issues
      if (currentText.length > 10000) {
        textChunks.push(currentText);
        currentText = '';
      }
    }
  };
  
  // Handle parser errors gracefully
  parser.onerror = (error) => {
    console.error('XML parsing error:', error);
    // Continue parsing despite errors
    parser.resume();
  };
  
  // Process the XML in chunks to avoid memory issues
  const chunkSize = 1000000; // 1MB chunks
  for (let i = 0; i < xmlContent.length; i += chunkSize) {
    const chunk = xmlContent.substring(i, i + chunkSize);
    parser.write(chunk);
  }
  parser.close();
  
  // Add any remaining text
  if (currentText.length > 0) {
    textChunks.push(currentText);
  }
  
  // Join all text chunks and normalize whitespace
  return textChunks.join('').replace(/\s+/g, ' ').trim();
}

/**
 * Analyzes XML content incrementally without building full text string in memory
 * Processes text in chunks during SAX parsing to handle extremely large documents
 */
export function analyzeTextIncremental(xmlContent: string): {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  vocabularyDiversity: number;
  uniqueWords: number;
  fullText: string;
} {
  let wordCount = 0;
  let sentenceCount = 0;
  const uniqueWordsSet = new Set<string>();
  const textChunks: string[] = [];
  let currentText = '';
  
  // Create a streaming SAX parser
  const parser = sax.parser(true, {
    lowercase: true,
    normalize: true,
  });
  
  // Process text incrementally as we encounter it
  parser.ontext = (text) => {
    const trimmed = text.trim();
    if (trimmed.length > 0) {
      currentText += trimmed + ' ';
      
      // Process in 50KB chunks to balance memory and performance
      if (currentText.length > 50000) {
        processTextChunk(currentText);
        currentText = '';
        
        // Trigger garbage collection if available
        if (global.gc && wordCount % 100000 === 0) {
          global.gc();
        }
      }
    }
  };
  
  // Helper function to process a chunk of text
  function processTextChunk(chunk: string) {
    // Store chunk for later reassembly (needed for checksum)
    textChunks.push(chunk);
    
    // Count words in this chunk
    const words = chunk.split(/\s+/).filter(w => w.length > 0);
    wordCount += words.length;
    
    // Track unique words
    words.forEach(word => {
      uniqueWordsSet.add(word.toLowerCase());
    });
    
    // Count sentences (periods, exclamation marks, question marks)
    const sentences = chunk.match(/[.!?]+/g);
    if (sentences) {
      sentenceCount += sentences.length;
    }
  }
  
  // Handle parser errors gracefully
  parser.onerror = (error) => {
    console.error('XML parsing error:', error);
    parser.resume();
  };
  
  // Process the XML in chunks
  const chunkSize = 1000000; // 1MB chunks
  for (let i = 0; i < xmlContent.length; i += chunkSize) {
    const chunk = xmlContent.substring(i, i + chunkSize);
    parser.write(chunk);
    
    // Periodic garbage collection for very large files
    if (global.gc && i % 10000000 === 0) {
      global.gc();
    }
  }
  parser.close();
  
  // Process any remaining text
  if (currentText.length > 0) {
    processTextChunk(currentText);
  }
  
  // Ensure at least 1 sentence
  if (sentenceCount === 0) sentenceCount = 1;
  
  // Calculate metrics
  const avgSentenceLength = wordCount / sentenceCount;
  const uniqueWords = uniqueWordsSet.size;
  const vocabularyDiversity = wordCount > 0 ? uniqueWords / wordCount : 0;
  
  // Build full text only once at the end (needed for checksum)
  const fullText = textChunks.join('').replace(/\s+/g, ' ').trim();
  
  return {
    wordCount,
    sentenceCount,
    avgSentenceLength,
    vocabularyDiversity,
    uniqueWords,
    fullText,
  };
}

/**
 * Analyzes text to calculate word count and complexity metrics
 * (Legacy function - kept for backwards compatibility)
 */
export function analyzeText(text: string): {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  vocabularyDiversity: number;
  uniqueWords: number;
} {
  // Clean the text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Word count
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Sentence count (split by .!?)
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;
  
  // Average sentence length
  const avgSentenceLength = wordCount / sentenceCount;
  
  // Vocabulary diversity (unique words / total words)
  const uniqueWordsSet = new Set(words.map(w => w.toLowerCase()));
  const uniqueWords = uniqueWordsSet.size;
  const vocabularyDiversity = wordCount > 0 ? uniqueWords / wordCount : 0;
  
  return {
    wordCount,
    sentenceCount,
    avgSentenceLength,
    vocabularyDiversity,
    uniqueWords,
  };
}

/**
 * Calculates checksum (SHA-256 hash) of text content
 */
export function calculateChecksum(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Calculates Regulatory Complexity Index (RCI)
 * RCI = Average Sentence Length × Vocabulary Diversity
 */
export function calculateRCI(avgSentenceLength: number, vocabularyDiversity: number): number {
  return avgSentenceLength * vocabularyDiversity;
}
