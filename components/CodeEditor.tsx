import React, { useState, useEffect } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import { CodeEditorProps, SupportedLanguage } from '../types';
import { SparklesIcon, ChartBarSquareIcon } from './icons';
import { useTheme } from '../contexts/ThemeContext';

const languageDisplayNames: Record<SupportedLanguage, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  java: 'Java',
  cpp: 'C++',
};

const CodeEditor: React.FC<CodeEditorProps> = ({ code, setCode, onOptimize, isLoading, language, setLanguage, onVisualize }) => {
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

  const getHighlighter = (code: string) => {
    // Create a safe fallback that escapes HTML entities
    const escapeHtml = (unsafe: string) => 
      unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
        
    const grammar = Prism.languages[language];

    if (isGrammarLoaded && grammar) {
      try {
        return Prism.highlight(code, grammar, language);
      } catch (e) {
        console.error("Prism.js highlighting error in CodeEditor:", e);
        return escapeHtml(code);
      }
    }
    
    return escapeHtml(code);
  };
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex-shrink-0 flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Your Code</h2>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            disabled={isLoading}
            className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md py-1 px-2 border-transparent focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {Object.entries(languageDisplayNames).map(([lang, name]) => (
              <option key={lang} value={lang}>{name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onVisualize}
            disabled={isLoading || !code.trim()}
            className="flex items-center justify-center p-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-emerald-500"
            title="Visualize Code"
          >
            <ChartBarSquareIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onOptimize}
            disabled={isLoading || !code.trim()}
            className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-emerald-500"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <SparklesIcon className="w-4 h-4 mr-2" />
            )}
            <span>{isLoading ? 'Reviewing...' : 'Get Review'}</span>
          </button>
        </div>
      </div>
      <div className="flex-grow p-1 overflow-auto">
        <Editor
          key={theme}
          value={code}
          onValueChange={setCode}
          highlight={getHighlighter}
          padding={12}
          className="code-editor"
          textareaClassName="focus:outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default CodeEditor;