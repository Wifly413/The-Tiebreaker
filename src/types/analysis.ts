export type AnalysisType = 'pros-cons' | 'comparative' | 'swot';

export interface ProsConsResult {
  type: 'pros-cons';
  pros: string[];
  cons: string[];
  conclusion: string;
}

export interface ComparativeResult {
  type: 'comparative';
  criteria: string[];
  options: { name: string; evaluations: string[] }[];
  conclusion: string;
}

export interface SwotResult {
  type: 'swot';
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  conclusion: string;
}

export type AnalysisResult = ProsConsResult | ComparativeResult | SwotResult;

export interface HistoryItem {
  id: string;
  timestamp: number;
  decision: string;
  analysisType: AnalysisType;
  customInstructions: string;
  result: AnalysisResult;
}
