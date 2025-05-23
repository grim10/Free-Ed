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
            content: "You are an expert educational AI assistant, skilled at explaining complex topics in simple terms with relevant examples and analogies. Format your responses with clear headings, emojis for visual engagement, and well-structured sections. Use bullet points, numbered lists, and proper spacing for readability."
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
        numOfAttempts: 5,
        startingDelay: 2000,
        timeMultiple: 2,
        maxDelay: 20000,
        retry: (error: RetryableError) => isRetryableError(error),
      }
    );

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
    'explain-simply': `Explain ${topic} in simple terms. Structure your response as follows:

🎯 Explanation using everyday analogies
• Start with a clear, relatable analogy
• Use simple language and familiar concepts
• Break down complex ideas into digestible parts

📚 Step-by-step breakdown of key concepts
• List each important concept with a brief explanation
• Use bullet points for clarity
• Include relevant formulas with explanations

🌟 Real-world examples
• Provide 2-3 concrete examples from everyday life
• Explain how the concept applies in each case
• Highlight the practical significance

⚡ Common applications or uses
• List practical applications
• Explain how it's used in technology or industry
• Mention modern innovations using this concept

💡 Key takeaways
• Summarize the most important points
• Highlight what to remember
• Connect to related concepts`,
    
    'visual-guide': `Create a detailed description of ${topic} emphasizing visual learning. Structure as follows:

🎨 Visual Overview
• Describe the main visual elements
• Explain key relationships and connections
• Use spatial analogies for better understanding

📊 Key Components
• Break down each visual element
• Explain their relationships
• Use clear comparisons to familiar objects

🔄 Process Visualization
• Describe step-by-step how it works
• Use clear transition markers
• Include movement and change descriptions

📐 Important Patterns
• Highlight recurring patterns
• Explain visual relationships
• Note key structural elements`,
    
    'interactive-practice': `Create an interactive learning session about ${topic}. Format as follows:

🔍 Warm-up Question
• Start with a basic concept check
• Include the answer with explanation
• Point out key learning elements

📝 Practice Problems
• Present 3 problems of increasing difficulty
• Include step-by-step solutions
• Highlight common pitfalls to avoid

🎯 Problem-Solving Tips
• Share effective strategies
• List important formulas
• Provide memory aids

⚠️ Common Mistakes
• Identify typical errors
• Explain why they occur
• Show how to avoid them`,
    
    'real-applications': `Explain real-world applications of ${topic}. Structure as follows:

🌟 Practical Examples
• List 4-5 real-world applications
• Explain how it works in each case
• Highlight the benefits and impact

🔧 Implementation Details
• Describe how it's used in practice
• Explain technical considerations
• Note important variations

🚀 Future Potential
• Discuss emerging applications
• Highlight new developments
• Consider future possibilities

⚖️ Limitations and Considerations
• Discuss practical constraints
• Note important trade-offs
• Suggest workarounds`,

    'deep-dive': `Provide an advanced explanation of ${topic}. Structure as follows:

🎓 Theoretical Foundations
• Explain core principles
• Present key theories
• Define important terms

📐 Mathematical Framework
• Present relevant equations
• Explain each component
• Show relationships between concepts

🔬 Advanced Concepts
• Explore complex aspects
• Discuss edge cases
• Examine special conditions

🔮 Current Research
• Highlight recent developments
• Discuss ongoing studies
• Note future directions`,

    'exam-mastery': `Create a comprehensive exam preparation guide for ${topic}. Structure as follows:

📚 Essential Concepts
• List key topics to master
• Explain critical formulas
• Highlight important relationships

✍️ Question Types
• Show common exam formats
• Provide solution strategies
• Include practice examples

🎯 Problem-Solving Approach
• Present systematic methods
• Show worked examples
• Explain key steps

⚠️ Common Pitfalls
• Identify frequent mistakes
• Explain correct approaches
• Provide memory aids`,

    'concept-map': `Create a detailed description of how ${topic} connects with other concepts. Structure as follows:

🌱 Foundation Concepts
• List prerequisites
• Explain basic principles
• Show building blocks

🔄 Related Topics
• Identify connected concepts
• Explain relationships
• Show dependencies

🌟 Advanced Applications
• Present complex uses
• Show concept integration
• Highlight synergies

📈 Learning Path
• Suggest study sequence
• Note key milestones
• Recommend resources`,

    'common-mistakes': `Explain common misconceptions about ${topic}. Structure as follows:

❌ Common Misconceptions
• List frequent misunderstandings
• Explain why they occur
• Show correct thinking

✅ Correct Understanding
• Present accurate explanations
• Provide evidence
• Use clear examples

🔍 Analysis
• Compare wrong vs right
• Explain key differences
• Show how to verify

💡 Prevention Tips
• Share learning strategies
• Provide memory aids
• List verification methods`,
    
    'follow-up': `Based on the topic "${topic}", generate 5 thought-provoking follow-up questions that would help deepen understanding. Return the response in this JSON format:
[
  {
    "id": "q1",
    "question": "What is...",
    "contentType": "explanation"
  }
]
Include a mix of theoretical understanding, practical applications, and problem-solving questions.`,
    
    'follow-up-answer': `Provide a comprehensive answer about ${topic}. Structure as follows:

📚 Detailed Explanation
• Present clear concepts
• Use simple language
• Show relationships

🌟 Examples & Applications
• Provide real-world examples
• Show practical uses
• Demonstrate relevance

🔗 Related Concepts
• Connect to other topics
• Show dependencies
• Highlight similarities

📐 Key Principles
• List important formulas
• Explain core rules
• Note exceptions

📚 Further Learning
• Suggest next topics
• Recommend resources
• Provide practice ideas`
  };

  return promptTemplates[promptType as keyof typeof promptTemplates] || promptTemplates['explain-simply'];
}