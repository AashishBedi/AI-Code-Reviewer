
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import { OptimizedCodeDisplay } from './components/OptimizedCodeDisplay';
import ResizablePanel from './components/ResizablePanel';
import WelcomeModal from './components/WelcomeModal';
import VisualizationModal from './components/VisualizationModal';
import { getOptimizedCodeStream, translateCode, generateVisualization, convertFlowchartDataToMermaid } from './services/geminiService';
import { ReviewResult, SupportedLanguage } from './types';

const initialCode = `from typing import List

# This is a slightly flawed implementation for the AI to fix.
# It uses a brute-force approach.
# Example Test Case: nums = [2, 7, 11, 15], target = 9 -> Expected output: [0, 1]
class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        n = len(nums)
        for i in range(n - 1):
            for j in range(i + 1, n):
                if (nums[i] + nums[j]) == target:
                    return [i, j]
        # This implementation implicitly returns None if no solution is found,
        # which doesn't match the '-> List[int]' type hint.
`;

interface VisualizationState {
  title: string;
  mermaidCode: string;
  isLoading: boolean;
}

function App() {
  const [userInputCode, setUserInputCode] = useState<string>(initialCode);
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [optimizedLanguage, setOptimizedLanguage] = useState<SupportedLanguage>('python');
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTranslatingOptimized, setIsTranslatingOptimized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState<boolean>(false);
  const [visualizationData, setVisualizationData] = useState<VisualizationState | null>(null);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedCodeReviewer');
    if (!hasVisited) {
      setShowWelcome(true);
    }
  }, []);

  const handleDismissWelcome = () => {
    localStorage.setItem('hasVisitedCodeReviewer', 'true');
    setShowWelcome(false);
  };
  
  const handleVisualize = async (code: string, lang: SupportedLanguage, title: string) => {
    if (!code.trim()) return;
    setError(null);
    setVisualizationData({ title, mermaidCode: '', isLoading: true });
    
    try {
      const flowchartData = await generateVisualization(code, lang);
      const mermaidCode = convertFlowchartDataToMermaid(flowchartData);
      setVisualizationData({ title, mermaidCode, isLoading: false });
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to generate visualization: ${err.message}`);
      } else {
        setError('An unknown error occurred during visualization generation.');
      }
      setVisualizationData(null); // Close modal on error
    }
  };
  
  const handleVisualizeUserCode = () => {
    handleVisualize(userInputCode, language, "User's Code Visualization");
  };

  const handleVisualizeOptimizedCode = () => {
    if (reviewResult?.optimizedCode) {
      handleVisualize(reviewResult.optimizedCode, optimizedLanguage, "Optimized Code Visualization");
    }
  };

  const handleLanguageChange = useCallback(async (newLanguage: SupportedLanguage) => {
    if (newLanguage === language) {
      return;
    }
    
    // If there's no code, just change the language
    if (!userInputCode.trim()) {
      setLanguage(newLanguage);
      setOptimizedLanguage(newLanguage);
      return;
    }

    setIsLoading(true);
    setError(null);
    setReviewResult(null); // Clear previous review

    try {
      const translatedCode = await translateCode(userInputCode, language, newLanguage);
      setUserInputCode(translatedCode);
      setLanguage(newLanguage); // Set new language only after successful translation
      setOptimizedLanguage(newLanguage);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to translate code: ${err.message}`);
      } else {
        setError('An unknown error occurred during code translation.');
      }
      // Note: We don't change the language on failure, so the user stays on the original language with their original code.
    } finally {
      setIsLoading(false);
    }
  }, [userInputCode, language]);

  const handleOptimizedLanguageChange = useCallback(async (newLanguage: SupportedLanguage) => {
    if (!reviewResult?.optimizedCode || newLanguage === optimizedLanguage) {
      return;
    }

    setIsTranslatingOptimized(true);
    setError(null); // Clear previous errors

    try {
      const translatedCode = await translateCode(reviewResult.optimizedCode, optimizedLanguage, newLanguage);
      setReviewResult(prev => prev ? { ...prev, optimizedCode: translatedCode } : null);
      setOptimizedLanguage(newLanguage);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to translate optimized code: ${err.message}`);
      } else {
        setError('An unknown error occurred during code translation.');
      }
    } finally {
      setIsTranslatingOptimized(false);
    }
  }, [reviewResult?.optimizedCode, optimizedLanguage]);


  const handleOptimize = useCallback(async () => {
    if (!userInputCode.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setReviewResult({ review: '', optimizedCode: '' });
    setOptimizedLanguage(language); // Reset optimized language to match the input language

    try {
      const stream = getOptimizedCodeStream(userInputCode, language);
      for await (const chunk of stream) {
        setReviewResult(prev => ({
          review: prev ? prev.review + (chunk.reviewChunk || '') : (chunk.reviewChunk || ''),
          optimizedCode: prev ? prev.optimizedCode + (chunk.optimizedCodeChunk || '') : (chunk.optimizedCodeChunk || ''),
        }));
      }
    } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred.');
        }
        setReviewResult(null); // Clear partial results on error
    } finally {
      setIsLoading(false);
    }
  }, [userInputCode, language]);

  return (
    <div className="flex flex-col h-screen">
      {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
      <VisualizationModal
        isOpen={!!visualizationData}
        onDismiss={() => setVisualizationData(null)}
        title={visualizationData?.title || ''}
        mermaidCode={visualizationData?.mermaidCode || ''}
        isLoading={visualizationData?.isLoading || false}
      />
      <Header />
      <main className="flex-grow p-4 overflow-hidden">
        <ResizablePanel
          left={
            <CodeEditor
              code={userInputCode}
              setCode={setUserInputCode}
              onOptimize={handleOptimize}
              isLoading={isLoading}
              language={language}
              setLanguage={handleLanguageChange}
              onVisualize={handleVisualizeUserCode}
            />
          }
          right={
            <OptimizedCodeDisplay
              reviewResult={reviewResult}
              isLoading={isLoading}
              error={error}
              language={optimizedLanguage}
              onLanguageChange={handleOptimizedLanguageChange}
              isTranslating={isTranslatingOptimized}
              onVisualize={handleVisualizeOptimizedCode}
            />
          }
        />
      </main>
    </div>
  );
}

export default App;