import React from 'react';
import { Content } from '../types';

interface ContentSectionProps {
  content: Content | null;
  isLoading: boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({ content, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
        <div className="h-40 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center justify-center h-96">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">No content selected</h3>
        <p className="text-gray-500 text-center max-w-md">
          Select a topic and prompt type to generate personalized educational content
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="animate-fadeIn">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{content.title}</h2>
        <div className="prose max-w-none">
          {content.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentSection;