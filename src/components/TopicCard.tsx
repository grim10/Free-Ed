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
      {/* Card Header */}
      <div className="p-4">
        {/* Status and Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xl" title={`Status: ${status}`}>
            {getStatusIcon(status)}
          </span>
          {isRecommended && (
            <span className="bg-blue-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              Recommended
            </span>
          )}
          <span className={`${difficultyClass} text-xs font-medium px-2.5 py-1 rounded-full`}>
            {topic.difficulty}
          </span>
        </div>

        {/* Title and Expand Button */}
        <div className="flex items-start justify-between gap-3">
          <h3 className={`text-base leading-snug tracking-tight
            ${isActive ? 'font-semibold text-blue-900' : 'font-medium text-gray-900'}
            ${isExpanded ? '' : 'line-clamp-2'}`}
          >
            {topic.title}
          </h3>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full 
              hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label={isExpanded ? 'Collapse topic' : 'Expand topic'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>

        {/* Collapsible Content */}
        <div className={`mt-3 space-y-2 transition-all duration-300 
          ${isExpanded ? 'block opacity-100' : 'hidden opacity-0'}`}
        >
          {topic.keywords.map((keyword, index) => (
            <div key={index} className="flex items-center gap-2.5 text-sm">
              <span className="text-blue-500 text-lg leading-none">•</span>
              <span className="text-gray-700 font-normal leading-relaxed">
                {keyword}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Full Title Tooltip */}
      {showFullTitle && !isExpanded && (
        <div className="absolute z-20 top-full left-0 mt-2 p-3 bg-gray-800 
          text-white text-sm font-normal rounded-lg shadow-lg max-w-xs leading-relaxed"
        >
          {topic.title}
        </div>
      )}
    </div>
  );
};

export default TopicCard;