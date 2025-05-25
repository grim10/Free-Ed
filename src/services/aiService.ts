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

/**
 * A simple in-memory cache with TTL
 */
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

/**
 * Retryable HTTP status codes
 */
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
function isRetryable(error: any): boolean {
  return RETRYABLE_STATUS.has(error?.status);
}

/**
 * User-friendly error messages
 */
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
 * Prompt templates designed for clear plain-text formatting
 */
const promptTemplates: Record<PromptType, string> = {
  'explain-simply':
    "Provide a clear explanation of '%TOPIC%' for beginners. Use this structure:\n" +
    "1) Overview: A short definition and why it matters.\n" +
    "2) Analogy: Relate to a familiar example.\n" +
    "3) Core concepts: List 3 to 5 bullet points with concise descriptions.\n" +
    "4) Formula and derivation: State E = m c^2 (as example) in plain text and explain each term step-by-step.\n" +
    "5) Examples: Give 2 practical examples showing how to apply the formula.\n" +
    "6) Takeaways: Summarize the key points to remember.",

  'visual-guide':
    "Guide the reader through a mental diagram of '%TOPIC%' using plain text. Structure:\n" +
    "1) Visual summary: Describe the overall layout.\n" +
    "2) Elements: Name each part and its role.\n" +
    "3) Flow: Explain how parts connect step by step.\n" +
    "4) Sketch: Provide simple instructions to draw the diagram.\n" +
    "5) Formula notes: State relevant formula inline.",

  'interactive-practice':
    "Create an interactive practice session for '%TOPIC%' with:\n" +
    "- Warm-up question and immediate explanation.\n" +
    "- Three problems (easy, medium, hard) each with hint, solution steps, and answer.\n" +
    "- Formula review: List each formula with a brief description.\n" +
    "- Reflection: Prompt learner to note mistakes.",

  'real-applications':
    "List 4–6 real-world applications of '%TOPIC%':\n" +
    "Application: [Name]\n" +
    "Domain: [Field]\n" +
    "Use case: Brief description.\n" +
    "Formula: e.g., P = V × I\n" +
    "Benefits: Key advantages\n" +
    "Example: Short real-world scenario.",

  'deep-dive':
    "Offer a deep dive on '%TOPIC%' covering:\n" +
    "1) Theory: Core principles and definitions.\n" +
    "2) Math: State equations (e.g., ∇·E = ρ/ε0) inline and explain variables.\n" +
    "3) Edge cases: Special conditions.\n" +
    "4) Research: Recent studies and future directions.",

  'exam-mastery':
    "Craft an exam guide for '%TOPIC%' with:\n" +
    "1) Syllabus: Subtopics list.\n" +
    "2) Formulas: Each with use-case.\n" +
    "3) Questions: One MCQ and one derivation with answers.\n" +
    "4) Strategies: Tips for quick solving.\n" +
    "5) Pitfalls: Common errors and corrections.",

  'concept-map':
    "Map connections for '%TOPIC%' via:\n" +
    "1) Prerequisites: What to learn first.\n" +
    "2) Related topics: Links explained.\n" +
    "3) Advanced uses: Integrations.\n" +
    "4) Path: Study sequence.",

  'common-mistakes':
    "Identify the top 5 misconceptions in '%TOPIC%':\n" +
    "Mistake: [Desc]\n" +
    "Why wrong: [Explanation]\n" +
    "Correct: [Clarification]\n" +
    "(Repeat for each.)",

  'follow-up':
    "Return ONLY a pure JSON array of 5 follow-up questions for '%TOPIC%'. NO markdown, NO backticks, NO explanation. Example: [{\"id\":\"q1\",\"question\":\"...\",\"type\":\"conceptual\"}]. The response must be valid JSON and nothing else.",

  'follow-up-answer':
    "Answer a follow-up question on '%TOPIC%' with:\n" +
    "Explanation: Step-by-step in plain text.\n" +
    "Formula: State inline and explain variables.\n" +
    "Example: One real scenario.\n" +
    "Resources: 1–2 suggestions.",
};

/**
 * Sanitize AI output by removing markdown artifacts and backticks
 */
function sanitizeOutput(text: string, type: PromptType): string {
  let sanitized = text
    .replace(/```[\s\S]*?```/g, '')    // remove code fences
    .replace(/[`]/g, '')               // remove stray backticks
    .replace(/#+\s*/g, '')             // remove headings
    .trim();

  // For follow-up questions, ensure we have valid JSON
  if (type === 'follow-up') {
    try {
      // Find the first '[' and last ']' to extract just the JSON array
      const start = sanitized.indexOf('[');
      const end = sanitized.lastIndexOf(']') + 1;
      if (start >= 0 && end > start) {
        sanitized = sanitized.slice(start, end);
      }
      // Validate that it's parseable
      JSON.parse(sanitized);
    } catch (e) {
      console.error('Invalid JSON after sanitization:', sanitized);
      return '[]'; // Return empty array as fallback
    }
  }

  return sanitized;
}

/**
 * Service responsible for generating AI content
 */
export class ContentService {
  private readonly cache = new CacheService(24 * 60 * 60 * 1000);

  constructor(
    private readonly model = 'gpt-3.5-turbo',
    private readonly systemMessage =
      'You are an expert educational AI tutor. Begin with Overview, then Analogy, numbered steps, inline formulas with verbal explanation, Example, and Key Insights. Output must be plain text only—no markdown, backticks, or code fences.'
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

    const prompt = this.buildPrompt(topic, type);
    const fetcher = async () => {
      const resp = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemMessage },
          { role: 'user', content: prompt },
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