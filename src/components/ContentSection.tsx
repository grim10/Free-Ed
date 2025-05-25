// components/ContentSection.tsx
import React from 'react';
import type { ContentResult } from '../services/ContentService';

interface Props {
  content: ContentResult | null;
  isLoading: boolean;
}

export const QuickReference: React.FC<{ bullets: string[] }> = ({
  bullets,
}) => {
  if (!bullets.length) return null;
  return (
    <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-lg">
      <h4 className="text-blue-800 font-semibold flex items-center mb-3">
        <span className="mr-2">📌</span>Quick Reference
      </h4>
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
};

const ContentSection: React.FC<Props> = ({ content, isLoading }) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="text-center text-gray-500 py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl mb-2">No content selected</h3>
        <p>Select a topic and prompt type to get started.</p>
      </div>
    );
  }

  return (
    <div className="prose max-w-none">
      {/* full AI output */}
      <pre className="whitespace-pre-wrap">{content.full}</pre>

      {/* quick reference from the AI itself */}
      <QuickReference bullets={content.quickReference} />
    </div>
  );
};

export default ContentSection;
