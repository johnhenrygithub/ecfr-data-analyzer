import { createHash } from "crypto";

const ECFR_API_BASE = "https://www.ecfr.gov/api/versioner/v1";

interface ECFRTitle {
  identifier: string;
  name: string;
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
 * Fetches the structure and content for a specific title
 */
export async function fetchTitleContent(titleNumber: string): Promise<ECFRStructure | null> {
  try {
    const response = await fetch(`${ECFR_API_BASE}/structure/${titleNumber}/latest`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch title ${titleNumber}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching title ${titleNumber} content:`, error);
    return null;
  }
}

/**
 * Extracts text content from the structure recursively
 */
export function extractTextFromStructure(structure: ECFRStructure): string {
  let text = structure.text || '';
  
  if (structure.children && structure.children.length > 0) {
    for (const child of structure.children) {
      text += ' ' + extractTextFromStructure(child);
    }
  }
  
  return text;
}

/**
 * Analyzes text to calculate word count and complexity metrics
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
