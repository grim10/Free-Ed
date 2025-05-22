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
  const [showFullTitle, setShowFullTitle] = useState(false);
  const difficultyClass = getDifficultyColor(topic.difficulty);
  
  return (
    <div
      className={`p-4 rounded-lg transition-all duration-300 cursor-pointer relative
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
      <div className="flex items-start gap-3">
        <span className="text-lg shrink-0">{getStatusIcon(status)}</span>
        
        <div className="flex-1 min-w-0">
          {isRecommended && (
            <div className="inline-block bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full mb-1">
              Recommended
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-base ${isActive ? 'font-semibold' : 'font-medium'} text-gray-900 line-clamp-2`}>
              {topic.title}
            </h3>
            <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${difficultyClass}`}>
              {topic.difficulty}
            </span>
          </div>

          <p className="mt-1 text-sm text-gray-600 line-clamp-2 md:hidden">
            {topic.description}
          </p>

          <div className="hidden md:flex mt-2 flex-wrap gap-1">
            {topic.keywords.slice(0, 3).map((keyword, index) => (
              <span 
                key={index} 
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
              >
                {keyword}
              </span>
            ))}
            {topic.keywords.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                +{topic.keywords.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {showFullTitle && (
        <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
          {topic.title}
        </div>
      )}
    </div>
  );
};

export default TopicCard;