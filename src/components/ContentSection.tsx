// src/components/ContentSection.tsx
import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm   from 'remark-gfm'
import remarkMath  from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw   from 'rehype-raw'
import slugify     from 'slugify'

export interface Content {
  title:   string
  content: string  // should include real markdown headings like "## Overview", "## Formula", etc.
}

interface Props {
  content:   Content | null
  isLoading: boolean
}

const COLORS: Record<string,string> = {
  Overview:            'border-blue-500 bg-blue-50',
  Analogy:             'border-yellow-500 bg-yellow-50',
  'Core Concepts':     'border-green-500 bg-green-50',
  'Formula & Derivation': 'border-purple-500 bg-purple-50',
  Examples:            'border-indigo-500 bg-indigo-50',
  Takeaways:           'border-teal-500 bg-teal-50',
}

const ICONS: Record<string,string> = {
  Overview:            '🔍',
  Analogy:             '🪄',
  'Core Concepts':     '💡',
  'Formula & Derivation': '📐',
  Examples:            '📝',
  Takeaways:           '✅',
}

const ContentSection: React.FC<Props> = ({ content, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        {/* loading skeleton */}
      </div>
    )
  }
  if (!content) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center justify-center h-64">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-gray-500">Select a topic to generate content.</p>
      </div>
    )
  }

  // Split on real markdown headings "## Title"
  const sections = useMemo(() => {
    return content.content
      .split(/^##\s+/gm)                 // split at "## "
      .map(chunk => chunk.trim())
      .filter(chunk => chunk.length > 0)
      .map(chunk => {
        const [rawTitle, ...rest] = chunk.split('\n')
        const title = rawTitle.replace(/:$/, '').trim()
        return {
          title,
          slug:  slugify(title, { lower: true }),
          body:  rest.join('\n').trim(),
        }
      })
  }, [content.content])

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sticky TOC */}
      <nav className="hidden lg:block sticky top-24 self-start w-56 prose">
        <h4 className="font-semibold mb-2">On this page</h4>
        <ul className="space-y-1">
          {sections.map(sec => (
            <li key={sec.slug}>
              <a
                href={`#${sec.slug}`}
                className="text-blue-600 hover:underline"
              >
                {sec.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main content */}
      <article className="prose prose-lg max-w-none flex-1 space-y-10">
        <h1 className="text-4xl font-bold">{content.title}</h1>

        {sections.map(sec => (
          <section
            id={sec.slug}
            key={sec.slug}
            className={`
              border-l-4 p-6 rounded-lg 
              ${COLORS[sec.title] ?? 'border-gray-300 bg-gray-50'}
            `}
          >
            <h2 className="flex items-center gap-2 text-2xl font-semibold mb-4">
              <span>{ICONS[sec.title] || '✨'}</span>
              {sec.title}
            </h2>

            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{
                // paragraphs
                p: ({ node, ...props }) => (
                  <p className="mb-4 leading-relaxed" {...props} />
                ),
                // block math display
                div: ({ node, className, children, ...props }) => {
                  // react-markdown + rehype-katex wraps $$...$$ output in a div.katex-display
                  if (className?.includes('katex-display')) {
                    return (
                      <div className="my-6 p-4 bg-white rounded-lg shadow-sm text-center" {...props}>
                        {children}
                      </div>
                    )
                  }
                  return <div {...props}>{children}</div>
                },
                // lists
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside mb-4 space-y-1" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-1" {...props} />
                ),
                // tables
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
                // code blocks / inline
                code: ({ inline, children, ...props }) =>
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
  )
}

export default ContentSection
