import React, { useEffect, useRef, useId } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../contexts/ThemeContext';

interface VisualizationModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  title: string;
  mermaidCode: string;
  isLoading: boolean;
}

const VisualizationModal: React.FC<VisualizationModalProps> = ({
  isOpen,
  onDismiss,
  title,
  mermaidCode,
  isLoading,
}) => {
  const { theme } = useTheme();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const mermaidId = `mermaid-graph-${useId()}`; 

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isLoading && mermaidCode && mermaidRef.current) {
        mermaid.initialize({
            startOnLoad: false,
            theme: theme === 'dark' ? 'dark' : 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
            },
            themeVariables: {
                background: theme === 'dark' ? '#1f2937' : '#f9fafb',
                primaryColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                primaryTextColor: theme === 'dark' ? '#f9fafb' : '#111827',
                lineColor: theme === 'dark' ? '#6b7280' : '#9ca3af',
                secondaryColor: theme === 'dark' ? '#16a34a' : '#10b981',
            }
        });
      
        mermaid.render(mermaidId, mermaidCode)
        .then(({ svg }) => {
            if (mermaidRef.current) {
                mermaidRef.current.innerHTML = svg;
            }
        })
        .catch(e => {
            console.error("Mermaid rendering error:", e);
            if(mermaidRef.current) {
                mermaidRef.current.innerHTML = `<p class="text-red-500">Could not render visualization. The AI may have provided invalid syntax.</p><p class="text-xs text-gray-400 mt-4 font-mono">${e.message}</p>`;
            }
        });
    }
  }, [isOpen, isLoading, mermaidCode, theme, mermaidId]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onDismiss}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col p-6 transform transition-all scale-100 opacity-100 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes fade-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
        `}</style>
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onDismiss}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-grow bg-gray-50 dark:bg-gray-900/50 rounded-lg overflow-auto p-4 flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="w-8 h-8 border-4 border-emerald-500 dark:border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-lg">AI is generating visualization...</p>
            </div>
          ) : (
            <div ref={mermaidRef} className="w-full h-full mermaid-container">
              {/* Mermaid SVG will be injected here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizationModal;