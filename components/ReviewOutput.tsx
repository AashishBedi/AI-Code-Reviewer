import React, { useState } from 'react';
import type { ReviewResult } from '../types.ts';
import CopyIcon from './icons/CopyIcon.tsx';

interface ReviewOutputProps {
  reviewResult: ReviewResult;
}

interface CodeBlockProps {
  code: string;
}

const CodeBlock = ({ code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-gray-900 rounded-lg group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-gray-700 text-gray-300 rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        aria-label="Copy code"
      >
        <CopyIcon className="w-5 h-5" />
      </button>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="font-mono">{code}</code>
      </pre>
      {copied && (
        <div className="absolute bottom-2 right-2 text-xs bg-green-500 text-white py-0.5 px-2 rounded-md animate-fade-in-out">
          Copied!
        </div>
      )}
    </div>
  );
};

const MarkdownRenderer = ({ content }: { content: string }) => {
  // Helper to remove bold markdown symbols
  const stripBold = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '$1');

  const renderLine = (line: string, index: number) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return null;

    if (trimmedLine.startsWith('###')) {
      return <h3 key={index} className="font-semibold text-lg mt-4 mb-2 text-gray-100">{stripBold(trimmedLine.replace(/###\s*/, ''))}</h3>;
    }
    if (trimmedLine.startsWith('##')) {
      return <h2 key={index} className="font-bold text-xl mt-6 mb-3 text-white">{stripBold(trimmedLine.replace(/##\s*/, ''))}</h2>;
    }
    // List items are handled by the list processing logic
    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ') || /^\d+\.\s/.test(trimmedLine)) {
      return null;
    }
    // Render paragraph with bolding removed
    return <p key={index}>{stripBold(trimmedLine)}</p>;
  };
  
  const renderContent = () => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i]?.trim();
      
      if (line?.startsWith('* ') || line?.startsWith('- ')) {
        const listItems: React.ReactNode[] = [];
        while (i < lines.length) {
          const currentLine = lines[i]?.trim();
          if (currentLine?.startsWith('* ') || currentLine?.startsWith('- ')) {
            if (currentLine.length > 2) {
              const itemContent = stripBold(currentLine.substring(2));
              listItems.push(<li key={i} className="font-medium">{itemContent}</li>);
            }
            i++;
          } else {
            break;
          }
        }
        elements.push(<ul key={`ul-${i}`} className="list-disc pl-5 space-y-1">{listItems}</ul>);
      } else if (/^\d+\.\s/.test(line)) {
        const listItems: React.ReactNode[] = [];
        while (i < lines.length) {
          const currentLine = lines[i]?.trim();
          if (/^\d+\.\s/.test(currentLine)) {
            if (currentLine.length > 2) {
              const itemContent = stripBold(currentLine.replace(/^\d+\.\s/, ''));
              listItems.push(<li key={i} className="font-medium">{itemContent}</li>);
            }
            i++;
          } else {
            break;
          }
        }
        elements.push(<ol key={`ol-${i}`} className="list-decimal pl-5 space-y-1">{listItems}</ol>);
      } else {
        const element = renderLine(lines[i], i);
        if (element) {
          elements.push(element);
        }
        i++;
      }
    }
    return elements;
  };

  return (
    <div className="prose prose-invert prose-sm max-w-none text-gray-300 space-y-4">
      {renderContent()}
    </div>
  );
};


const ReviewOutput = ({ reviewResult }: ReviewOutputProps) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Code Review Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Code Review</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <MarkdownRenderer content={reviewResult.review} />
        </div>
      </section>

      {/* Optimized Code Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-green-400">Optimized Code</h2>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl">
           <CodeBlock code={reviewResult.optimizedCode} />
        </div>
      </section>
    </div>
  );
};

export default ReviewOutput;