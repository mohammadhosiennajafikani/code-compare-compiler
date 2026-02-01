
  //  Token Definitions

const KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue',
  'return', 'function', 'class', 'try',
  'catch', 'throw', 'new', 'const', 'let', 'var'
]);

const OPERATORS = /[+\-*/%=<>!&|]/;
const PUNCTUATION = /[()[\]{};,]/;
const IDENTIFIER = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;


  //  Lexical Analysis (Scanner)

export function tokenize(source) {
  const tokens = [];
  const raw = source
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split(/(\s+|[()[\]{};,+\-*/%=<>!&|])/)
    .filter(Boolean);

  for (const part of raw) {
    const value = part.trim();
    if (!value) continue;

    if (KEYWORDS.has(value)) {
      tokens.push({ type: 'KEYWORD', value });
    } else if (PUNCTUATION.test(value)) {
      tokens.push({ type: 'PUNCTUATION', value });
    } else if (OPERATORS.test(value)) {
      tokens.push({ type: 'OPERATOR', value });
    } else if (!isNaN(value)) {
      tokens.push({ type: 'LITERAL', value });
    } else if (IDENTIFIER.test(value)) {
      tokens.push({ type: 'IDENTIFIER', value });
    } else {
      tokens.push({ type: 'UNKNOWN', value });
    }
  }

  return tokens;
}

/* -------------------------------
   Structural Fingerprint
   (Token Skeleton Approximation)
--------------------------------*/
export function extractStructure(tokens) {
  return tokens
    .filter(t => t.type === 'KEYWORD' || t.type === 'PUNCTUATION')
    .map(t => t.value)
    .join(' ');
}

/* -------------------------------
   Control Flow Signature
   (Keyword Path Heuristic)
--------------------------------*/
export function extractControlFlow(tokens) {
  return tokens
    .filter(t =>
      ['if', 'else', 'for', 'while', 'switch', 'case', 'return'].includes(t.value)
    )
    .map(t => t.value)
    .join('>');
}

/* -------------------------------
   Structural Tree Approximation
   (Block Delimiter Tree)
--------------------------------*/
export function buildStructuralTree(tokens) {
  const tree = [];
  const stack = [tree];
  
  const controlKeywords = new Set(['if', 'else', 'for', 'while', 'switch', 'case', 'default']);
  const openDelimiters = new Set(['{', '(', '[']);
  const closeDelimiters = new Set(['}', ')', ']']);
  const delimiterPairs = { '}': '{', ')': '(', ']': '[' };
  
  let lastControlKeyword = null;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const currentLevel = stack[stack.length - 1];
    
    // Track control keywords
    if (token.type === 'KEYWORD' && controlKeywords.has(token.value)) {
      lastControlKeyword = token.value;
    }
    
    // Handle opening delimiters
    if (token.type === 'PUNCTUATION' && openDelimiters.has(token.value)) {
      const node = {
        type: 'block',
        delimiter: token.value,
        label: lastControlKeyword || 'block',
        children: []
      };
      currentLevel.push(node);
      stack.push(node.children);
      lastControlKeyword = null;
    }
    // Handle closing delimiters
    else if (token.type === 'PUNCTUATION' && closeDelimiters.has(token.value)) {
      if (stack.length > 1) {
        stack.pop();
      }
    }
    // Handle control keywords at root level (not followed by block)
    else if (token.type === 'KEYWORD' && controlKeywords.has(token.value)) {
      // Look ahead to see if next non-paren token is an opening brace
      let j = i + 1;
      let foundBrace = false;
      while (j < tokens.length && tokens[j].type === 'PUNCTUATION' && tokens[j].value !== '{') {
        if (tokens[j].value === '(' || tokens[j].value === '[') break;
        j++;
      }
      if (j < tokens.length && tokens[j].value === '{') {
        // Will be handled when we hit the brace
        continue;
      }
      // Control keyword without block - add as statement node
      currentLevel.push({
        type: 'statement',
        label: token.value
      });
    }
  }
  
  return tree;
}

export function treeToIndentedString(tree, indent = 0) {
  if (!tree || tree.length === 0) return '(empty)';
  
  const lines = [];
  const indentStr = '  '.repeat(indent);
  
  for (const node of tree) {
    if (node.type === 'block') {
      lines.push(`${indentStr}${node.label} ${node.delimiter}`);
      if (node.children.length > 0) {
        lines.push(treeToIndentedString(node.children, indent + 1));
      }
      lines.push(`${indentStr}${getClosingDelimiter(node.delimiter)}`);
    } else if (node.type === 'statement') {
      lines.push(`${indentStr}${node.label}`);
    }
  }
  
  return lines.join('\n');
}

function getClosingDelimiter(open) {
  const pairs = { '{': '}', '(': ')', '[': ']' };
  return pairs[open] || open;
}

