import { openai } from '../config/openai';
import { backOff } from 'exponential-backoff';

/** Supported prompt types */
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

/** Retryable HTTP codes */
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const isRetryable = (err: any) => RETRYABLE.has(err?.status);

/** Friendly error messages */
const Errors = {
  invalidKey:    'Invalid API key. Please verify your OpenAI configuration.',
  rateLimit:     'Rate limit reached. Try again later.',
  quotaExceeded: 'Quota exceeded. Check billing or upgrade.',
  generic:       'Failed to generate content. Please retry later.',
};
function formatError(err: any): string {
  if (err.message?.includes('API key')) return Errors.invalidKey;
  if (err.status === 429)                return Errors.rateLimit;
  if (err.message?.includes('quota'))    return Errors.quotaExceeded;
  return Errors.generic;
}

// Define each template separately—no self reference!
const explainSimplyTemplate = `
Generate an IIT-JEE–style explanation of **%TOPIC%**. Use exactly this Markdown outline:

## Overview
A concise definition and why it matters.

## Analogy
A simple real-world analogy.

## Core Concepts
- Concept: description
(3–5 bullet points)

## Formula & Derivation
Use display math:
$$
\\mathcal{E} = -\\frac{d\\Phi}{dt}
$$
Explain each symbol below.

## Examples
1. First practical example with step-by-step solution.
2. Second illustrative example.

## Takeaways
- Key point 1
- Key point 2

Return only the raw Markdown, with ## headings, - bullets, numbered lists, and $$…$$ math. No extra formatting instructions.
`.trim();

const visualGuideTemplate = `
Guide '%TOPIC%' through a mental diagram in Markdown:

## Visual Summary
…

## Elements
…

## Flow
…

## Sketch
…

## Formula Notes
…

Return raw Markdown only.
`.trim();

const interactivePracticeTemplate = `
Create an interactive practice session for '%TOPIC%':

## Warm-up
…

## Problems
1. Easy: …
2. Medium: …
3. Hard: …

## Formula Review
…

## Reflection
…

Return raw Markdown only.
`.trim();

const realApplicationsTemplate = `
List 4–6 real-world applications of '%TOPIC%' in Markdown:

## Application 1
…

## Application 2
…

…

Return raw Markdown only.
`.trim();

const deepDiveTemplate = `
Deep dive into '%TOPIC%':

## Theory
…

## Math
Use inline equations like $E=mc^2$.

## Edge Cases
…

## Research
…

Return raw Markdown only.
`.trim();

const examMasteryTemplate = `
Exam mastery for '%TOPIC%':

## Syllabus
…

## Formulas
…

## Questions
…

## Strategies
…

## Pitfalls
…

Return raw Markdown only.
`.trim();

const conceptMapTemplate = `
Concept map for '%TOPIC%':

## Prerequisites
…

## Related Topics
…

## Advanced Uses
…

## Study Path
…

Return raw Markdown only.
`.trim();

const commonMistakesTemplate = `
Top 5 misconceptions in '%TOPIC%':

1. Mistake: …
   - Why wrong: …
   - Correction: …

… repeat for each …

Return raw Markdown only.
`.trim();

const followUpTemplate = `
Return a pure JSON array of 5 follow-up questions for '%TOPIC%'.
Example: [{"id":"q1","question":"…","type":"conceptual"},…]
No Markdown, no code fences.
`.trim();

const followUpAnswerTemplate = `
Answer a follow-up question on '%TOPIC%':

## Explanation
…

## Formula
…

## Example
…

## Resources
…

Return raw Markdown only.
`.trim();

const promptTemplates: Record<PromptType, string> = {
  'explain-simply':       explainSimplyTemplate,
  'visual-guide':         visualGuideTemplate,
  'interactive-practice': interactivePracticeTemplate,
  'real-applications':    realApplicationsTemplate,
  'deep-dive':            deepDiveTemplate,
  'exam-mastery':         examMasteryTemplate,
  'concept-map':          conceptMapTemplate,
  'common-mistakes':      commonMistakesTemplate,
  'follow-up':            followUpTemplate,
  'follow-up-answer':     followUpAnswerTemplate,
};

/** Strip only code fences; leave headings & LaTeX */
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

export class ContentService {
  private cache = new CacheService(24 * 3600 * 1000);

  constructor(
    private model = 'gpt-4o-mini',
    private systemMsg =
      'You are an expert IIT-JEE tutor. Always output in Markdown with headings, bullet lists, and LaTeX only.'
  ) {}

  private key(topic: string, type: PromptType) {
    return `${topic}::${type}`;
  }
  private buildPrompt(topic: string, type: PromptType) {
    return promptTemplates[type].replace(/%TOPIC%/g, topic);
  }

  public async generate(topic: string, type: PromptType): Promise<string> {
    const cacheKey = this.key(topic, type);
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;

    const userPrompt = this.buildPrompt(topic, type);
    const call = async () => {
      const resp = await openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.systemMsg },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      const txt = resp.choices?.[0]?.message?.content;
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

export const contentService = new ContentService();
