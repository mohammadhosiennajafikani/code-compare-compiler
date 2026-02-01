# CodeGuard

A compiler-inspired code similarity analysis engine for plagiarism detection. Built for academic use in Compiler Design courses.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg)](https://tailwindcss.com/)

## Overview

CodeGuard performs multilayer similarity analysis on source code pairs using compiler-inspired heuristic techniques. The engine operates entirely client-side without external dependencies or server infrastructure.

## Features

### Analysis Layers

| Layer | Technique | Weight |
|-------|-----------|--------|
| **Lexical Analysis** | Token-level Jaccard similarity | 40% |
| **Structural Analysis** | Keyword & punctuation skeleton matching | 35% |
| **Control Flow Analysis** | Control keyword sequence comparison | 25% |
| **Structural Tree** | Block delimiter tree approximation | Diagnostic |

### Key Capabilities

- **Pure Client-Side**: No server required; runs entirely in the browser
- **No External Dependencies**: Single HTML file with Tailwind CDN
- **Resistant to Renaming**: Lexical analysis normalizes identifiers
- **Comment Stripping**: Prevents trivial obfuscation via comments
- **Detailed Traces**: Side-by-side token, structural, and control-flow visualization
- **Academic Reporting**: Markdown-formatted explanation generation

## Quick Start

```bash
# Clone or download the repository
git clone https://github.com/yourusername/codeguard.git

# Navigate to project directory
cd codeguard

# Serve with any static file server
npx serve .
```

Open `http://localhost:3000` in your browser.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Code Input │  │  Code Input │  │  Run Analysis   │  │
│  │   Source A  │  │   Source B  │  │     Button      │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    engine/localEngine.js                │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐   │
│  │   tokenize   │ │extractStructure│ │extractControlFlow│ │
│  │   (Scanner)  │ │  (Skeleton)   │ │    (Path)      │   │
│  └──────────────┘ └──────────────┘ └────────────────┘   │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐   │
│  │buildStructural │ │treeToIndented │ │generateExplanation│ │
│  │    Tree       │ │    String     │ │                │   │
│  └──────────────┘ └──────────────┘ └────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      index.js                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Dashboard │  │    Traces   │  │  Explanation    │  │
│  │   (Score)   │  │  (Tokens)   │  │    (Report)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Algorithm Details

### Tokenization (Lexical Analysis)

The scanner performs the following transformations:

1. **Comment Removal**: Strips `//` and `/* */` style comments
2. **Delimiter Splitting**: Separates on whitespace and punctuation
3. **Token Classification**:
   - `KEYWORD`: Reserved words (if, for, while, etc.)
   - `IDENTIFIER`: Variable/function names
   - `OPERATOR`: Arithmetic and logical operators
   - `LITERAL`: Numeric constants
   - `PUNCTUATION`: Brackets, braces, semicolons

### Similarity Metrics

#### Jaccard Similarity

```
J(A, B) = |A ∩ B| / |A ∪ B|
```

Applied to token values, structural markers, and control flow sequences.

#### Weighted Aggregation

```
Overall = 0.4 × Lexical + 0.35 × Structural + 0.25 × ControlFlow
```

### Classification Thresholds

| Score Range | Classification |
|-------------|----------------|
| > 75% | PLAGIARIZED |
| 45% - 75% | SIMILAR |
| ≤ 45% | ORIGINAL |

## API Reference

### `tokenize(source: string): Token[]`

Converts source code into an array of classified tokens.

```typescript
interface Token {
  type: 'KEYWORD' | 'IDENTIFIER' | 'OPERATOR' | 'LITERAL' | 'PUNCTUATION' | 'UNKNOWN';
  value: string;
}
```

### `runLocalAnalysis(codeA: string, codeB: string): PlagiarismReport`

Performs complete similarity analysis and returns a comprehensive report.

```typescript
interface PlagiarismReport {
  overallScore: number;
  tokenAnalysis: AnalysisPhase;
  structuralAnalysis: AnalysisPhase;
  controlFlowAnalysis: AnalysisPhase;
  verdict: 'PLAGIARIZED' | 'SIMILAR' | 'ORIGINAL';
  matches: MatchRecord[];
  explanation: string;  // Markdown-formatted report
}
```

### `buildStructuralTree(tokens: Token[]): TreeNode[]`

Constructs a hierarchical tree from block delimiters and control keywords.

### `extractControlFlow(tokens: Token[]): string`

Extracts control keyword sequences joined by `>` delimiters.

## File Structure

```
codeguard/
├── index.html          # Main UI with Tailwind CSS
├── index.js            # Dashboard renderer and event handling
├── types.ts            # TypeScript type definitions
├── engine/
│   └── localEngine.js  # Core analysis algorithms
└── README.md           # This documentation
```

## Limitations

This is a heuristic-based tool designed for educational purposes:

- **No Full AST**: Uses token-level approximations rather than complete parsing
- **No Semantic Analysis**: Cannot detect algorithmic equivalence through different implementations
- **Single Language**: Optimized for JavaScript-like syntax
- **No Line Mapping**: Does not provide precise line-to-line correlation

For production plagiarism detection, consider combining with:
- Abstract Syntax Tree (AST) comparison
- Program dependence graphs
- Machine learning-based similarity models

## Academic Context

CodeGuard was developed as a course project for Compiler Design, demonstrating:

- Lexical analysis and tokenization
- Heuristic similarity metrics
- Control flow extraction
- Client-side architecture design

## License

comming soon

## Contributing

This project is intended as a reference implementation. Modifications should maintain:

- Pure client-side operation
- Zero external dependencies (except Tailwind CDN)
- Academic-style documentation
- Heuristic rather than exact approaches

## Acknowledgments

- Compiler Design course instructors
- Jaccard similarity metric (Paul Jaccard, 1901)
- Tailwind CSS for styling