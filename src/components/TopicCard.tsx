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
      {isRecommended && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
          Recommended
        </div>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon(status)}</span>
          <h3 className={`text-lg ${isActive ? 'font-semibold' : 'font-medium'} text-gray-900 line-clamp-2 group-hover:line-clamp-none`}>
            {topic.title}
          </h3>
          {showFullTitle && (
            <div className="absolute z-20 top-full left-0 mt-2 p-2 bg-gray-800 text-white text-sm rounded shadow-lg">
              {topic.title}
            </div>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${difficultyClass}`}>
          {topic.difficulty}
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{topic.description}</p>

      <div className="flex flex-wrap gap-1">
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
  );
};

export default TopicCard;