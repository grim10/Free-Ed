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

  const formatContent = (content: string) => {
    // Split content into sections based on numbered headers
    const sections = content.split(/\*\*\d+\./);

    return sections.map((section, index) => {
      if (!section.trim()) return null;

      // Extract title and content
      const [title, ...contentParts] = section.split(':**');
      const sectionContent = contentParts.join(':**').trim();

      // Skip if no meaningful content
      if (!sectionContent) return null;

      // Format formulas with proper spacing and highlighting
      const formattedContent = sectionContent.replace(
        /(\$[^$]+\$)|(`[^`]+`)/g,
        (match) => `<code class="bg-gray-100 px-2 py-1 rounded">${match.slice(1, -1)}</code>`
      );

      // Add emojis based on section content
      const getEmoji = (title: string) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('example')) return '📝';
        if (lowerTitle.includes('application')) return '🔧';
        if (lowerTitle.includes('takeaway')) return '💡';
        if (lowerTitle.includes('step')) return '📋';
        if (lowerTitle.includes('explanation')) return '🎯';
        return '✨';
      };

      return (
        <div key={index} className="mb-6">
          {title && (
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
              {getEmoji(title)} {title}
            </h3>
          )}
          <div className="space-y-4">
            {formattedContent.split('- ').map((point, i) => {
              if (!point.trim()) return null;
              return (
                <div key={i} className="flex items-start gap-2">
                  <div className="text-blue-500 mt-1">•</div>
                  <p className="text-gray-700 leading-relaxed">{point.trim()}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="animate-fadeIn">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{content.title}</h2>
          <span className="text-2xl">✨</span>
        </div>
        
        <div className="prose max-w-none">
          {formatContent(content.content)}
        </div>

        {/* Quick Reference Box */}
        <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h4 className="text-blue-800 font-medium mb-3 flex items-center gap-2">
            <span>📌</span> Quick Reference
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded p-3 shadow-sm">
              <p className="text-sm text-gray-600">Key Concepts</p>
              <ul className="mt-2 space-y-1">
                {content.content
                  .match(/[^.!?]+[.!?]+/g)
                  ?.slice(0, 3)
                  .map((sentence, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {sentence.trim()}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="bg-white rounded p-3 shadow-sm">
              <p className="text-sm text-gray-600">Remember</p>
              <div className="mt-2 text-sm text-gray-700">
                <p className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  Focus on understanding the core principles before moving to complex applications
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentSection;