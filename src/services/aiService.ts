// services/aiService.ts
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
 * What we return to the UI
 */
export interface ContentResult {
  /** The full, cleaned explanation */
  full: string;
  /** 3–5 one-sentence takeaways chosen by the AI */
  quickReference: string[];
}

/**
 * Simple in-memory cache with TTL
 */
interface CacheEntry {
  content: string;    // sanitized full text
  timestamp: number;
}
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
 * Retry logic
 */
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
function isRetryable(err: any): boolean {
  return RETRYABLE_STATUS.has(err?.status);
}

/**
 * User-friendly error messages
 */
const ErrorMessages = {
  invalidKey: 'Invalid API key. Please verify your OpenAI configuration.',
  rateLimit:  'Rate limit reached. Try again later or upgrade your plan.',
  quota:      'Quota exceeded. Check your billing or upgrade.',
  generic:    'Failed to generate content. Please retry later.',
};
function formatError(err: any): string {
  if (err.message?.includes('API key')) return ErrorMessages.invalidKey;
  if (err.status === 429)           return ErrorMessages.rateLimit;
  if (err.message?.includes('quota')) return ErrorMessages.quota;
  return ErrorMessages.generic;
}

/**
 * Extract the bullets listed under “QuickReference:” 
 */
function extractQuickReference(text: string): string[] {
  const marker = 'QuickReference:';
  const idx = text.indexOf(marker);
  if (idx < 0) return [];
  return text
    .slice(idx + marker.length)
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^[-•]/.test(line))
    .map(line => line.replace(/^[-•]\s*/, ''))
    .slice(0, 5);
}

/**
 * Remove markdown/code-fence artifacts, but keep “QuickReference:” intact
 */
function sanitizeOutput(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')  // strip code fences
    .replace(/[`*_#]/g, '')          // strip backticks, asterisks, hashes
    .trim();
}

/**
 * Your existing prompt templates (with %TOPIC%)
 */
const promptTemplates: Record<PromptType, string> = {
  'explain-simply':
    "Provide a clear explanation of '%TOPIC%' for beginners. Use this structure:\n" +
    "1) Overview: A short definition and why it matters.\n" +
    "2) Analogy: Relate to a familiar example.\n" +
    "3) Core concepts: List 3–5 bullet points with concise descriptions.\n" +
    "4) Formula and derivation: State E = m c^2 in plain text and explain each term.\n" +
    "5) Examples: Give 2 practical examples applying the formula.\n" +
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
    "- Warm-up question + explanation.\n" +
    "- Three problems (easy/med/hard) each with hint, steps, answer.\n" +
    "- Formula review: List formulas + descriptions.\n" +
    "- Reflection: Prompt learner to note mistakes.",
  'real-applications':
    "List 4–6 real-world applications of '%TOPIC%':\n" +
    "Application: [Name]\n" +
    "Domain: [Field]\n" +
    "Use case: Brief description.\n" +
    "Formula: e.g., P = V × I\n" +
    "Benefits: Key advantages\n" +
    "Example: Short scenario.",
  'deep-dive':
    "Offer a deep dive on '%TOPIC%' covering:\n" +
    "1) Theory: Core principles.\n" +
    "2) Math: Equations inline (e.g., ∇·E = ρ/ε0) + explain vars.\n" +
    "3) Edge cases: Special conditions.\n" +
    "4) Research: Recent studies + future directions.",
  'exam-mastery':
    "Craft an exam guide for '%TOPIC%' with:\n" +
    "1) Syllabus: Subtopics list.\n" +
    "2) Formulas: Each with use-case.\n" +
    "3) Questions: One MCQ + one derivation + answers.\n" +
    "4) Strategies: Quick-solving tips.\n" +
    "5) Pitfalls: Common errors + corrections.",
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
    "Return ONLY a JSON array of 5 follow-up questions for '%TOPIC%'.\n" +
    "No markdown, no backticks, no explanation.\n" +
    'Example: [{"id":"q1","question":"...","type":"conceptual"}]',
  'follow-up-answer':
    "Answer a follow-up question on '%TOPIC%' with:\n" +
    "Explanation, inline formula, example, and resources.\n",
};

/**
 * Main service
 */
export class ContentService {
  private readonly cache = new CacheService(24 * 60 * 60 * 1000);

  constructor(
    private readonly model         = 'gpt-3.5-turbo',
    private readonly systemMessage =
      'You are an expert educational AI tutor. Output must be plain text only — no markdown, backticks, or code fences.'
  ) {}

  /** key for caching */
  private getCacheKey(topic: string, type: PromptType) {
    return `${topic}::${type}`;
  }

  /** inject topic + QuickReference instruction */
  private buildPrompt(topic: string, type: PromptType): string {
    let base = promptTemplates[type].replace(/%TOPIC%/g, topic);

    // ask AI for its own key takeaways (skip for 'follow-up')
    if (type !== 'follow-up') {
      base +=
        '\n\nQuickReference:\n' +
        '• Provide 3–5 one-sentence takeaways as plain bullets.';
    }

    return base;
  }

  /**
   * Returns both the full explanation and the AI’s top takeaways
   */
  public async generate(
    topic: string,
    type: PromptType
  ): Promise<ContentResult> {
    const key = this.getCacheKey(topic, type);
    const cached = this.cache.get(key);
    if (cached) {
      // cached is just the full text; extract quickRef now
      return {
        full: cached,
        quickReference: extractQuickReference(cached),
      };
    }

    const prompt = this.buildPrompt(topic, type);

    const fetcher = async (): Promise<string> => {
      const resp = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemMessage },
          { role: 'user',   content: prompt },
        ],
        temperature: 0.7,
        max_tokens:   2000,
      });

      const content = resp.choices?.[0]?.message?.content;
      if (!content) throw new Error('No content returned by AI');
      return content;
    };

    try {
      const raw = await backOff(fetcher, {
        numOfAttempts: 5,
        startingDelay: 2000,
        timeMultiple:  2,
        maxDelay:      20000,
        retry:         isRetryable,
      });

      const full = sanitizeOutput(raw);
      const quickReference = extractQuickReference(full);

      // cache only the cleaned full text
      this.cache.set(key, full);

      return { full, quickReference };
    } catch (err: any) {
      console.error('ContentService error:', err);
      throw new Error(formatError(err));
    }
  }
}

/** singleton export */
export const contentService = new ContentService();
