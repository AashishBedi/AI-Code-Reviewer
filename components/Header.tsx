import React from 'react';
import SparklesIcon from './icons/SparklesIcon.tsx';

const Header = () => {
  return (
    <header className="text-center mb-8">
      <div className="flex items-center justify-center gap-3 mb-2">
        <SparklesIcon className="w-8 h-8 text-cyan-400" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          AI Code Reviewer
        </h1>
      </div>
      <p className="text-gray-400 max-w-2xl mx-auto">
        Paste your code, select the language, and let AI provide a detailed review and an optimized version.
      </p>
    </header>
  );
};

export default Header;