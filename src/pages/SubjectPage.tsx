import React, { useState, useEffect } from 'react';
import { Topic, Subject, Content, FollowUpQuestion } from '../types';
import Header from '../components/Header';
import TopicDiscoveryPanel from '../components/TopicDiscoveryPanel';
import PromptSection from '../components/PromptSection';
import ContentSection from '../components/ContentSection';
import FollowUpQuestions from '../components/FollowUpQuestions';
import RelatedTopics from '../components/RelatedTopics';
import LoadingIndicator from '../components/LoadingIndicator';
import { 
  getTopicsBySubject, 
  getRelatedTopics,
  getTopicById 
} from '../data/mockData';
import { generateContent } from '../services/aiService';

interface SubjectPageProps {
  subject: Subject;
  onBackToSubjects: () => void;
}

const SubjectPage: React.FC<SubjectPageProps> = ({ 
  subject, 
  onBackToSubjects 
}) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [relatedTopics, setRelatedTopics] = useState<Topic[]>([]);
  const [content, setContent] = useState<Content | null>(null);
  const [followUpQuestions, setFollowUpQuestions] = useState<FollowUpQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTimeout(() => {
      const subjectTopics = getTopicsBySubject(subject.id);
      setTopics(subjectTopics);
      setIsLoading(false);
    }, 1000);
  }, [subject]);

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setContent(null);
    setError(null);
    const related = getRelatedTopics(topic.id);
    setRelatedTopics(related);
  };

  const generateFollowUpQuestions = async (topicTitle: string, currentContent: string) => {
    try {
      const followUpPrompt = `Based on this explanation about "${topicTitle}": 
        ${currentContent}
        
        Generate 5 follow-up questions that would help deepen understanding of this topic. 
        Format the response as a JSON array of objects with properties: id, question, contentType 
        (one of: explanation, example, question, summary)`;

      const questionsJson = await generateContent(topicTitle, 'follow-up');
      const questions = JSON.parse(questionsJson);
      
      setFollowUpQuestions(questions.map((q: any, index: number) => ({
        ...q,
        id: `followup-${index}`,
        topicId: selectedTopic?.id || ''
      })));
    } catch (error: any) {
      console.error('Error generating follow-up questions:', error);
      setFollowUpQuestions([]);
    }
  };

  const handleGenerateContent = async (promptType: string) => {
    if (!selectedTopic) return;
    
    setIsGeneratingContent(true);
    setError(null);
    
    try {
      const generatedContent = await generateContent(selectedTopic.title, promptType);
      
      const newContent: Content = {
        id: `${selectedTopic.id}-${promptType}`,
        topicId: selectedTopic.id,
        type: 'explanation',
        title: `${selectedTopic.title}`,
        content: generatedContent
      };
      
      setContent(newContent);
      await generateFollowUpQuestions(selectedTopic.title, generatedContent);
    } catch (error: any) {
      console.error('Error:', error);
      setContent(null);
      setError(error.message);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleSelectFollowUp = async (question: FollowUpQuestion) => {
    if (!selectedTopic) return;
    
    setIsGeneratingContent(true);
    setError(null);
    
    try {
      const generatedContent = await generateContent(selectedTopic.title, 'follow-up-answer');
      
      const newContent: Content = {
        id: `followup-${question.id}`,
        topicId: selectedTopic.id,
        type: 'explanation',
        title: question.question,
        content: generatedContent
      };
      
      setContent(newContent);
      await generateFollowUpQuestions(selectedTopic.title, generatedContent);
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header 
          onBackToSubjects={onBackToSubjects} 
          currentSubject={subject.name} 
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingIndicator message="Loading topics..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        onBackToSubjects={onBackToSubjects} 
        currentSubject={subject.name}
        currentTopic={selectedTopic?.title}
      />
      
      <div className="container mx-auto p-4 md:p-6 flex-1 flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <TopicDiscoveryPanel 
            topics={topics} 
            onSelectTopic={handleSelectTopic}
            selectedTopicId={selectedTopic?.id}
          />
        </div>
        
        <div className="md:w-2/3 space-y-4">
          <PromptSection 
            selectedTopic={selectedTopic} 
            onGenerateContent={handleGenerateContent}
            isGenerating={isGeneratingContent}
          />
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}
          
          <ContentSection 
            content={content} 
            isLoading={isGeneratingContent} 
          />
          
          {content && !isGeneratingContent && (
            <>
              <FollowUpQuestions 
                questions={followUpQuestions} 
                onSelectQuestion={handleSelectFollowUp} 
              />
              
              <RelatedTopics 
                topics={relatedTopics} 
                onSelectTopic={handleSelectTopic} 
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubjectPage;