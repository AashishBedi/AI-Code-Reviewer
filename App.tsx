import React, { useState, useCallback } from 'react';
import { getCodeReview } from './services/geminiService.ts';
import { PROGRAMMING_LANGUAGES } from './constants.ts';
import type { ReviewResult } from './types.ts';
import Header from './components/Header.tsx';
import CodeInput from './components/CodeInput.tsx';
import ReviewOutput from './components/ReviewOutput.tsx';
import Loader from './components/Loader.tsx';

const App = () => {
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>(PROGRAMMING_LANGUAGES[0]);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      setError('Please enter some code to review.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReviewResult(null);

    try {
      const result = await getCodeReview(code, language);
      setReviewResult(result);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  }, [code, language]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <Header />
        <main>
          <div className="bg-gray-800/50 rounded-xl shadow-2xl p-6 border border-gray-700 backdrop-blur-sm">
            <CodeInput
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>

          <div className="mt-8">
            {isLoading && <Loader />}
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            )}
            {reviewResult && !isLoading && (
              <ReviewOutput reviewResult={reviewResult} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;