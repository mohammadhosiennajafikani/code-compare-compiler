// ---------------------------------------------
// Token Types
// ---------------------------------------------
const TokenType = {
  KEYWORD: 'KEYWORD',
  IDENTIFIER: 'IDENTIFIER',
  OPERATOR: 'OPERATOR',
  LITERAL: 'LITERAL',
  PUNCTUATION: 'PUNCTUATION'
};

const KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'do', 'return', 'break', 'continue', 'int', 'float', 'char', 'void',
  'public', 'private', 'class', 'function', 'def', 'var', 'let', 'const', 'switch', 'case', 'import',
  'include', 'using', 'namespace', 'print', 'console', 'log', 'async', 'await', 'try', 'catch', 'finally',
  'typeof', 'instanceof'
]);

// ---------------------------------------------
// Improved Tokenizer
// ---------------------------------------------
function tokenize(code) {
  const tokens = [];

  // Improved regex: supports template literals, unicode identifiers, multi-char ops
  const regex = /(\/\/.*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^\\`])*`|"(?:\\.|[^\\"])*"|'(?:\\.|[^\\'])*')|([a-zA-Z_$][\w$]*)|(\d+(?:\.\d+)?)|(===|!==|>>>=|>>>|>>|<<|<=|>=|\+\+|--|&&|\|\||=>|[+\-*/=%&|^!<>?:])|([{}()\[\],.;])/g;
  
  let match;
  while ((match = regex.exec(code)) !== null) {
    const [, comment, str, word, num, op, punct] = match;

    if (comment) continue;

    if (word) {
      tokens.push({
        type: KEYWORDS.has(word) ? TokenType.KEYWORD : TokenType.IDENTIFIER,
        value: word
      });
    } else if (num || str) {
      tokens.push({ type: TokenType.LITERAL, value: num || str });
    } else if (op) {
      tokens.push({ type: TokenType.OPERATOR, value: op });
    } else if (punct) {
      tokens.push({ type: TokenType.PUNCTUATION, value: punct });
    }
  }

  return tokens;
}

// ---------------------------------------------
// Jaccard Similarity
// ---------------------------------------------
function calculateJaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return (intersection.size / union.size) * 100;
}

// ---------------------------------------------
// Levenshtein Distance (for structural score)
// ---------------------------------------------
function levenshtein(a, b) {
  const dp = Array(a.length + 1).fill(null).map(() =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

// ---------------------------------------------
// Main Algorithm
// ---------------------------------------------
function runLocalAnalysis(codeA, codeB) {
  const normA = codeA.trim().replace(/\s+/g, ' ');
  const normB = codeB.trim().replace(/\s+/g, ' ');

  // Exact match shortcut
  if (normA === normB && normA !== '') {
    const p = { score: 100, details: "100% Identity Match.", findings: ["Source texts are identical strings."] };
    return {
      overallScore: 100,
      verdict: 'PLAGIARIZED',
      tokenAnalysis: p,
      astAnalysis: p,
      cfgAnalysis: p,
      matches: []
    };
  }

  const tA = tokenize(codeA);
  const tB = tokenize(codeB);

  if (tA.length === 0 || tB.length === 0) {
    const z = { score: 0, details: "Null Data.", findings: ["Analysis impossible on empty inputs."] };
    return {
      overallScore: 0,
      verdict: 'ORIGINAL',
      tokenAnalysis: z,
      astAnalysis: z,
      cfgAnalysis: z,
      matches: []
    };
  }

  // ---------------------------------------------
  // Phase 1: Lexical (Improved n-gram)
  // ---------------------------------------------
  const n = Math.max(1, Math.min(3, Math.floor(Math.min(tA.length, tB.length) / 5) || 1));

  const getGrams = (tks) => {
    const sig = tks.map(t => t.type === TokenType.KEYWORD ? t.value : t.type[0]);
    const res = new Set();
    for (let i = 0; i <= sig.length - n; i++) {
      res.add(sig.slice(i, i + n).join('|'));
    }
    return res;
  };

  const gramsA = getGrams(tA);
  const gramsB = getGrams(tB);
  const tokenScore = calculateJaccard(gramsA, gramsB);

  // ---------------------------------------------
  // Phase 2: Structural (Improved using Levenshtein)
  // ---------------------------------------------
  const sA = tA.filter(t => t.type === TokenType.KEYWORD || t.type === TokenType.PUNCTUATION).map(t => t.value).join('');
  const sB = tB.filter(t => t.type === TokenType.KEYWORD || t.type === TokenType.PUNCTUATION).map(t => t.value).join('');

  let structScore = 0;
  if (sA && sB) {
    const dist = levenshtein(sA, sB);
    const maxLen = Math.max(sA.length, sB.length);
    structScore = ((maxLen - dist) / maxLen) * 100;
  }

  // ---------------------------------------------
  // Phase 3: Logical Flow (Improved LCS)
  // ---------------------------------------------
  const flowKeys = ['if', 'else', 'for', 'while', 'return', 'switch', 'case', 'function', 'try', 'catch'];

  const lA = tA.filter(t => flowKeys.includes(t.value)).map(t => t.value);
  const lB = tB.filter(t => flowKeys.includes(t.value)).map(t => t.value);

  function LCS(a, b) {
    const dp = Array(a.length + 1).fill(null).map(() =>
      Array(b.length + 1).fill(0)
    );

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    return dp[a.length][b.length];
  }

  let cfgScore = 0;
  if (lA.length && lB.length) {
    const lcs = LCS(lA, lB);
    const maxLen = Math.max(lA.length, lB.length);
    cfgScore = (lcs / maxLen) * 100;
  }

  // ---------------------------------------------
  // Dynamic Weighting
  // ---------------------------------------------
  let wT = 0.5, wS = 0.25, wL = 0.25;

  if (!sA && !lA.length) { wT = 1; wS = 0; wL = 0; }
  else if (!sA) { wT = 0.6; wS = 0; wL = 0.4; }
  else if (!lA.length) { wT = 0.6; wS = 0.4; wL = 0; }

  const overall = (tokenScore * wT) + (structScore * wS) + (cfgScore * wL);

  return {
    overallScore: Math.round(overall),
    verdict: overall > 80 ? 'PLAGIARIZED' : overall > 40 ? 'SIMILAR' : 'ORIGINAL',
    tokenAnalysis: {
      score: Math.round(tokenScore),
      details: "Jaccard similarity on adaptive n-grams.",
      findings: [`Pattern overlap: ${Math.round(tokenScore)}%`, `Unique sequences: ${gramsA.size}`]
    },
    astAnalysis: {
      score: Math.round(structScore),
      details: "Structural similarity using Levenshtein distance.",
      findings: [`Hierarchy match: ${Math.round(structScore)}%`, `Structural markers: ${sA.length}`]
    },
    cfgAnalysis: {
      score: Math.round(cfgScore),
      details: "Control-flow similarity using LCS.",
      findings: [`Logic flow overlap: ${Math.round(cfgScore)}%`, `Decision nodes: ${lA.length}`]
    },
    matches: []
  };
}

// Export if needed
export { tokenize, runLocalAnalysis };