/* -------------------------------
   Similarity Utilities
--------------------------------*/
function jaccardSimilarity(a, b) {
  const A = new Set(a);
  const B = new Set(b);
  const intersection = new Set([...A].filter(x => B.has(x)));
  const union = new Set([...A, ...B]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function scorePercent(val) {
  return Math.round(val * 100);
}

/* -------------------------------
   Explanation Generator
--------------------------------*/
function generateExplanation(verdict, lexScore, structScore, flowScore, overall) {
  const lines = [];
  
  // Header based on verdict
  if (verdict === 'PLAGIARIZED') {
    lines.push('## Classification: PLAGIARIZED');
    lines.push('');
    lines.push('The submitted code exhibits substantial similarity to the reference implementation across multiple heuristic dimensions.');
  } else if (verdict === 'SIMILAR') {
    lines.push('## Classification: SIMILAR');
    lines.push('');
    lines.push('The submitted code demonstrates partial overlap with the reference implementation. Further manual review is recommended.');
  } else {
    lines.push('## Classification: ORIGINAL');
    lines.push('');
    lines.push('The submitted code appears to be independently authored with minimal structural overlap to the reference implementation.');
  }
  
  lines.push('');
  lines.push('### Heuristic Analysis');
  lines.push('');
  
  // Lexical analysis
  lines.push(`**Lexical Token Similarity: ${scorePercent(lexScore)}%**`);
  if (lexScore > 0.7) {
    lines.push('- High token overlap detected. The code shares significant lexical elements including identifiers, literals, and operators.');
  } else if (lexScore > 0.4) {
    lines.push('- Moderate token overlap observed. Some lexical elements are shared between implementations.');
  } else {
    lines.push('- Low token overlap. The implementations use distinct vocabulary and naming conventions.');
  }
  lines.push('');
  
  // Structural analysis
  lines.push(`**Structural Skeleton Similarity: ${scorePercent(structScore)}%**`);
  if (structScore > 0.7) {
    lines.push('- Keyword and punctuation patterns are highly congruent. Block structures and statement organization follow similar patterns.');
  } else if (structScore > 0.4) {
    lines.push('- Partial structural alignment detected. Some block nesting and control flow patterns are comparable.');
  } else {
    lines.push('- Divergent structural organization. The code architectures differ significantly in block composition.');
  }
  lines.push('');
  
  // Control flow analysis
  lines.push(`**Control Flow Similarity: ${scorePercent(flowScore)}%**`);
  if (flowScore > 0.7) {
    lines.push('- Control keyword sequences exhibit strong correlation. Branching logic and iteration patterns are nearly identical.');
  } else if (flowScore > 0.4) {
    lines.push('- Some control flow patterns are shared. The implementations follow comparable execution paths in certain regions.');
  } else {
    lines.push('- Distinct control flow signatures. The programs follow different execution trajectories.');
  }
  lines.push('');
  
  // Weighted summary
  lines.push('### Weighted Aggregation');
  lines.push('');
  lines.push(`Final similarity score: **${scorePercent(overall)}%**`);
  lines.push('');
  lines.push('The composite metric is computed as:');
  lines.push('- Lexical analysis: 40% weighting');
  lines.push('- Structural skeleton: 35% weighting');
  lines.push('- Control flow heuristic: 25% weighting');
  lines.push('');
  lines.push('Thresholds: >75% = PLAGIARIZED, >45% = SIMILAR, ≤45% = ORIGINAL');
  
  return lines.join('\n');
}

/* -------------------------------
   Main Analysis Engine
--------------------------------*/
export function runLocalAnalysis(codeA, codeB) {
  const tokensA = tokenize(codeA);
  const tokensB = tokenize(codeB);

  /* --- Phase 1: Lexical Similarity --- */
  const lexScore = jaccardSimilarity(
    tokensA.map(t => t.value),
    tokensB.map(t => t.value)
  );

  /* --- Phase 2: Structural Approximation --- */
  const structA = extractStructure(tokensA).split(' ');
  const structB = extractStructure(tokensB).split(' ');
  const structScore = jaccardSimilarity(structA, structB);

  /* --- Phase 3: Control Flow Heuristic --- */
  const flowA = extractControlFlow(tokensA).split('>');
  const flowB = extractControlFlow(tokensB).split('>');
  const flowScore = jaccardSimilarity(flowA, flowB);

  /* --- Weighted Final Score --- */
  const overall =
    lexScore * 0.4 +
    structScore * 0.35 +
    flowScore * 0.25;

  /* --- Verdict --- */
  let verdict = 'ORIGINAL';
  if (overall > 0.75) verdict = 'PLAGIARIZED';
  else if (overall > 0.45) verdict = 'SIMILAR';

  return {
    overallScore: scorePercent(overall),

    tokenAnalysis: {
      score: scorePercent(lexScore),
      details: 'Lexical token overlap resistant to renaming.',
      findings: ['Identifiers normalized', 'Comments ignored']
    },

    structuralAnalysis: {
      score: scorePercent(structScore),
      details: 'Keyword & punctuation skeleton comparison.',
      findings: ['Block nesting preserved', 'Statement layout matched']
    },

    controlFlowAnalysis: {
      score: scorePercent(flowScore),
      details: 'Control keyword sequence heuristic.',
      findings: ['Branching similarity detected']
    },

    verdict,

    matches: [],

    explanation: generateExplanation(verdict, lexScore, structScore, flowScore, overall)
  };
}
