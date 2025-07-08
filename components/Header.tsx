import React from 'react';
import { SparklesIcon, SunIcon, MoonIcon } from './icons';
import { useTheme } from '../contexts/ThemeContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700/50 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-7 w-7 text-emerald-400" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">AI Code Reviewer</h1>
          </div>
          <div className="flex items-center space-x-4">
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              aria-label="Toggle theme"
             >
                {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
             </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;