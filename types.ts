
export interface AnalysisPhase {
  score: number;
  details: string;
  findings: string[];
}

export interface PlagiarismReport {
  overallScore: number;
  tokenAnalysis: AnalysisPhase;
  astAnalysis: AnalysisPhase;
  cfgAnalysis: AnalysisPhase;
  verdict: 'PLAGIARIZED' | 'SIMILAR' | 'ORIGINAL';
  matches: Array<{
    lineA: number;
    lineB: number;
    content: string;
    type: string;
  }>;
}

export enum ComparisonMode {
  TOKENS = 'TOKENS',
  AST = 'AST',
  CFG = 'CFG'
}
