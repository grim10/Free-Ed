import { openai } from '../config/openai';
import { backOff } from 'exponential-backoff';

/**
 * Supported prompt types
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

/** Simple in-memory cache */
interface CacheEntry { content: string; timestamp: number; }
class CacheService {
  private store = new Map<string, CacheEntry>();
  constructor(private ttlMs: number) {}
  get(k: string) {
    const e = this.store.get(k);
    if (!e || Date.now() - e.timestamp > this.ttlMs) {
      this.store.delete(k);
      return null;
    }
    return e.content;
  }
  set(k: string, c: string) { this.store.set(k, { content: c, timestamp: Date.now() }); }
}

/** Retryable HTTP codes */
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const isRetryable = (e: any) => RETRYABLE.has(e?.status);

/** Friendly error messages */
const Errors = {
  invalidKey:    'Invalid API key. Please verify your OpenAI configuration.',
  rateLimit:     'Rate limit reached. Try again later.',
  quota:         'Quota exceeded. Check billing or upgrade.',
  generic:       'Failed to generate content. Please retry later.',
};
function formatError(e: any) {
  if (e.message?.includes('API key'))   return Errors.invalidKey;
  if (e.status === 429)                 return Errors.rateLimit;
  if (e.message?.includes('quota'))     return Errors.quota;
  return Errors.generic;
}

/**
 * Prompt templates forcing real Markdown headings + LaTeX
 */
const promptTemplates: Record<PromptType, string> = {
  'explain-simply': `
Generate an IIT-JEE–style explanation of **%TOPIC%**. Use *exactly* this Markdown outline:

## Overview
A concise definition and why it matters.

## Analogy
A simple real-world analogy.

## Core Concepts
- Concept: description
- (3–5 bullets)

## Formula & Derivation
Use display math:
$$
\\mathcal{E} = -\\frac{d\\Phi}{dt}
$$
Then explain each symbol below.

## Examples
1. First practical example with steps.
2. Second example illustrating the concept.

## Takeaways
- Key point 1
- Key point 2

Return **only** the raw Markdown (with `##` headings, `-` bullets, numbered lists, and `$$…$$` math). No extra formatting instructions.
`,
  'visual-guide':
    "Guide the reader through a mental diagram of '%TOPIC%' using plain text. Structure:\n" +
    "1) Visual summary: Describe the overall layout.\n" +
    "2) Elements: Name each part and its role.\n" +
    "3) Flow: Explain how parts connect.\n" +
    "4) Sketch: Instructions to draw the diagram.\n" +
    "5) Formula notes: State any formula inline.",
  'interactive-practice':
    "Create an interactive practice session for '%TOPIC%' with:\n" +
    "- Warm-up question + explanation.\n" +
    "- Three problems (easy, medium, hard) each with hint, solution steps, and answer.\n" +
    "- Formula review: List formulas with descriptions.\n" +
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
    "1) Theory: Core principles.\n" +
    "2) Math: State equations (e.g., ∇·E = ρ/ε₀) and explain.\n" +
    "3) Edge cases: Special conditions.\n" +
    "4) Research: Recent studies and future directions.",
  'exam-mastery':
    "Craft an exam guide for '%TOPIC%' with:\n" +
    "1) Syllabus: Subtopics list.\n" +
    "2) Formulas: Each with use-case.\n" +
    "3) Questions: One MCQ + one derivation with answers.\n" +
    "4) Strategies: Tips for quick solving.\n" +
    "5) Pitfalls: Common errors & fixes.",
  'concept-map':
    "Map connections for '%TOPIC%' via:\n" +
    "1) Prerequisites: What to learn first.\n" +
    "2) Related topics: Links explained.\n" +
    "3) Advanced uses: Integrations.\n" +
    "4) Path: Study sequence.",
  'common-mistakes':
    "Identify the top 5 misconceptions in '%TOPIC%':\n" +
    "Mistake: [Description]\n" +
    "Why wrong: [Explanation]\n" +
    "Correct: [Clarification]\n" +
    "(Repeat for each.)",
  'follow-up':
    "Return ONLY a pure JSON array of 5 follow-up questions for '%TOPIC%'. NO markdown or backticks. Example:\n" +
    `[{"id":"q1","question":"...","type":"conceptual"}, ...]`,
  'follow-up-answer':
    "Answer a follow-up question on '%TOPIC%' with:\n" +
    "Explanation: Step-by-step.\n" +
    "Formula: Inline + explain variables.\n" +
    "Example: One real scenario.\n" +
    "Resources: 1–2 suggestions.",
};

/** Only strip code fences; leave headings & LaTeX */
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
    private systemMsg = 'You are an expert IIT-JEE tutor. Use Markdown headings, bullet lists, and LaTeX only.'
  ) {}

  private key(topic: string, type: PromptType) {
    return `${topic}::${type}`;
  }
  private prompt(topic: string, type: PromptType) {
    return promptTemplates[type].replace(/%TOPIC%/g, topic);
  }

  public async generate(topic: string, type: PromptType): Promise<string> {
    const k = this.key(topic, type);
    const hit = this.cache.get(k);
    if (hit) return hit;

    const userPrompt = this.prompt(topic, type);
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
      this.cache.set(k, result);
      return result;
    } catch (err: any) {
      console.error('AI service error:', err);
      throw new Error(formatError(err));
    }
  }
}

// singleton
export const contentService = new ContentService();
