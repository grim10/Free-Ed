import React, { useState, useEffect } from 'react';
import { Topic } from '../types';
import TopicCard from './TopicCard';
import { X, Menu } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
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

  const handleTopicSelect = (topic: Topic) => {
    onSelectTopic(topic);
    setIsOpen(false); // Close drawer on mobile after selection
  };

  const recommendedTopics = topics.filter(topic => recommendedTopicIds.includes(topic.id));
  const filteredTopics = difficultyFilter 
    ? topics.filter(topic => topic.difficulty === difficultyFilter)
    : topics;

  const displayedTopics = viewMode === 'recommended' ? recommendedTopics : filteredTopics;
  const regularTopics = displayedTopics.filter(topic => topic.difficulty !== 'Advanced');
  const advancedTopics = displayedTopics.filter(topic => topic.difficulty === 'Advanced');

  // Mobile drawer toggle button
  const DrawerToggle = () => (
    <button 
      onClick={() => setIsOpen(true)}
      className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md"
      aria-label="Open topics menu"
    >
      <Menu className="w-6 h-6 text-gray-700" />
    </button>
  );

  const Drawer = () => (
    <div 
      className={`fixed inset-y-0 left-0 w-80 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:transform-none md:shadow-none md:w-full`}
    >
      {/* Drawer Header */}
      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold text-gray-800">Explore Topics</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-gray-500 hover:text-gray-700"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* View Mode Selector */}
        <div className="px-4 pb-4">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'all' | 'recommended')}
            className="w-full p-2 border border-gray-200 rounded-lg text-sm md:hidden"
          >
            <option value="recommended">Recommended Topics</option>
            <option value="all">All Topics</option>
          </select>
          
          {/* Desktop view mode buttons */}
          <div className="hidden md:flex space-x-2">
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
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto h-[calc(100vh-120px)] md:h-[calc(100vh-180px)]">
        {/* Learning Path */}
        {viewMode === 'recommended' && (
          <div className="px-4 py-3 space-y-2">
            <h3 className="text-sm font-medium text-blue-800">Recommended Path</h3>
            {recommendedTopicIds.map((topicId, index) => {
              const topic = topics.find(t => t.id === topicId);
              if (!topic) return null;
              
              const status = getTopicStatus(topicId);
              
              return (
                <button
                  key={topicId}
                  onClick={() => handleTopicSelect(topic)}
                  className="w-full flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-lg">
                    {status === 'completed' ? '✅' : status === 'in-progress' ? '🔄' : '🔒'}
                  </span>
                  <span className="flex-1 text-left text-sm">
                    {topic.title}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                    {topic.difficulty}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="sticky top-0 bg-white z-10 px-4 py-3 border-t border-b border-gray-200">
          <div className="flex space-x-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              className={`scroll-snap-align-start shrink-0 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                difficultyFilter === null 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setDifficultyFilter(null)}
            >
              All
            </button>
            <button
              className={`scroll-snap-align-start shrink-0 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                difficultyFilter === 'Beginner' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              onClick={() => setDifficultyFilter('Beginner')}
            >
              Beginner
            </button>
            <button
              className={`scroll-snap-align-start shrink-0 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                difficultyFilter === 'Intermediate' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              onClick={() => setDifficultyFilter('Intermediate')}
            >
              Intermediate
            </button>
            <button
              className={`scroll-snap-align-start shrink-0 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                showAdvanced ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              Advanced
            </button>
          </div>
        </div>

        {/* Topic Cards */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regularTopics.map(topic => (
              <TopicCard 
                key={topic.id} 
                topic={topic} 
                onClick={handleTopicSelect}
                isActive={topic.id === selectedTopicId}
                isRecommended={recommendedTopicIds.includes(topic.id)}
                status={getTopicStatus(topic.id)}
              />
            ))}
            
            {showAdvanced && advancedTopics.map(topic => (
              <TopicCard 
                key={topic.id} 
                topic={topic} 
                onClick={handleTopicSelect}
                isActive={topic.id === selectedTopicId}
                isRecommended={recommendedTopicIds.includes(topic.id)}
                status={getTopicStatus(topic.id)}
              />
            ))}
            
            {displayedTopics.length === 0 && (
              <div className="col-span-full py-8 text-center text-gray-500">
                No topics found with the selected filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <DrawerToggle />
      <Drawer />
    </>
  );
};

export default TopicDiscoveryPanel;