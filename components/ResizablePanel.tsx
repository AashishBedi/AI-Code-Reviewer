import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ResizablePanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({ left, right }) => {
  const [leftWidth, setLeftWidth] = useState(50); // Initial width in percentage
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH_PERCENT = 20;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidthPx = e.clientX - containerRect.left;
    const newLeftWidthPercent = (newLeftWidthPx / containerRect.width) * 100;

    if (newLeftWidthPercent > MIN_WIDTH_PERCENT && newLeftWidthPercent < (100 - MIN_WIDTH_PERCENT)) {
      setLeftWidth(newLeftWidthPercent);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseleave', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex w-full h-full overflow-hidden">
      <div style={{ width: `${leftWidth}%` }} className="h-full min-w-[200px] pr-2">
        {left}
      </div>
      
      <div
        onMouseDown={handleMouseDown}
        className="w-2 h-full cursor-col-resize flex items-center justify-center group"
      >
        <div className="w-0.5 h-1/4 bg-gray-400 dark:bg-gray-600 group-hover:bg-emerald-500 transition-colors rounded-full"></div>
      </div>

      <div style={{ width: `${100 - leftWidth}%` }} className="h-full min-w-[200px] pl-2">
        {right}
      </div>
    </div>
  );
};

export default ResizablePanel;