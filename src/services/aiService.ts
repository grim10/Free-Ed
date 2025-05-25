// src/services/aiService.ts
import { openai } from '../config/openai';
import { backOff } from 'exponential-backoff';

/**
 * Supported prompt types for content generation
 */
export type PromptType =
  | 'explain-simply'
  | 'visual-guide'
  | 'interactive-practice'
  | 'real-applications'
  | 'deep-dive'
  | 'exam-mastery'
  | 'concept-map'
  | 'common-mistakes'
  | 'follow-up'
  | 'follow-up-answer';

/**
 * Interface for cache entries
 */
interface CacheEntry {
  content: string;
  timestamp: number;
}

/** In-memory cache with TTL */
class CacheService {
  private readonly store = new Map<string, CacheEntry>();
  constructor(private readonly ttlMs: number) {}
  get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return entry.content;
  }
  set(key: string, content: string): void {
    this.store.set(key, { content, timestamp: Date.now() });
  }
}

/** Retryable HTTP status codes */
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
function isRetryable(error: any): boolean {
  return RETRYABLE_STATUS.has(error?.status);
}

/** User-friendly error messages */
const ErrorMessages = {
  invalidKey: 'Invalid API key. Please verify your OpenAI configuration.',
  rateLimit: 'Rate limit reached. Try again later or upgrade your plan.',
  quotaExceeded: 'Quota exceeded. Check your billing or upgrade.',
  generic: 'Failed to generate content. Please retry later.',
};
function formatError(error: any): string {
  if (error.message?.includes('API key')) return ErrorMessages.invalidKey;
  if (error.status === 429) return ErrorMessages.rateLimit;
  if (error.message?.includes('quota')) return ErrorMessages.quotaExceeded;
  return ErrorMessages.generic;
}

/**
 * Prompt templates that force real markdown headings and LaTeX
 */
const promptTemplates: Record<PromptType, string> = {
  'explain-simply': `
Generate an IIT-JEE–style explanation of **%TOPIC%**. EXACTLY use this Markdown structure:

## Overview
A concise definition and why it matters.

## Analogy
A simple real-world analogy.

## Core Concepts
- List 3 to 5 bullet points in the format "Concept: description."

## Formula & Derivation
Use display math:
$$
\\mathcal{E} = -\\frac{d\\Phi}{dt}
$$
Then explain each symbol below.

## Examples
1. First practical example with step-by-step.
2. Second example illustrating the concept.

## Takeaways
- List 2 to 4 key points to remember.

Return **only** the raw Markdown (with H2 headings “## …”, bullets “- …”, numbered lists “1.”, and LaTeX in “$$…$$”). No extra commentary about formatting.
`,
  'visual-guide': promptTemplates['visual-guide'],       // unchanged
  'interactive-practice': promptTemplates['interactive-practice'],
  'real-applications': promptTemplates['real-applications'],
  'deep-dive': promptTemplates['deep-dive'],
  'exam-mastery': promptTemplates['exam-mastery'],
  'concept-map': promptTemplates['concept-map'],
  'common-mistakes': promptTemplates['common-mistakes'],
  'follow-up': promptTemplates['follow-up'],
  'follow-up-answer': promptTemplates['follow-up-answer'],
};

/** Sanitize AI output (only strip code fences now) */
function sanitizeOutput(text: string, type: PromptType): string {
  let sanitized = text
    .replace(/```[\s\S]*?```/g, '') // remove any code fences
    .trim();

  if (type === 'follow-up') {
    try {
      const start = sanitized.indexOf('[');
      const end = sanitized.lastIndexOf(']') + 1;
      sanitized = sanitized.slice(start, end);
      JSON.parse(sanitized);
    } catch {
      return '[]';
    }
  }

  return sanitized;
}

/** Service responsible for generating AI content */
export class ContentService {
  private readonly cache = new CacheService(24 * 60 * 60 * 1000);

  constructor(
    private readonly model = 'gpt-4o-mini',
    private readonly systemMessage =
      'You are an expert IIT-JEE tutor. Output MUST use Markdown headings, bullet lists, and LaTeX. No formatting commentary.'
  ) {}

  private getCacheKey(topic: string, type: PromptType): string {
    return `${topic}::${type}`;
  }

  private buildPrompt(topic: string, type: PromptType): string {
    return promptTemplates[type].replace(/%TOPIC%/g, topic);
  }

  public async generate(topic: string, type: PromptType): Promise<string> {
    const key = this.getCacheKey(topic, type);
    const cached = this.cache.get(key);
    if (cached) return cached;

    const userPrompt = this.buildPrompt(topic, type);
    const fetcher = async () => {
      const resp = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemMessage },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      const content = resp.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content returned');
      return content;
    };

    try {
      let result = await backOff(fetcher, {
        numOfAttempts: 5,
        startingDelay: 2000,
        timeMultiple: 2,
        maxDelay: 20000,
        retry: isRetryable,
      });

      result = sanitizeOutput(result, type);
      this.cache.set(key, result);
      return result;
    } catch (err: any) {
      console.error('ContentService error:', err);
      throw new Error(formatError(err));
    }
  }
}

// Export a singleton
export const contentService = new ContentService();
