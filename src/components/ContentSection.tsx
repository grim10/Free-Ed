// src/components/ContentSection.tsx

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm   from 'remark-gfm';
import remarkMath  from 'remark-math';
import rehypeRaw   from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import slugify     from 'slugify';

export interface Content {
  title:   string;
  content: string;  // Markdown+LaTeX from your AI service
}

interface Props {
  content:   Content | null;
  isLoading: boolean;
}

const ICONS: Record<string,string> = {
  Overview:           '🔍',
  Analogy:            '🪄',
  'Core Concepts':    '💡',
  'Formula & Derivation': '📐',
  Examples:           '📝',
};

const BORDER_COLORS: Record<string,string> = {
  Overview:           'border-blue-500 bg-blue-50',
  Analogy:            'border-yellow-500 bg-yellow-50',
  'Core Concepts':    'border-green-500 bg-green-50',
  'Formula & Derivation': 'border-purple-500 bg-purple-50',
  Examples:           'border-indigo-500 bg-indigo-50',
};

const ContentSection: React.FC<Props> = ({ content, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-40 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center justify-center h-96">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">No content selected</h3>
        <p className="text-gray-500 text-center max-w-md">
          Choose a topic and prompt to generate content.
        </p>
      </div>
    );
  }

  // 1) Split into sections by "## Heading"
  const sections = useMemo(() => {
    return content.content
      .split(/^##\s+/gm)
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 0)
      .map(chunk => {
        const [titleLine, ...rest] = chunk.split('\n');
        return {
          title: titleLine.trim(),
          body:  rest.join('\n').trim(),
          slug:  slugify(titleLine.trim(), { lower: true }),
        };
      });
  }, [content]);

  // 2) Build a simple TOC
  const toc = sections.map(s => ({ title: s.title, slug: s.slug }));

  return (
    <div className="flex gap-8">
      {/* ── Sticky TOC (desktop only) ── */}
      <nav className="hidden lg:block sticky top-24 self-start w-48 prose">
        <h4 className="font-semibold mb-2">On this page</h4>
        <ul className="space-y-1">
          {toc.map(item => (
            <li key={item.slug}>
              <a
                href={`#${item.slug}`}
                className="text-blue-600 hover:underline"
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Main Article ── */}
      <article className="prose prose-lg max-w-none flex-1 space-y-10">
        {/* Page Title */}
        <h1 className="text-4xl font-bold">{content.title}</h1>

        {/* Each section as a coloured card */}
        {sections.map(sec => (
          <section
            key={sec.slug}
            id={sec.slug}
            className={`border-l-4 p-4 rounded-lg ${BORDER_COLORS[sec.title] || 'border-gray-300 bg-gray-50'}`}
          >
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-3">
              <span>{ICONS[sec.title] || '✨'}</span>
              {sec.title}
            </h2>

            {/* Use ReactMarkdown to render lists, tables, LaTeX, etc. */}
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{
                p:    ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                ul:   ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1" {...props} />,
                ol:   ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />,
                table:({node, ...props}) => <table className="w-full table-auto border border-gray-200 mb-6" {...props} />,
                thead:({node, ...props}) => <thead className="bg-gray-100" {...props} />,
                th:   ({node, ...props}) => <th className="px-4 py-2 text-left font-medium" {...props} />,
                td:   ({node, ...props}) => <td className="px-4 py-2 border-t" {...props} />,
                code: ({node, inline, children, ...props}) =>
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
              {sec.body}
            </ReactMarkdown>
          </section>
        ))}
      </article>
    </div>
  );
};

export default ContentSection;
