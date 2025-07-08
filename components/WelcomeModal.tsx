import React from 'react';
import { SparklesIcon } from './icons';

interface WelcomeModalProps {
  onDismiss: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onDismiss }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform transition-all scale-100 opacity-100 animate-fade-in">
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
        `}</style>
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
            <SparklesIcon className="w-8 h-8 text-emerald-500 dark:text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to AI Code Reviewer!</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Get expert-level feedback on your code. Just paste your code, click "Get Review," and let our AI provide a detailed analysis and an optimized version.
        </p>
        <button
          onClick={onDismiss}
          className="w-full px-4 py-3 text-base font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 focus:ring-emerald-500"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
