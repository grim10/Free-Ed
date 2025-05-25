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
  content: string  // AI returns numbered text as you showed
}

interface Props {
  content:   Content | null
  isLoading: boolean
}

const ICONS = {
  Overview:           '🔍',
  Analogy:            '🪄',
  'Core Concepts':    '💡',
  'Formula & Derivation': '📐',
  Examples:           '📝',
}

const COLORS = {
  Overview:           'border-blue-500 bg-blue-50',
  Analogy:            'border-yellow-500 bg-yellow-50',
  'Core Concepts':    'border-green-500 bg-green-50',
  'Formula & Derivation': 'border-purple-500 bg-purple-50',
  Examples:           'border-indigo-500 bg-indigo-50',
}

const ContentSection: React.FC<Props> = ({ content, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
        {/* … your existing skeleton … */}
      </div>
    )
  }
  if (!content) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center justify-center h-96">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">
          No content selected
        </h3>
        <p className="text-gray-500 text-center max-w-md">
          Choose a topic and prompt to generate content.
        </p>
      </div>
    )
  }

  // 1️⃣ Normalize numbered AI text -> real markdown headings
  const markdown = useMemo(() => {
    return content.content
      // Turn "1) Overview:" into "## Overview"
      .replace(/^\s*\d+\)\s*([A-Za-z &]+):/gm, '## $1')
      // If your AI emits "Core concepts:" without number:
      .replace(/^Core concepts:/gim, '## Core Concepts:')
      // Clean up extra blank lines
      .trim()
  }, [content.content])

  // 2️⃣ Split into sections
  const sections = useMemo(() => {
    return markdown
      .split(/^##\s+/gm)
      .map(block => block.trim())
      .filter(block => block.length > 0)
      .map(block => {
        const [rawTitle, ...rest] = block.split('\n')
        const title = rawTitle.replace(/:$/, '').trim()
        return {
          title,
          body: rest.join('\n').trim(),
          slug: slugify(title, { lower: true }),
        }
      })
  }, [markdown])

  // 3️⃣ Build TOC
  const toc = sections.map(s => ({ title: s.title, slug: s.slug }))

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ── Sticky TOC (desktop) ── */}
      <nav className="hidden lg:block sticky top-24 self-start w-56 prose">
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

      {/* ── Main content ── */}
      <article className="prose prose-lg max-w-none flex-1 space-y-10">
        {/* Page title */}
        <h1 className="text-4xl font-bold">{content.title}</h1>

        {/* Section cards */}
        {sections.map(sec => (
          <section
            id={sec.slug}
            key={sec.slug}
            className={`
              border-l-4 p-6 rounded-lg
              ${COLORS[sec.title] ?? 'border-gray-300 bg-gray-50'}
            `}
          >
            <h2 className="flex items-center gap-3 text-2xl font-semibold mb-4">
              <span>{ICONS[sec.title] ?? '✨'}</span>
              {sec.title}
            </h2>

            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
              components={{
                p:    ({node, ...props}) => <p className="mb-4" {...props} />,
                ul:   ({node, ...props}) => <ul className="list-disc list-inside mb-4" {...props} />,
                ol:   ({node, ...props}) => <ol className="list-decimal list-inside mb-4" {...props} />,
                table:({node, ...props}) => <table className="w-full table-auto border mb-6" {...props} />,
                thead:({node, ...props}) => <thead className="bg-gray-100" {...props} />,
                th:   ({node, ...props}) => <th className="px-4 py-2" {...props} />,
                td:   ({node, ...props}) => <td className="px-4 py-2 border-t" {...props} />,
                code: ({inline, children, ...props}) =>
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
