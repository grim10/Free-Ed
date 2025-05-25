// src/components/ContentSection.tsx

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export interface Content {
  title: string;
  content: string; // Markdown string returned by your AI service
}

interface ContentSectionProps {
  content: Content | null;
  isLoading: boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({ content, isLoading }) => {
  // 1️⃣ Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-6" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-40 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  // 2️⃣ Empty state
  if (!content) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center justify-center h-96">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">No content selected</h3>
        <p className="text-gray-500 text-center max-w-md">
          Select a topic and prompt type to generate personalized educational content.
        </p>
      </div>
    );
  }

  // 3️⃣ Pull out the first 3 sentences for Quick Reference
  const keyPoints = useMemo(() => {
    const sentences = content.content
      .trim()
      .match(/[^.!?]+[.!?]+/g)
      ?.map(s => s.trim()) ?? [];
    return sentences.slice(0, 3);
  }, [content]);

  // 4️⃣ Render the Markdown article
  return (
    <article className="bg-white rounded-lg p-6 shadow-sm prose prose-lg max-w-none">
      {/* Article Title */}
      <h1 className="text-3xl font-bold mb-4">{content.title}</h1>

      {/* AI-generated Markdown body */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h2: ({ node, ...props }) => (
            <h2 className="mt-8 mb-4 text-2xl font-semibold" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mt-6 mb-3 text-xl font-medium" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />
          ),
          table: ({ node, ...props }) => (
            <table className="w-full table-auto border border-gray-200 mb-6" {...props} />
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left font-medium" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 border-t" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }) =>
            inline ? (
              <code className="bg-gray-100 px-1 rounded" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto" {...props}>
                {children}
              </pre>
            ),
        }}
      >
        {content.content}
      </ReactMarkdown>

      {/* 5️⃣ Quick Reference */}
      <aside className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
        <h4 className="text-blue-800 font-medium mb-3 flex items-center gap-2">
          📌 Quick Reference
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>Key Points:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {keyPoints.map((pt, idx) => (
                <li key={idx} className="text-gray-700">
                  {pt}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Remember:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-green-700">
              <li>Focus on understanding core principles before tackling IIT-JEE problems.</li>
            </ul>
          </div>
        </div>
      </aside>
    </article>
  );
};

export default ContentSection;
