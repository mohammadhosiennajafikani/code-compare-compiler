/* --------------------------------------------------
   CodeGuard – Analysis Type Definitions
   Compiler Design Inspired (Heuristic-Based)
---------------------------------------------------*/

export interface AnalysisPhase {
  /** Similarity score (0–100) */
  score: number;

  /** Short explanation of the analysis method */
  details: string;

  /** Key observations extracted during analysis */
  findings: string[];
}

/* -----------------------------------------------
   Main Report Structure
------------------------------------------------*/
export interface PlagiarismReport {
  /** Final weighted similarity score */
  overallScore: number;

  /** Lexical scanner/token comparison */
  tokenAnalysis: AnalysisPhase;

  /** Structural approximation (keyword & punctuation skeleton) */
  structuralAnalysis: AnalysisPhase;

  /** Control-flow heuristic (keyword path similarity) */
  controlFlowAnalysis: AnalysisPhase;

  /** Engine verdict */
  verdict: 'PLAGIARIZED' | 'SIMILAR' | 'ORIGINAL';

  /** Optional approximate match records */
  matches: Array<{
    lineA: number;
    lineB: number;
    content: string;
    type: 'LEXICAL' | 'STRUCTURAL' | 'CONTROL_FLOW';
  }>;

  /** Markdown-formatted explanation of the classification */
  explanation: string;
}

/* -----------------------------------------------
   Supported Comparison Layers
------------------------------------------------*/
export enum ComparisonLayer {
  LEXICAL = 'LEXICAL',
  STRUCTURAL = 'STRUCTURAL',
  CONTROL_FLOW = 'CONTROL_FLOW'
}
