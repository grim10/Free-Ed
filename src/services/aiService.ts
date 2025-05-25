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

/** Simple in-memory cache with TTL */
interface CacheEntry { content: string; timestamp: number; }
class CacheService {
  private store = new Map<string, CacheEntry>();
  constructor(private ttlMs: number) {}
  get(key: string): string | null {
    const e = this.store.get(key);
    if (!e || Date.now() - e.timestamp > this.ttlMs) {
      this.store.delete(key);
      return null;
    }
    return e.content;
  }
  set(key: string, content: string) {
    this.store.set(key, { content, timestamp: Date.now() });
  }
}

/** Retryable HTTP status codes */
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const isRetryable = (err: any) => RETRYABLE.has(err?.status);

/** Friendly error messages */
const Errors = {
  invalidKey: 'Invalid API key. Please verify your OpenAI configuration.',
  rateLimit:  'Rate limit reached. Try again later.',
  quota:      'Quota exceeded. Check billing or upgrade.',
  generic:    'Failed to generate content. Please retry.',
};
function formatError(err: any) {
  if (err.message?.includes('API key')) return Errors.invalidKey;
  if (err.status === 429)          return Errors.rateLimit;
  if (err.message?.includes('quota')) return Errors.quota;
  return Errors.generic;
}

/** Prompt templates forcing real Markdown headings + LaTeX */
const promptTemplates: Record<PromptType,string> = {
  'explain-simply': `
Generate an IIT-JEE–style explanation of **%TOPIC%**. Use *exactly* this Markdown outline:

## Overview
A concise definition and why it matters.

## Analogy
A simple real-world analogy.

## Core Concepts
- Concept: description
- (3–5 bullets total)

## Formula & Derivation
Use display math:
$$
\\mathcal{E} = -\\frac{d\\Phi}{dt}
$$
Then explain each symbol below.

## Examples
1. First practical example with steps.
2. Second example illustrating concept.

## Takeaways
- Key point 1
- Key point 2

Return *only* the raw Markdown (with `##` headings, `-` bullets, numbered lists, and `$$…$$` math). No extra formatting instructions.
`,
  // You can update other templates similarly if needed
  'visual-guide':        promptTemplates['visual-guide'],
  'interactive-practice':promptTemplates['interactive-practice'],
  'real-applications':   promptTemplates['real-applications'],
  'deep-dive':           promptTemplates['deep-dive'],
  'exam-mastery':        promptTemplates['exam-mastery'],
  'concept-map':         promptTemplates['concept-map'],
  'common-mistakes':     promptTemplates['common-mistakes'],
  'follow-up':           promptTemplates['follow-up'],
  'follow-up-answer':    promptTemplates['follow-up-answer'],
};

/**
 * Only strip triple-backtick fences; leave headings & LaTeX intact
 */
function sanitize(text: string, type: PromptType): string {
  let out = text.replace(/```[\s\S]*?```/g, '').trim();
  if (type === 'follow-up') {
    try {
      const s = out.indexOf('['), e = out.lastIndexOf(']') + 1;
      out = out.slice(s, e);
      JSON.parse(out);
    } catch {
      return '[]';
    }
  }
  return out;
}

/** Core service */
export class ContentService {
  private cache = new CacheService(24 * 60 * 60 * 1000);
  constructor(
    private model = 'gpt-4o-mini',
    private systemMsg = 'You are an expert IIT-JEE tutor. Output MUST use Markdown headings, bullet lists, and LaTeX. No formatting commentary.'
  ) {}

  private key(topic: string, type: PromptType) {
    return `${topic}::${type}`;
  }
  private build(topic: string, type: PromptType) {
    return promptTemplates[type].replace(/%TOPIC%/g, topic);
  }

  public async generate(topic: string, type: PromptType): Promise<string> {
    const cacheKey = this.key(topic, type);
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;

    const userPrompt = this.build(topic, type);
    const call = async () => {
      const rsp = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemMsg },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      const txt = rsp.choices?.[0]?.message?.content;
      if (!txt) throw new Error('No content returned');
      return txt;
    };

    try {
      let result = await backOff(call, {
        numOfAttempts: 5,
        startingDelay: 2000,
        timeMultiple:  2,
        maxDelay:      20000,
        retry:         isRetryable,
      });
      result = sanitize(result, type);
      this.cache.set(cacheKey, result);
      return result;
    } catch (err: any) {
      console.error('AI service error:', err);
      throw new Error(formatError(err));
    }
  }
}

// singleton
export const contentService = new ContentService();
