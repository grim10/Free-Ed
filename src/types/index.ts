// Define the types used across the application

export interface Topic {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  parentId?: string;
  relatedTopics?: string[];
  chapterId: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  icon: string;
  topics: string[];
  duration: number;
  subjectId: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  chapters: Chapter[];
}

export interface Content {
  id: string;
  topicId: string;
  type: 'explanation' | 'example' | 'question' | 'summary';
  title: string;
  content: string;
  visualAid?: {
    type: 'diagram' | 'table' | 'comparison';
    data: any;
  };
}

export interface FollowUpQuestion {
  id: string;
  topicId: string;
  question: string;
  contentType: 'explanation' | 'example' | 'question' | 'summary';
}

export interface UserSession {
  id: string;
  lastTopicId?: string;
  viewedTopics: string[];
  generatedContent: string[];
}