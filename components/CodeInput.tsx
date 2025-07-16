import React from 'react';
import { PROGRAMMING_LANGUAGES } from '../constants.ts';

interface CodeInputProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

const CodeInput = ({ code, setCode, language, setLanguage, onSubmit, isLoading }: CodeInputProps) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-grow">
          <label htmlFor="language-select" className="sr-only">Select Language</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
          >
            {PROGRAMMING_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="w-full sm:w-auto px-6 py-2 font-semibold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? 'Reviewing...' : 'Review Code'}
        </button>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={`// Paste your ${language} code here...`}
        className="w-full h-80 p-4 font-mono text-sm bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-y"
        aria-label="Code Input"
      />
    </form>
  );
};

export default CodeInput;