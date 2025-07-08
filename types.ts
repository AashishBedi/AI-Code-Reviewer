
export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'java' | 'cpp';

export interface ReviewResult {
  review: string;
  optimizedCode: string;
}

export interface PartialReviewResult {
  reviewChunk?: string;
  optimizedCodeChunk?: string;
}

export interface FlowchartNode {
  id: string;
  label: string;
  shape: 'rect' | 'diamond' | 'round-rect' | 'stadium';
}

export interface FlowchartEdge {
  from: string;
  to: string;
  label?: string;
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  onOptimize: () => void;
  isLoading: boolean;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  onVisualize: () => void;
}

export interface OptimizedCodeDisplayProps {
  reviewResult: ReviewResult | null;
  isLoading: boolean; // For the main "Get Review" process
  error: string | null;
  language: SupportedLanguage; // Language of the optimized code
  onLanguageChange: (language: SupportedLanguage) => void;
  isTranslating: boolean; // For translation of the optimized code block only
  onVisualize: () => void;
}
