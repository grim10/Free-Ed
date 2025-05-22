import React, { useState, useEffect } from 'react';
import { Topic } from '../types';
import TopicCard from './TopicCard';
import { CheckCircle2, Circle, CircleDot } from 'lucide-react';

interface TopicDiscoveryPanelProps {
  topics: Topic[];
  onSelectTopic: (topic: Topic) => void;
  selectedTopicId?: string;
}

const TopicDiscoveryPanel: React.FC<TopicDiscoveryPanelProps> = ({ 
  topics, 
  onSelectTopic,
  selectedTopicId
}) => {
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'recommended'>('recommended');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  const [inProgressTopic, setInProgressTopic] = useState<string | null>(null);
  
  const recommendedTopicIds = [
    'moving-charges-magnetism',
    'lorentz-force',
    'electromagnetic-induction',
    'amperes-law'
  ];

  // Load user progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('topicProgress');
    if (savedProgress) {
      const { completed, inProgress } = JSON.parse(savedProgress);
      setCompletedTopics(completed);
      setInProgressTopic(inProgress);
    }
  }, []);

  const getTopicStatus = (topicId: string) => {
    if (completedTopics.includes(topicId)) return 'completed';
    if (inProgressTopic === topicId) return 'in-progress';
    return 'upcoming';
  };

  const recommendedTopics = topics.filter(topic => recommendedTopicIds.includes(topic.id));
  const filteredTopics = difficultyFilter 
    ? topics.filter(topic => topic.difficulty === difficultyFilter)
    : topics;

  const displayedTopics = viewMode === 'recommended' ? recommendedTopics : filteredTopics;
  const regularTopics = displayedTopics.filter(topic => topic.difficulty !== 'Advanced');
  const advancedTopics = displayedTopics.filter(topic => topic.difficulty === 'Advanced');

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800">Explore Topics</h2>
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              viewMode === 'recommended' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('recommended')}
          >
            Recommended
          </button>
          <button
            className={`px-3 py-1 rounded-full text-xs ${
              viewMode === 'all' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setViewMode('all')}
          >
            All Topics
          </button>
        </div>
      </div>

      {viewMode === 'recommended' && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-3">Recommended Learning Path</h3>
          <div className="space-y-3">
            {recommendedTopicIds.map((topicId, index) => {
              const topic = topics.find(t => t.id === topicId);
              if (!topic) return null;
              
              const status = getTopicStatus(topicId);
              
              return (
                <div 
                  key={topicId}
                  className="flex items-center gap-3 text-sm"
                  role="listitem"
                  aria-label={`${topic.title} - ${status}`}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : status === 'in-progress' ? (
                    <CircleDot className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                  <span className={`flex-1 ${status === 'completed' ? 'text-green-700' : status === 'in-progress' ? 'text-blue-700' : 'text-gray-600'}`}>
                    {index + 1}. {topic.title}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {topic.difficulty}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end mb-4 gap-2">
        <div 
          role="group"
          aria-label="Difficulty filters"
          className="flex space-x-2"
        >
          <button
            className={`px-3 py-1 rounded-full text-xs ${
              difficultyFilter === null 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setDifficultyFilter(null)}
          >
            All
          </button>
          <button
            className={`px-3 py-1 rounded-full text-xs ${
              difficultyFilter === 'Beginner' 
                ? 'bg-green-600 text-white' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            onClick={() => setDifficultyFilter('Beginner')}
          >
            Beginner
          </button>
          <button
            className={`px-3 py-1 rounded-full text-xs ${
              difficultyFilter === 'Intermediate' 
                ? 'bg-blue-600 text-white' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
            onClick={() => setDifficultyFilter('Intermediate')}
          >
            Intermediate
          </button>
        </div>
        
        <button
          className={`px-3 py-1 rounded-full text-xs transition-colors ${
            showAdvanced ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
        >
          Advanced Topics
        </button>
      </div>
      
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-1"
        role="list"
        aria-label="Available topics"
      >
        {regularTopics.map(topic => (
          <TopicCard 
            key={topic.id} 
            topic={topic} 
            onClick={onSelectTopic}
            isActive={topic.id === selectedTopicId}
            isRecommended={recommendedTopicIds.includes(topic.id)}
            status={getTopicStatus(topic.id)}
          />
        ))}
        
        {showAdvanced && advancedTopics.map(topic => (
          <TopicCard 
            key={topic.id} 
            topic={topic} 
            onClick={onSelectTopic}
            isActive={topic.id === selectedTopicId}
            isRecommended={recommendedTopicIds.includes(topic.id)}
            status={getTopicStatus(topic.id)}
          />
        ))}
        
        {displayedTopics.length === 0 && (
          <div 
            className="col-span-2 py-8 text-center text-gray-500"
            role="alert"
          >
            No topics found with the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicDiscoveryPanel;