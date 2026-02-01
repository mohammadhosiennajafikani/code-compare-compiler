import { runLocalAnalysis, tokenize, extractControlFlow, buildStructuralTree, treeToIndentedString } from './engine/localEngine.js';

/* -------------------------------
   DOM Elements
--------------------------------*/
const codeA = document.getElementById('codeA');
const codeB = document.getElementById('codeB');
const analyzeBtn = document.getElementById('analyzeBtn');
const analyzeBtnMobile = document.getElementById('analyzeBtnMobile');
const results = document.getElementById('results');
const loader = document.getElementById('loader');
const errorBox = document.getElementById('errorBox');
const errorMsg = document.getElementById('errorMsg');
const dashboardContainer = document.getElementById('dashboardContainer');
const tokenTrace = document.getElementById('tokenTrace');
const structTrace = document.getElementById('structTrace');
const tokenCount = document.getElementById('tokenCount');
const markerCount = document.getElementById('markerCount');
const tokenCountA = document.getElementById('tokenCountA');
const tokenTraceA = document.getElementById('tokenTraceA');
const markerCountA = document.getElementById('markerCountA');
const structTraceA = document.getElementById('structTraceA');
const tokenCountB = document.getElementById('tokenCountB');
const tokenTraceB = document.getElementById('tokenTraceB');
const markerCountB = document.getElementById('markerCountB');
const structTraceB = document.getElementById('structTraceB');
const controlFlowCountA = document.getElementById('controlFlowCountA');
const controlFlowA = document.getElementById('controlFlowA');
const controlFlowCountB = document.getElementById('controlFlowCountB');
const controlFlowB = document.getElementById('controlFlowB');
const treeCountA = document.getElementById('treeCountA');
const treeTraceA = document.getElementById('treeTraceA');
const treeCountB = document.getElementById('treeCountB');
const treeTraceB = document.getElementById('treeTraceB');

/* -------------------------------
   Dashboard Renderer
--------------------------------*/
const renderDashboard = (report) => {
  const getVerdictColor = (v) =>
    v === 'PLAGIARIZED'
      ? 'text-red-500'
      : v === 'SIMILAR'
      ? 'text-yellow-500'
      : 'text-green-500';

  const getVerdictStroke = (v) =>
    v === 'PLAGIARIZED'
      ? '#ef4444'
      : v === 'SIMILAR'
      ? '#eab308'
      : '#22c55e';

  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - report.overallScore / 100);

  dashboardContainer.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

      <!-- Main Score -->
      <div class="bg-slate-800/40 border border-slate-700/50 p-8 rounded-3xl flex flex-col items-center justify-center shadow-xl">
        <div class="relative w-40 h-40 flex items-center justify-center">
          <svg class="w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r="${radius}" stroke="#1e293b" stroke-width="10" fill="transparent"></circle>
            <circle
              cx="80"
              cy="80"
              r="${radius}"
              stroke="${getVerdictStroke(report.verdict)}"
              stroke-width="10"
              fill="transparent"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
              stroke-linecap="round"
              class="circular-progress">
            </circle>
          </svg>
          <div class="absolute flex flex-col items-center">
            <span class="text-4xl font-black">${report.overallScore}%</span>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Similarity</span>
          </div>
        </div>
        <h3 class="mt-6 text-xl font-bold">Final Verdict</h3>
        <p class="mt-1 font-black text-sm uppercase tracking-widest ${getVerdictColor(report.verdict)}">
          ${report.verdict}
        </p>
      </div>

      <!-- Breakdown -->
      <div class="bg-slate-800/40 border border-slate-700/50 p-8 rounded-3xl md:col-span-2 shadow-xl flex flex-col justify-center">
        <h3 class="text-lg font-bold mb-8">Multilayer Similarity Analysis</h3>

        <div class="space-y-8">
          ${[
            {
              label: 'Lexical Token Analysis',
              val: report.tokenAnalysis.score,
              color: 'bg-blue-500',
              desc: 'Scanner-level token similarity'
            },
            {
              label: 'Structural Approximation',
              val: report.structuralAnalysis.score,
              color: 'bg-purple-500',
              desc: 'Keyword & punctuation skeleton'
            },
            {
              label: 'Control Flow Heuristic',
              val: report.controlFlowAnalysis.score,
              color: 'bg-pink-500',
              desc: 'Control keyword sequence'
            }
          ]
            .map(
              (p) => `
              <div>
                <div class="flex justify-between items-end mb-2">
                  <div>
                    <span class="text-xs font-black uppercase tracking-tight text-slate-300 block">
                      ${p.label}
                    </span>
                    <span class="text-[10px] text-slate-500">${p.desc}</span>
                  </div>
                  <span class="text-lg font-mono font-bold">${p.val}%</span>
                </div>
                <div class="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div class="h-full ${p.color}" style="width:${p.val}%"></div>
                </div>
              </div>
            `
            )
            .join('')}
        </div>
      </div>
    </div>

    <!-- Explanation Section -->
    <div class="mt-6 bg-slate-800/40 border border-slate-700/50 p-8 rounded-3xl shadow-xl">
      <h3 class="text-lg font-bold mb-6 flex items-center gap-3">
        <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Analysis Report
      </h3>
      <div class="bg-slate-950 p-6 rounded-xl overflow-x-auto">
        <pre class="font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">${report.explanation}</pre>
      </div>
    </div>
  `;
};

/* -------------------------------
   Token & Structure Trace
--------------------------------*/
const renderTrace = (tokensA, tokensB) => {
  // Tokens for Source A
  tokenCountA.innerText = `TOKENS: ${tokensA.length}`;
  tokenTraceA.innerHTML = tokensA
    .map((t) => {
      let colorClass = 'bg-slate-800 border-slate-700 text-slate-400';
      if (t.type === 'KEYWORD') colorClass = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      else if (t.type === 'IDENTIFIER') colorClass = 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      else if (t.type === 'OPERATOR') colorClass = 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      else if (t.type === 'LITERAL') colorClass = 'bg-green-500/10 border-green-500/30 text-green-400';
      return `<div class="text-[9px] px-2 py-1 rounded-md border font-mono ${colorClass}">${t.value}</div>`;
    })
    .join('');

  // Tokens for Source B
  tokenCountB.innerText = `TOKENS: ${tokensB.length}`;
  tokenTraceB.innerHTML = tokensB
    .map((t) => {
      let colorClass = 'bg-slate-800 border-slate-700 text-slate-400';
      if (t.type === 'KEYWORD') colorClass = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      else if (t.type === 'IDENTIFIER') colorClass = 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      else if (t.type === 'OPERATOR') colorClass = 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      else if (t.type === 'LITERAL') colorClass = 'bg-green-500/10 border-green-500/30 text-green-400';
      return `<div class="text-[9px] px-2 py-1 rounded-md border font-mono ${colorClass}">${t.value}</div>`;
    })
    .join('');

  // Structural markers (keywords + punctuation) for Source A
  const markersA = tokensA.filter((t) => t.type === 'KEYWORD' || t.type === 'PUNCTUATION');
  markerCountA.innerText = `MARKERS: ${markersA.length}`;
  structTraceA.innerHTML = markersA
    .map((t) => `<span class="${t.type === 'KEYWORD' ? 'text-primary font-black' : 'text-slate-600'}">${t.value}</span>`)
    .join(' ');

  // Structural markers for Source B
  const markersB = tokensB.filter((t) => t.type === 'KEYWORD' || t.type === 'PUNCTUATION');
  markerCountB.innerText = `MARKERS: ${markersB.length}`;
  structTraceB.innerHTML = markersB
    .map((t) => `<span class="${t.type === 'KEYWORD' ? 'text-primary font-black' : 'text-slate-600'}">${t.value}</span>`)
    .join(' ');

  // Control Flow Signature for Source A
  const flowA = extractControlFlow(tokensA);
  controlFlowA.innerText = flowA || '(no control keywords)';
  controlFlowCountA.innerText = `FLOW NODES: ${flowA ? flowA.split('>').length : 0}`;

  // Control Flow Signature for Source B
  const flowB = extractControlFlow(tokensB);
  controlFlowB.innerText = flowB || '(no control keywords)';
  controlFlowCountB.innerText = `FLOW NODES: ${flowB ? flowB.split('>').length : 0}`;

  // Structural Tree for Source A
  const treeA = buildStructuralTree(tokensA);
  const treeStringA = treeToIndentedString(treeA);
  const nodeCountA = countTreeNodes(treeA);
  treeCountA.innerText = `NODES: ${nodeCountA}`;
  treeTraceA.innerText = treeStringA;

  // Structural Tree for Source B
  const treeB = buildStructuralTree(tokensB);
  const treeStringB = treeToIndentedString(treeB);
  const nodeCountB = countTreeNodes(treeB);
  treeCountB.innerText = `NODES: ${nodeCountB}`;
  treeTraceB.innerText = treeStringB;
};

function countTreeNodes(tree) {
  if (!tree || tree.length === 0) return 0;
  let count = 0;
  for (const node of tree) {
    count++;
    if (node.children) {
      count += countTreeNodes(node.children);
    }
  }
  return count;
}

/* -------------------------------
   Main Controller
--------------------------------*/
const handleAnalyze = () => {
  const valA = codeA.value.trim();
  const valB = codeB.value.trim();

  if (!valA || !valB) {
    errorBox.classList.remove('hidden');
    errorMsg.innerText = 'Both source code inputs must be provided.';
    return;
  }

  errorBox.classList.add('hidden');
  results.classList.add('hidden');
  loader.classList.remove('hidden');

  setTimeout(() => {
    try {
      const report = runLocalAnalysis(valA, valB);
      const tokensA = tokenize(valA);
      const tokensB = tokenize(valB);

      renderDashboard(report);
      renderTrace(tokensA, tokensB);

      loader.classList.add('hidden');
      results.classList.remove('hidden');
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      loader.classList.add('hidden');
      errorBox.classList.remove('hidden');
      errorMsg.innerText = 'Internal engine error during analysis.';
      console.error(err);
    }
  }, 400);
};

/* -------------------------------
   Event Bindings
--------------------------------*/
analyzeBtn.addEventListener('click', handleAnalyze);
analyzeBtnMobile.addEventListener('click', handleAnalyze);

console.log('CodeGuard Engine initialized (heuristic compiler-inspired mode).');
