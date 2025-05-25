import React from 'react';
import { Content } from '../types';

interface ContentSectionProps {
  content: Content | null;
  isLoading: boolean;
}

const SectionBlock: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="mb-8">
    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
      {/* Map title to emoji */}
      <span>{{
        Overview: '📖',
        Analogy: '🔍',
        Steps: '📝',
        Formula: '➗',
        Example: '💡',
        "Key Insights": '🔑',
      }[title] || '✨'}</span>
      {title}
    </h3>
    <ul className="list-disc list-inside space-y-2">
      {items.map((item, idx) => (
        <li key={idx} className="text-gray-700 leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const ContentSection: React.FC<ContentSectionProps> = ({ content, isLoading }) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-6 bg-white rounded-lg shadow-sm">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded w-full" />
        ))}
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-white rounded-lg shadow-sm p-6">
        <span className="text-5xl mb-4">🔍</span>
        <h3 className="text-2xl font-medium text-gray-700 mb-2">No content selected</h3>
        <p className="text-center text-gray-500 max-w-sm">
          Select a topic and prompt type to generate personalized content
        </p>
      </div>
    );
  }

  // Parse sections by detecting section titles followed by colon
  const lines = content.content.split('\n');
  const sections: Record<string, string[]> = {};
  let currentTitle = 'Overview';
  sections[currentTitle] = [];

  lines.forEach((line) => {
    const match = line.match(/^([A-Za-z ]+):\s*(.*)$/);
    if (match) {
      currentTitle = match[1].trim();
      sections[currentTitle] = [];
      if (match[2]) sections[currentTitle].push(match[2]);
    } else if (line.trim()) {
      sections[currentTitle].push(line.trim());
    }
  });

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-3xl font-bold text-gray-800">{content.title}</h2>
        <span className="text-3xl">✨</span>
      </div>

      {/* Render sections */}
      {Object.entries(sections).map(([title, items]) => (
        <SectionBlock key={title} title={title} items={items} />
      ))}

      {/* Quick Reference */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
          <span>📌</span> Quick Reference
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Key Concepts</p>
            <ul className="list-disc list-inside space-y-1 mt-2 text-gray-700">
              {Object.values(sections)
                .flat()
                .slice(0, 3)
                .map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
            </ul>
          </div>
          <div>
            <p className="text-sm text-gray-600">Remember</p>
            <ul className="space-y-1 mt-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                Focus on the <strong>Overview</strong> before diving into details.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentSection;
