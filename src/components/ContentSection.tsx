// 🔧 Ensure you have installed: react-markdown, remark-gfm, react-helmet, slugify
// npm install react-markdown remark-gfm react-helmet slugify
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Helmet } from 'react-helmet';
import slugify from 'slugify';
import { Content } from '../types';

interface ContentSectionProps {
  content: Content | null;
  isLoading: boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({ content, isLoading }) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  // No content state
  if (!content) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center justify-center h-80">
        <span className="text-6xl mb-4">🔍</span>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No content selected</h3>
        <p className="text-gray-500 text-center max-w-sm">
          Choose a topic to generate a dynamic, SEO-optimized article—complete with explanations, formulas, examples, and practice problems.
        </p>
      </div>
    );
  }

  // Meta description: first paragraph or first 160 chars
  const metaDescription = useMemo(() => {
    const firstParaMatch = content.content.trim().match(/^(?:[^#\n].+?)(?=\n)/);
    const raw = firstParaMatch ? firstParaMatch[0] : content.content.slice(0, 160);
    // Remove markdown characters
    const cleanupRegex = /[#_*>\`~\-!\[\]]/g;
    return raw.replace(cleanupRegex, '').trim();
  }, [content]);

  // JSON-LD structured data for Article schema
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.title,
    description: metaDescription,
    datePublished: new Date().toISOString(),
    author: { "@type": "Organization", name: "YourSiteName" },
    articleBody: content.content
  }), [content, metaDescription]);

  // Extract H2 headings for a Table of Contents
  const headings = useMemo(() => {
    const regex = /^##\s+(.+)$/gm;
    const result: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content.content)) !== null) {
      result.push(match[1]);
    }
    return result;
  }, [content]);

  // Custom heading renderer to inject IDs and classes
  const headingClasses: Record<number, string> = {
    2: 'text-2xl font-semibold mt-8 mb-4 text-gray-800',
    3: 'text-xl font-medium mt-6 mb-3 text-gray-800'
  };

  const HeadingRenderer = ({ level, children }: any) => {
    const text = String(children[0]);
    const id = slugify(text, { lower: true, strict: true });
    return React.createElement(
      `h${level}`,
      { id, className: headingClasses[level] || '' },
      children
    );
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>{content.title} | YourSiteName</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={content.title} />
        <meta property="og:description" content={metaDescription} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <article className="bg-white rounded-lg p-8 shadow-md prose prose-lg max-w-none">
        {/* Article Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{content.title}</h1>

        {/* Optional Table of Contents */}
        {headings.length > 0 && (
          <nav className="mb-6 bg-gray-50 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">In This Article</h2>
            <ul className="list-disc list-inside space-y-1">
              {headings.map((text) => {
                const id = slugify(text, { lower: true, strict: true });
                return (
                  <li key={id}>
                    <a href={`#${id}`} className="text-blue-600 hover:underline">
                      {text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Render AI-generated Markdown */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{ h2: HeadingRenderer, h3: HeadingRenderer }}
        >
          {content.content}
        </ReactMarkdown>
      </article>
    </>
  );
};

export default ContentSection;
