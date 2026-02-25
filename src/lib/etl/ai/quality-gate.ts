import { MIN_NARRATIVE_WORDS, NARRATIVE_UNIQUENESS_THRESHOLD } from '@/lib/config/constants';

export interface QualityCheckResult {
  passed: boolean;
  wordCount: number;
  reasons: string[];
}

export function checkNarrativeQuality(narrative: string): QualityCheckResult {
  const reasons: string[] = [];
  const wordCount = countWords(narrative);

  if (wordCount < MIN_NARRATIVE_WORDS) {
    reasons.push(`Word count ${wordCount} below minimum ${MIN_NARRATIVE_WORDS}`);
  }

  if (containsAIDisclosure(narrative)) {
    reasons.push('Contains AI self-reference');
  }

  if (containsMarkdown(narrative)) {
    reasons.push('Contains markdown formatting');
  }

  if (isRepetitive(narrative)) {
    reasons.push('Content appears overly repetitive');
  }

  return {
    passed: reasons.length === 0,
    wordCount,
    reasons,
  };
}

export function checkUniqueness(narrative: string, comparisons: string[]): number {
  if (comparisons.length === 0) return 1.0;

  const narrativeTokens = tokenize(narrative);
  let maxSimilarity = 0;

  for (const other of comparisons) {
    const otherTokens = tokenize(other);
    const similarity = jaccardSimilarity(narrativeTokens, otherTokens);
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }

  // Return uniqueness score (1 - similarity)
  return 1 - maxSimilarity;
}

export function isUnique(narrative: string, comparisons: string[]): boolean {
  const uniqueness = checkUniqueness(narrative, comparisons);
  return uniqueness >= NARRATIVE_UNIQUENESS_THRESHOLD;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function containsAIDisclosure(text: string): boolean {
  const patterns = [
    /\bI am an? AI\b/i,
    /\bas an AI\b/i,
    /\blanguage model\b/i,
    /\bChatGPT\b/i,
    /\bGPT-4\b/i,
    /\bOpenAI\b/i,
    /\bI cannot\b/i,
    /\bI don't have access\b/i,
  ];
  return patterns.some((p) => p.test(text));
}

function containsMarkdown(text: string): boolean {
  const patterns = [
    /^#{1,6}\s/m, // headers
    /\*\*[^*]+\*\*/,  // bold
    /^[-*]\s/m, // list items
    /```/,  // code blocks
    /\[.*?\]\(.*?\)/, // links
  ];
  return patterns.some((p) => p.test(text));
}

function isRepetitive(text: string): boolean {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 20);
  if (sentences.length < 3) return false;

  const uniqueSentences = new Set(sentences.map((s) => s.trim().toLowerCase()));
  const uniqueRatio = uniqueSentences.size / sentences.length;
  return uniqueRatio < 0.5;
}

function tokenize(text: string): Set<string> {
  // Bigram tokenization for Jaccard similarity
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const bigrams = new Set<string>();
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]} ${words[i + 1]}`);
  }
  return bigrams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
