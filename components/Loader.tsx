import React from 'react';

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-400">Analyzing your code...</p>
    </div>
  );
};

export default Loader;