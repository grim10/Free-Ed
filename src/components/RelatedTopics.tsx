import React from 'react';
import { Topic } from '../types';

interface RelatedTopicsProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
}

const RelatedTopics: React.FC<RelatedTopicsProps> = ({ topics, onSelectTopic }) => {
  if (topics.length === 0) return null;
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-800 mb-3">Related Topics</h3>
      <div className="flex flex-wrap gap-2">
        {topics.map(topic => (
          <button
            key={topic.id}
            onClick={() => onSelectTopic(topic)}
            className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 text-gray-800 hover:text-blue-700 rounded-md transition-colors text-sm border border-gray-200 hover:border-blue-200"
          >
            {topic.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RelatedTopics;