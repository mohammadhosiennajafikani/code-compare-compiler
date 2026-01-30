import { runLocalAnalysis, tokenize } from './engine/localEngine.js';

// DOM Elements
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
          <svg class="w-full h-full transform -rotate-90 drop-shadow-lg">
            <circle cx="80" cy="80" r="${radius}" stroke="#1e293b" stroke-width="10" fill="transparent"></circle>
            <circle class="circular-progress" cx="80" cy="80" r="${radius}"
              stroke="${getVerdictStroke(report.verdict)}"
              stroke-width="10"
              fill="transparent"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${offset}"
              stroke-linecap="round">
            </circle>
          </svg>
          <div class="absolute flex flex-col items-center">
            <span class="text-4xl font-black">${report.overallScore}%</span>
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Similarity</span>
          </div>
        </div>
        <h3 class="mt-6 text-xl font-bold text-slate-100">Final Verdict</h3>
        <p class="mt-1 font-black text-sm uppercase tracking-widest ${getVerdictColor(report.verdict)}">${report.verdict}</p>
      </div>

      <!-- Breakdown -->
      <div class="bg-slate-800/40 border border-slate-700/50 p-8 rounded-3xl md:col-span-2 shadow-xl flex flex-col justify-center">
        <div class="flex items-center gap-3 mb-8">
          <div class="p-2 bg-primary/10 rounded-lg">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">
              </path>
            </svg>
          </div>
          <h3 class="text-lg font-bold">Multivariate Analysis</h3>
        </div>

        <div class="space-y-8">
          ${[
            { label: 'Lexical Tokenization', val: report.tokenAnalysis.score, color: 'bg-blue-500', desc: 'Renaming resistance' },
            { label: 'Structural Skeleton', val: report.astAnalysis.score, color: 'bg-purple-500', desc: 'Nesting & hierarchy' },
            { label: 'Logical Control Flow', val: report.cfgAnalysis.score, color: 'bg-pink-500', desc: 'Algorithmic path' }
          ]
            .map(
              (p) => `
            <div class="group">
              <div class="flex justify-between items-end mb-2">
                <div>
                  <span class="text-xs font-black text-slate-300 uppercase tracking-tighter block">${p.label}</span>
                  <span class="text-[10px] text-slate-500 font-medium">${p.desc}</span>
                </div>
                <span class="text-lg font-mono font-bold text-slate-200">${p.val}%</span>
              </div>
              <div class="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div class="h-full ${p.color} transition-all duration-1000 ease-out" style="width: ${p.val}%"></div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;
};

/* -------------------------------
   Token & Structure Trace
--------------------------------*/
const renderTrace = (tokens) => {
  tokenCount.innerText = `TOKENS: ${tokens.length}`;

  tokenTrace.innerHTML = tokens
    .map((t) => {
      let colorClass = 'bg-slate-800 border-slate-700 text-slate-400';
      if (t.type === 'KEYWORD') colorClass = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      else if (t.type === 'IDENTIFIER') colorClass = 'bg-purple-500/10 border-purple-500/30 text-purple-400';
      else if (t.type === 'OPERATOR') colorClass = 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      else if (t.type === 'LITERAL') colorClass = 'bg-green-500/10 border-green-500/30 text-green-400';

      return `<div class="text-[9px] px-2 py-1 rounded-md border font-mono ${colorClass}">${t.value}</div>`;
    })
    .join('');

  const markers = tokens.filter((t) => t.type === 'KEYWORD' || t.type === 'PUNCTUATION');
  markerCount.innerText = `MARKERS: ${markers.length}`;

  structTrace.innerHTML = markers
    .map(
      (t) => `
      <span class="${t.type === 'KEYWORD' ? 'text-primary font-black' : 'text-slate-600'}">
        ${t.value}${t.type === 'KEYWORD' ? ' ' : ''}
      </span>
    `
    )
    .join('');
};

/* -------------------------------
   Main Controller
--------------------------------*/
const handleAnalyze = () => {
  const valA = codeA.value.trim();
  const valB = codeB.value.trim();

  if (!valA || !valB) {
    errorBox.classList.remove('hidden');
    errorMsg.innerText = 'Crucial Error: Both code buffers must be non-empty.';
    return;
  }

  errorBox.classList.add('hidden');
  results.classList.add('hidden');
  loader.classList.remove('hidden');

  setTimeout(() => {
    try {
      const report = runLocalAnalysis(valA, valB);
      const tokens = tokenize(valA);

      renderDashboard(report);
      renderTrace(tokens);

      loader.classList.add('hidden');
      results.classList.remove('hidden');
      results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      loader.classList.add('hidden');
      errorBox.classList.remove('hidden');
      errorMsg.innerText = 'Engine Fault: Internal panic during analysis.';
      console.error(e);
    }
  }, 500);
};

// Event Listeners
analyzeBtn.addEventListener('click', handleAnalyze);
analyzeBtnMobile.addEventListener('click', handleAnalyze);

console.log('CodeGuard Engine v4.0.0 Initialized Successfully.');