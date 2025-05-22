import React from 'react';
import { FollowUpQuestion } from '../types';

interface FollowUpQuestionsProps {
  questions: FollowUpQuestion[];
  onSelectQuestion: (question: FollowUpQuestion) => void;
}

const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({ 
  questions, 
  onSelectQuestion 
}) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Next steps to deepen your understanding:</h3>
      <div className="space-y-2">
        {questions.map((question) => (
          <button
            key={question.id}
            onClick={() => onSelectQuestion(question)}
            className="w-full text-left p-3 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors border border-gray-200 hover:border-blue-200"
          >
            <div className="flex items-start">
              <span className="mr-2 text-blue-500">
                {question.contentType === 'explanation' ? '🧠' : 
                 question.contentType === 'example' ? '📝' : 
                 question.contentType === 'question' ? '❓' : '📊'}
              </span>
              <span>{question.question}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FollowUpQuestions;