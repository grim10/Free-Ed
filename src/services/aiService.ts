import { openai } from '../config/openai';
import { backOff } from 'exponential-backoff';

interface RetryableError extends Error {
  status?: number;
}

interface CacheEntry {
  content: string;
  timestamp: number;
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const cache = new Map<string, CacheEntry>();

const getCacheKey = (topic: string, promptType: string): string => {
  return `${topic}:${promptType}`;
};

const getFromCache = (topic: string, promptType: string): string | null => {
  const key = getCacheKey(topic, promptType);
  const entry = cache.get(key);
  
  if (!entry) return null;
  
  // Check if cache entry has expired
  if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
    cache.delete(key);
    return null;
  }
  
  return entry.content;
};

const saveToCache = (topic: string, promptType: string, content: string): void => {
  const key = getCacheKey(topic, promptType);
  cache.set(key, {
    content,
    timestamp: Date.now()
  });
};

const isRetryableError = (error: any): boolean => {
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  return retryableStatusCodes.includes(error?.status);
};

const getErrorMessage = (error: any): string => {
  if (error?.message?.includes('API key')) {
    return 'Invalid API key. Please check your OpenAI API key configuration.';
  }
  if (error?.status === 429) {
    return 'API rate limit exceeded. Please try again in a few minutes. If this persists, consider upgrading your OpenAI account.';
  }
  if (error?.message?.includes('quota')) {
    return 'API quota exceeded. Please check your OpenAI account billing status or upgrade your plan.';
  }
  return 'Failed to generate content. Please try again later.';
};

export async function generateContent(topic: string, promptType: string): Promise<string> {
  try {
    // Check cache first
    const cachedContent = getFromCache(topic, promptType);
    if (cachedContent) {
      return cachedContent;
    }

    const prompt = generatePrompt(topic, promptType);
    
    const generateCompletion = async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert educational AI assistant, skilled at explaining complex topics in simple terms with relevant examples and analogies. Your responses should be detailed, engaging, and tailored to the student's needs. For follow-up questions, respond with a JSON array of question objects."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      if (!completion.choices[0]?.message?.content) {
        throw new Error('No content generated');
      }

      return completion.choices[0].message.content;
    };

    const result = await backOff(
      () => generateCompletion(),
      {
        numOfAttempts: 5, // Increased from 3
        startingDelay: 2000, // Increased from 1000
        timeMultiple: 2,
        maxDelay: 20000, // Increased from 10000
        retry: (error: RetryableError) => isRetryableError(error),
      }
    );

    // Save successful response to cache
    if (result) {
      saveToCache(topic, promptType, result);
    }

    if (promptType === 'follow-up') {
      return result || '[]';
    }

    return result;
  } catch (error: any) {
    console.error('Error generating content:', error);
    throw new Error(getErrorMessage(error));
  }
}

function generatePrompt(topic: string, promptType: string): string {
  const promptTemplates = {
    'explain-simply': `Explain ${topic} in simple terms. Your response should include:
1. A clear, beginner-friendly explanation using everyday analogies
2. Step-by-step breakdown of key concepts
3. Real-world examples that illustrate the topic
4. Common applications or uses
5. Key takeaways for better understanding`,
    
    'visual-guide': `Create a detailed textual description of ${topic} that emphasizes visual learning. Include:
1. Clear descriptions of key visual elements and diagrams
2. Step-by-step explanations of processes or relationships
3. Comparisons to familiar visual concepts
4. Spatial relationships and interactions between components
5. Description of any important patterns or structures`,
    
    'interactive-practice': `Create an interactive learning session about ${topic} with:
1. A warm-up question to assess basic understanding
2. 3 practice problems of increasing difficulty
3. Detailed step-by-step solutions
4. Common mistakes to avoid
5. Tips for problem-solving`,
    
    'real-applications': `Explain real-world applications of ${topic}:
1. 4-5 practical examples where this concept is used
2. Detailed explanation of how it's implemented in each case
3. Impact and importance in various industries
4. Future potential applications
5. Benefits and limitations in real-world scenarios`,
    
    'deep-dive': `Provide an advanced explanation of ${topic}:
1. Theoretical foundations and principles
2. Mathematical formulations and proofs
3. Edge cases and special considerations
4. Current research developments
5. Advanced applications and implications`,
    
    'exam-mastery': `Create a comprehensive exam preparation guide for ${topic}:
1. Essential concepts and formulas
2. Common question types and solution strategies
3. Step-by-step problem-solving approaches
4. Practice questions with detailed solutions
5. Tips for avoiding common mistakes`,
    
    'concept-map': `Create a detailed description of how ${topic} connects with other concepts:
1. Prerequisites and foundational concepts
2. Related topics and their relationships
3. Advanced applications and extensions
4. Interdisciplinary connections
5. Progressive learning path`,
    
    'common-mistakes': `Explain common misconceptions about ${topic}:
1. List of frequent misunderstandings
2. Reasons why these misconceptions occur
3. Correct explanations with evidence
4. Examples highlighting the differences
5. Tips for avoiding these mistakes`,
    
    'follow-up': `Based on the topic "${topic}", generate 5 thought-provoking follow-up questions that would help deepen understanding. Return the response in this JSON format:
[
  {
    "id": "q1",
    "question": "What is...",
    "contentType": "explanation"
  }
]
Include a mix of theoretical understanding, practical applications, and problem-solving questions.`,
    
    'follow-up-answer': `Provide a comprehensive answer about ${topic}:
1. Clear and detailed explanation
2. Relevant examples and applications
3. Connections to related concepts
4. Important formulas or principles
5. Further learning suggestions`
  };

  return promptTemplates[promptType as keyof typeof promptTemplates] || promptTemplates['explain-simply'];
}