import React, { useState } from 'react';
import { aiService, PromptType } from '../services/aiService';
import ContentSection from '../components/ContentSection';
import FollowUpQuestions from '../components/FollowUpQuestions';

const SubjectPage: React.FC = () => {
  const [topic] = useState('Electromagnetic Induction');
  const [mode, setMode] = useState<PromptType>('explain-simply');
  const [content, setContent] = useState<null | any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    if (mode === 'follow-up') {
      const qs = await aiService.generateFollowUps(topic);
      setQuestions(qs);
      setContent(null);
    } else {
      const result = await aiService.generateContent(topic, mode);
      setContent(result);
      setQuestions([]);
    }
    setLoading(false);
  };

  return (
    <div className="p-8">
      {/* your PromptSection + PromptButton here */}
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleGenerate}
      >
        Generate
      </button>

      <ContentSection content={content} isLoading={loading && mode !== 'follow-up'} />

      {mode === 'follow-up' && !loading && (
        <FollowUpQuestions questions={questions} />
      )}
    </div>
  );
};

export default SubjectPage;
