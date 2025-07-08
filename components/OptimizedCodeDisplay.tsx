import React, { useState, useMemo, useEffect } from 'react';
import Prism from 'prismjs';
import { OptimizedCodeDisplayProps, SupportedLanguage } from '../types';
import { ClipboardIcon, CheckIcon, ChartBarSquareIcon } from './icons';
import { useTheme } from '../contexts/ThemeContext';

const languageDisplayNames: Record<SupportedLanguage, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  java: 'Java',
  cpp: 'C++',
};

export const OptimizedCodeDisplay: React.FC<OptimizedCodeDisplayProps> = ({ reviewResult, isLoading, error, language, onLanguageChange, isTranslating, onVisualize }) => {
  const [reviewCopied, setReviewCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isGrammarLoaded, setIsGrammarLoaded] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    let isMounted = true;
    setIsGrammarLoaded(false);

    (async () => {
      try {
        // Handle dependencies: C++, TypeScript, etc., all need 'clike'.
        if (['javascript', 'typescript', 'java', 'cpp'].includes(language)) {
          await import('prismjs/components/prism-clike');
        }
        // C++ depends on C
        if (language === 'cpp') {
          await import('prismjs/components/prism-c');
        }
        // TypeScript depends on JavaScript
        if (language === 'typescript') {
          await import('prismjs/components/prism-javascript');
        }

        // Load the actual language grammar
        await import(`prismjs/components/prism-${language}`);
        
        if (isMounted) {
          setIsGrammarLoaded(true);
        }
      } catch (e) {
        console.error(`Failed to load grammar for ${language}`, e);
        if (isMounted) {
          setIsGrammarLoaded(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [language]);

  const handleCopyReview = () => {
    if (reviewResult?.review) {
      navigator.clipboard.writeText(reviewResult.review);
      setReviewCopied(true);
      setTimeout(() => setReviewCopied(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (reviewResult?.optimizedCode) {
      navigator.clipboard.writeText(reviewResult.optimizedCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };
  
  const highlightedCode = useMemo(() => {
    if (!reviewResult?.optimizedCode) return "";

    const grammar = Prism.languages[language];
    const codeToHighlight = reviewResult.optimizedCode;
    
    // Create a safe fallback that escapes HTML entities
    const escapeHtml = (unsafe: string) => 
      unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    if (isGrammarLoaded && grammar) {
      try {
        return Prism.highlight(codeToHighlight, grammar, language);
      } catch (e) {
        console.error("Prism.js highlighting error:", e);
        return escapeHtml(codeToHighlight);
      }
    }
    
    return escapeHtml(codeToHighlight);
  }, [reviewResult?.optimizedCode, language, isGrammarLoaded, theme]);


  const renderReview = (reviewText: string) => {
    return reviewText.split('\n').map((line, index) => {
        if (line.startsWith('### ')) {
            return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-emerald-500 dark:text-emerald-400">{line.substring(4)}</h3>;
        }
        
        const listItemMatch = line.match(/^(\s*)\* (.*)/);
        if (listItemMatch) {
          const indentSpaces = listItemMatch[1].length;
          const content = listItemMatch[2];
          const indentLevel = Math.floor(indentSpaces / 2);
          const marginLeft = 20 + (indentLevel * 24);
          
          return (
            <li key={index} style={{ marginLeft: `${marginLeft}px` }} className="list-disc text-gray-600 dark:text-gray-300">
              {content}
            </li>
          );
        }

        return <p key={index} className="text-gray-600 dark:text-gray-300 mb-2">{line}</p>;
    });
  };

  const renderContent = () => {
    if (isLoading && !reviewResult) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="w-8 h-8 border-4 border-emerald-500 dark:border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg">AI is thinking...</p>
          <p className="text-sm">Analyzing and reviewing your code.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
          <h3 className="font-bold mb-2">An Error Occurred</h3>
          <p className="font-mono text-sm whitespace-pre-wrap">{error}</p>
        </div>
      );
    }

    if (!reviewResult) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
          <p>Your code review and optimized code will appear here.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {reviewResult.review && (
          <div>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-emerald-500 dark:text-emerald-400">AI Review</h3>
                 <button
                    onClick={handleCopyReview}
                    disabled={reviewCopied || !reviewResult.review}
                    className="flex items-center space-x-2 text-sm px-3 py-1 rounded-md transition-colors bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                    {reviewCopied ? ( <> <CheckIcon className="w-4 h-4 text-emerald-500" /> <span>Copied!</span> </> ) 
                    : ( <> <ClipboardIcon className="w-4 h-4" /> <span>Copy</span> </>)}
                </button>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md text-gray-600 dark:text-gray-300 font-sans text-sm leading-relaxed">
              {renderReview(reviewResult.review)}
            </div>
          </div>
        )}
        {reviewResult.optimizedCode && (
          <div>
              <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-emerald-500 dark:text-emerald-400">Optimized Code</h3>
                  <button
                      onClick={handleCopyCode}
                      disabled={codeCopied || !reviewResult.optimizedCode}
                      className="flex items-center space-x-2 text-sm px-3 py-1 rounded-md transition-colors bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 disabled:opacity-50"
                  >
                      {codeCopied ? ( <> <CheckIcon className="w-4 h-4 text-emerald-500" /> <span>Copied!</span> </> ) 
                      : ( <> <ClipboardIcon className="w-4 h-4" /> <span>Copy</span> </>)}
                  </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden relative">
                  {isTranslating && (
                      <div className="absolute inset-0 bg-gray-900/70 flex items-center justify-center z-10">
                          <div className="w-6 h-6 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                  )}
                  <pre className={`language-${language} p-4 overflow-x-auto`}>
                      <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                  </pre>
              </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex-shrink-0 flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-white">AI Review & Optimized Code</h2>
        {reviewResult?.optimizedCode && (
           <div className="flex items-center space-x-2">
             <button
                onClick={onVisualize}
                disabled={isLoading || isTranslating}
                className="flex items-center justify-center p-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-emerald-500"
                title="Visualize Optimized Code"
              >
                <ChartBarSquareIcon className="w-5 h-5" />
             </button>
             <select
                 value={language}
                 onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                 disabled={isLoading || isTranslating}
                 className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md py-1 px-2 border-transparent focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                 aria-label="Optimized code language"
             >
                 {Object.entries(languageDisplayNames).map(([lang, name]) => (
                     <option key={lang} value={lang}>{name}</option>
                 ))}
             </select>
           </div>
        )}
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};