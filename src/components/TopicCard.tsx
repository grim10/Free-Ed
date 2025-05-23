import React, { useState } from 'react';
import { Topic } from '../types';

interface TopicCardProps {
  topic: Topic;
  onClick: (topic: Topic) => void;
  isActive?: boolean;
  isRecommended?: boolean;
  status: 'completed' | 'in-progress' | 'upcoming';
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Beginner':
      return 'bg-green-100 text-green-700';
    case 'Intermediate':
      return 'bg-blue-100 text-blue-700';
    case 'Advanced':
      return 'bg-purple-100 text-purple-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return '✅';
    case 'in-progress':
      return '🔄';
    default:
      return '🔒';
  }
};

const TopicCard: React.FC<TopicCardProps> = ({ 
  topic, 
  onClick, 
  isActive = false,
  isRecommended = false,
  status
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullTitle, setShowFullTitle] = useState(false);
  const difficultyClass = getDifficultyColor(topic.difficulty);
  
  return (
    <div
      className={`rounded-lg transition-all duration-300 cursor-pointer relative
        ${isActive 
          ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
          : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow'
        }`}
      onClick={() => onClick(topic)}
      onMouseEnter={() => setShowFullTitle(true)}
      onMouseLeave={() => setShowFullTitle(false)}
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
    >
      {/* Header Section */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{getStatusIcon(status)}</span>
          {isRecommended && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              Recommended
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyClass}`}>
            {topic.difficulty}
          </span>
        </div>

        <div className="flex items-start justify-between">
          <h3 className={`text-base ${isActive ? 'font-semibold' : 'font-medium'} text-gray-900 line-clamp-2`}>
            {topic.title}
          </h3>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {/* Collapsible Content */}
        <div className={`mt-2 space-y-2 transition-all duration-300 ${isExpanded ? 'block' : 'hidden'}`}>
          {topic.keywords.map((keyword, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              <span className="text-sm text-gray-700">{keyword}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip for full title */}
      {showFullTitle && (
        <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg max-w-xs">
          {topic.title}
        </div>
      )}
    </div>
  );
};

export default TopicCard;