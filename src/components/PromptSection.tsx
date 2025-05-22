import React, { useState, useEffect } from 'react';
import PromptButton from './PromptButton';
import { Topic } from '../types';
import { promptTypes } from '../data/mockData';

interface PromptSectionProps {
  selectedTopic: Topic | null;
  onGenerateContent: (promptType: string) => void;
  isGenerating: boolean;
}

const PromptSection: React.FC<PromptSectionProps> = ({ 
  selectedTopic, 
  onGenerateContent,
  isGenerating
}) => {
  const [selectedPromptType, setSelectedPromptType] = useState<string | null>(null);
  const [hoveredPrompt, setHoveredPrompt] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mostUsedPrompts, setMostUsedPrompts] = useState<string[]>([]);

  // Load most used prompts from localStorage
  useEffect(() => {
    const usageData = localStorage.getItem('promptUsage');
    if (usageData) {
      const usage = JSON.parse(usageData);
      const sorted = Object.entries(usage)
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 2)
        .map(([id]) => id);
      setMostUsedPrompts(sorted);
    }
  }, []);

  const updatePromptUsage = (promptId: string) => {
    const usageData = localStorage.getItem('promptUsage');
    const usage = usageData ? JSON.parse(usageData) : {};
    usage[promptId] = (usage[promptId] || 0) + 1;
    localStorage.setItem('promptUsage', JSON.stringify(usage));
  };

  const handlePromptClick = (promptTypeId: string) => {
    setSelectedPromptType(promptTypeId);
    updatePromptUsage(promptTypeId);
    onGenerateContent(promptTypeId);
  };

  const regularPrompts = promptTypes.filter(p => !['deep-dive', 'exam-mastery', 'concept-map'].includes(p.id));
  const advancedPrompts = promptTypes.filter(p => ['deep-dive', 'exam-mastery', 'concept-map'].includes(p.id));

  if (!selectedTopic) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-gray-500 text-center">Select a topic to see prompt options</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-medium text-gray-800 mb-4">
        What would you like to learn about <span className="text-blue-600 font-semibold">{selectedTopic.title}</span>?
      </h3>
      
      <div className="space-y-4">
        <div 
          className="grid grid-cols-2 md:grid-cols-3 gap-3"
          role="group"
          aria-label="Learning options"
        >
          {regularPrompts.map(promptType => (
            <div
              key={promptType.id}
              className="relative"
              onMouseEnter={() => setHoveredPrompt(promptType.id)}
              onMouseLeave={() => setHoveredPrompt(null)}
            >
              <button
                onClick={() => handlePromptClick(promptType.id)}
                className={`w-full h-full p-4 rounded-lg transition-all duration-300 group
                  ${selectedPromptType === promptType.id
                    ? 'bg-blue-500 text-white shadow-lg scale-[1.02]'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:shadow hover:scale-[1.02]'
                  } ${mostUsedPrompts.includes(promptType.id) ? 'ring-2 ring-blue-300' : ''}`}
                aria-pressed={selectedPromptType === promptType.id}
                data-test={`prompt-button-${promptType.id}`}
              >
                <div className="flex flex-col items-center text-center gap-2">
                  <span className="text-2xl mb-1">{promptType.icon}</span>
                  <span className="font-medium text-sm">{promptType.label}</span>
                </div>
              </button>
              
              {hoveredPrompt === promptType.id && (
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10"
                  role="tooltip"
                >
                  <div className="relative">
                    {promptType.description}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            aria-expanded={showAdvanced}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        {showAdvanced && (
          <div 
            className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-gray-200"
            role="group"
            aria-label="Advanced learning options"
          >
            {advancedPrompts.map(promptType => (
              <div
                key={promptType.id}
                className="relative"
                onMouseEnter={() => setHoveredPrompt(promptType.id)}
                onMouseLeave={() => setHoveredPrompt(null)}
              >
                <button
                  onClick={() => handlePromptClick(promptType.id)}
                  className={`w-full h-full p-4 rounded-lg transition-all duration-300 group
                    ${selectedPromptType === promptType.id
                      ? 'bg-purple-500 text-white shadow-lg scale-[1.02]'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:shadow hover:scale-[1.02]'
                    }`}
                  aria-pressed={selectedPromptType === promptType.id}
                  data-test={`prompt-button-${promptType.id}`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <span className="text-2xl mb-1">{promptType.icon}</span>
                    <span className="font-medium text-sm">{promptType.label}</span>
                  </div>
                </button>
                
                {hoveredPrompt === promptType.id && (
                  <div 
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10"
                    role="tooltip"
                  >
                    <div className="relative">
                      {promptType.description}
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="mt-6 flex items-center justify-center p-4 bg-blue-50 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-blue-700">Generating personalized content...</span>
        </div>
      )}
    </div>
  );
};

export default PromptSection;