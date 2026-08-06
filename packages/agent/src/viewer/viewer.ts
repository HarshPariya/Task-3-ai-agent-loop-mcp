import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { workspaceRoot } from "../paths.js";

export function generateTraceViewer() {
  const traceFile = join(
    workspaceRoot,
    "generated",
    "traces",
    "trace.json"
  );

  let trace: any[];
  try {
    trace = JSON.parse(
      readFileSync(traceFile, "utf8")
    );
  } catch (e) {
    console.error("Failed to read trace file:", e);
    trace = [];
  }

  // Read golden traces if they exist
  const goldenTraceDir = join(workspaceRoot, "generated", "golden", "traces");
  let goldenTraces: { name: string; data: any }[] = [];
  if (existsSync(goldenTraceDir)) {
    try {
      const files = readdirSync(goldenTraceDir).filter(f => f.endsWith(".json"));
      for (const file of files) {
        const content = JSON.parse(readFileSync(join(goldenTraceDir, file), "utf8"));
        goldenTraces.push({
          name: file,
          data: content
        });
      }
    } catch (e) {
      console.error("Failed to read golden traces:", e);
    }
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agent Trace Viewer Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root {
    --bg-main: #0B0F19;
    --card-bg: rgba(22, 28, 45, 0.6);
    --border-color: rgba(255, 255, 255, 0.08);
    --text-primary: #F3F4F6;
    --text-secondary: #9CA3AF;
    --primary: #38BDF8;
    --color-agent: #10B981;
    --color-llm: #F59E0B;
    --color-tool: #3B82F6;
    --color-system: #EF4444;
  }
  
  body {
    font-family: 'Inter', sans-serif;
    background: radial-gradient(circle at top left, #1E1B4B 0%, var(--bg-main) 60%);
    color: var(--text-primary);
    margin: 0;
    padding: 30px;
    min-height: 100vh;
    box-sizing: border-box;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--border-color);
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
  }

  .header-left h1 {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    background: linear-gradient(to right, #38BDF8, #818CF8);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    font-family: 'Inter', sans-serif;
  }

  .btn-upload {
    background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
    color: #0B0F19;
  }

  .btn-upload:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
  }

  .btn-clear {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
  }

  .btn-clear:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 30px;
    max-width: 1400px;
    margin: 0 auto;
    height: calc(100vh - 120px);
  }

  @media (max-width: 900px) {
    .layout {
      grid-template-columns: 1fr;
      height: auto;
    }
  }

  .sidebar {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    overflow: hidden;
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 12px;
  }

  .sidebar-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }

  .count-badge {
    background: rgba(56, 189, 248, 0.15);
    color: var(--primary);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .run-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    flex: 1;
    padding-right: 4px;
  }

  .run-item {
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.03);
    cursor: pointer;
    transition: all 0.2s ease;
    background: rgba(255, 255, 255, 0.01);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .run-item:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
  }

  .run-item.active {
    background: rgba(56, 189, 248, 0.08);
    border-color: rgba(56, 189, 248, 0.3);
  }

  .run-item-name {
    font-size: 0.85rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .run-item-meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    padding-right: 8px;
  }

  .run-summary-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .summary-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 10px;
  }

  .summary-card-header h2 {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: #F3F4F6;
  }

  .status-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-success {
    background: rgba(16, 185, 129, 0.15);
    color: var(--color-agent);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .status-failure {
    background: rgba(239, 68, 68, 0.15);
    color: var(--color-system);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
  }

  @media (max-width: 600px) {
    .summary-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .summary-stat {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-label {
    font-size: 0.7rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 1.1rem;
    font-weight: 600;
  }

  details.span-details {
    background: var(--card-bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    margin-bottom: 16px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  details.span-details[open] {
    border-color: rgba(56, 189, 248, 0.3);
  }

  summary {
    padding: 16px 20px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    font-weight: 600;
    outline: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.2s;
  }

  summary:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .summary-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .summary-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .chevron {
    width: 20px;
    height: 20px;
    transition: transform 0.2s;
    color: var(--text-secondary);
  }

  details[open] > summary .chevron {
    transform: rotate(90deg);
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 4px 8px;
    border-radius: 6px;
    letter-spacing: 0.05em;
  }

  .badge-agent { background: rgba(16, 185, 129, 0.15); color: var(--color-agent); border: 1px solid rgba(16, 185, 129, 0.2); }
  .badge-llm { background: rgba(245, 158, 11, 0.15); color: var(--color-llm); border: 1px solid rgba(245, 158, 11, 0.2); }
  .badge-tool { background: rgba(59, 130, 246, 0.15); color: var(--color-tool); border: 1px solid rgba(59, 130, 246, 0.2); }
  .badge-system { background: rgba(239, 68, 68, 0.15); color: var(--color-system); border: 1px solid rgba(239, 68, 68, 0.2); }
  .badge-planner { background: rgba(129, 140, 248, 0.15); color: #818CF8; border: 1px solid rgba(129, 140, 248, 0.2); }

  .span-name {
    font-size: 0.95rem;
  }

  .metric-pill {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.8rem;
    padding: 4px 10px;
    border-radius: 20px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .metric-pill strong {
    color: var(--text-primary);
  }

  .sub-metric {
    font-size: 0.75rem;
    color: var(--text-secondary);
    opacity: 0.8;
  }

  .content {
    padding: 20px;
    border-top: 1px solid var(--border-color);
    background: rgba(0, 0, 0, 0.2);
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 768px) {
    .grid { grid-template-columns: 1fr; }
  }

  .section-title {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: 0.05em;
  }

  pre {
    font-family: 'Fira Code', monospace;
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 14px;
    margin: 0;
    overflow-x: auto;
    font-size: 0.8rem;
    max-height: 250px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .prompt-box {
    background: rgba(17, 24, 39, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .prompt-text {
    font-family: 'Fira Code', monospace;
    font-size: 0.82rem;
    white-space: pre-wrap;
    color: #38BDF8;
    line-height: 1.5;
  }

  .children-container {
    margin-top: 15px;
    padding-left: 20px;
    border-left: 2px dashed rgba(255, 255, 255, 0.1);
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-secondary);
    border: 2px dashed rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.01);
    font-size: 0.95rem;
    margin-top: 20px;
  }
</style>
</head>
<body>
<div class="container-fluid">
  <div class="header">
    <div class="header-left">
      <h1>Agent Trace Viewer Dashboard</h1>
    </div>
    <div class="header-right">
      <button class="btn btn-clear" id="clear-trace">↺ Reset View</button>
    </div>
  </div>

  <div class="layout">
    <!-- Sidebar for loaded trace listing -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h3>Loaded Runs</h3>
        <span class="count-badge" id="run-count">0</span>
      </div>
      <div class="run-list" id="sidebar-run-list"></div>
    </div>

    <!-- Main span details view -->
    <div class="main-content">
      <div class="run-summary-card" id="run-summary" style="display: none;">
        <div class="summary-card-header">
          <h2 id="summary-title">Run Details</h2>
          <span class="status-badge" id="summary-status">Success</span>
        </div>
        <div class="summary-grid">
          <div class="summary-stat">
            <div class="stat-label">Steps Used</div>
            <div class="stat-value" id="stat-steps">0</div>
          </div>
          <div class="summary-stat">
            <div class="stat-label">Duration</div>
            <div class="stat-value" id="stat-duration">0 ms</div>
          </div>
          <div class="summary-stat">
            <div class="stat-label">Tokens</div>
            <div class="stat-value" id="stat-tokens">0</div>
          </div>
          <div class="summary-stat">
            <div class="stat-label">Estimated Cost</div>
            <div class="stat-value" id="stat-cost">$0.00</div>
          </div>
        </div>
      </div>

      <div id="root"></div>
    </div>
  </div>
</div>

<script>
  const goldenTraces = ${JSON.stringify(goldenTraces)};
  const defaultTrace = ${JSON.stringify(trace)};

  let loadedTraces = [];
  if (goldenTraces && goldenTraces.length > 0) {
    loadedTraces = goldenTraces;
  } else {
    loadedTraces = [
      { name: "Default Run", data: defaultTrace }
    ];
  }
  let activeIndex = 0;

  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderSpan(span) {
    const hasDetails = span.input !== undefined || span.output !== undefined;
    let detailsHtml = '';
    
    if (hasDetails) {
      let inputHtml = '';
      let outputHtml = '';
      
      if (span.input !== undefined) {
        let formattedInput = '';
        if (span.input && typeof span.input === 'object') {
          if (span.input.prompt && typeof span.input.prompt === 'string') {
            const promptEscaped = escapeHtml(span.input.prompt);
            const otherParams = { ...span.input };
            delete otherParams.prompt;
            const otherParamsJson = Object.keys(otherParams).length > 0 ? JSON.stringify(otherParams, null, 2) : '';
            
            formattedInput = \`
              <div class="prompt-box">
                <div class="section-title">System/User Prompt</div>
                <div class="prompt-text">\${promptEscaped}</div>
              </div>
              \${otherParamsJson ? \`
                <div class="section-title" style="margin-top:10px;">Parameters</div>
                <pre><code>\${escapeHtml(otherParamsJson)}</code></pre>
              \` : ''}
            \`;
          } else {
            formattedInput = \`<pre><code>\${escapeHtml(JSON.stringify(span.input, null, 2))}</code></pre>\`;
          }
        } else {
          formattedInput = \`<pre><code>\${escapeHtml(String(span.input))}</code></pre>\`;
        }
        
        inputHtml = \`
          <div>
            <div class="section-title">Input</div>
            \${formattedInput}
          </div>
        \`;
      }
      
      if (span.output !== undefined) {
        let formattedOutput = '';
        if (span.output && typeof span.output === 'object') {
          formattedOutput = \`<pre><code>\${escapeHtml(JSON.stringify(span.output, null, 2))}</code></pre>\`;
        } else {
          formattedOutput = \`<pre><code>\${escapeHtml(String(span.output))}</code></pre>\`;
        }
        
        outputHtml = \`
          <div>
            <div class="section-title">Output</div>
            \${formattedOutput}
          </div>
        \`;
      }
      
      detailsHtml = \`
        <div class="content">
          <div class="grid">
            \${inputHtml}
            \${outputHtml}
          </div>
      \`;
    } else {
      detailsHtml = \`<div class="content">\`;
    }
    
    if (span.children && span.children.length > 0) {
      detailsHtml += \`
        <div class="section-title" style="margin-top: 15px;">Child Spans</div>
        <div class="children-container">
          \${span.children.map(renderSpan).join('')}
        </div>
      \`;
    }
    
    detailsHtml += \`</div>\`;
    
    const tokenPill = span.tokens?.total ? \`
      <div class="metric-pill">🎫 Tokens: <strong>\${span.tokens.total}</strong> <span class="sub-metric">(P: \${span.tokens.prompt} / C: \${span.tokens.completion})</span></div>
    \` : '';
    
    const costPill = span.estimatedCostUSD ? \`
      <div class="metric-pill">💵 Cost: <strong>$\${span.estimatedCostUSD.toFixed(6)}</strong></div>
    \` : '';
    
    return \`
      <details open class="span-details">
        <summary>
          <div class="summary-left">
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span class="badge badge-\${span.type}">\${span.type}</span>
            <span class="span-name">\${escapeHtml(span.name)}</span>
          </div>
          <div class="summary-right">
            <div class="metric-pill">🕒 <strong>\${span.durationMs ?? 0} ms</strong></div>
            \${tokenPill}
            \${costPill}
          </div>
        </summary>
        \${detailsHtml}
      </details>
    \`;
  }

  function renderSidebar() {
    const listEl = document.getElementById('sidebar-run-list');
    document.getElementById('run-count').textContent = loadedTraces.length;
    
    listEl.innerHTML = loadedTraces.map((trace, index) => {
      const rootSpan = trace.data[0] || {};
      const duration = rootSpan.durationMs ?? 0;
      const steps = rootSpan.output?.steps ?? 0;
      const completed = rootSpan.output?.completed ?? false;
      
      return \`
        <div class="run-item \${index === activeIndex ? 'active' : ''}" onclick="selectTrace(\${index})">
          <div class="run-item-name" title="\${escapeHtml(trace.name)}">\${escapeHtml(trace.name)}</div>
          <div class="run-item-meta">
            <span>🕒 \${duration} ms</span>
            <span style="color: \${completed ? 'var(--color-agent)' : 'var(--color-system)'}">
              \${completed ? '✓ Success' : '✗ Failed'} (\${steps} steps)
            </span>
          </div>
        </div>
      \`;
    }).join('');
  }

  function selectTrace(index) {
    activeIndex = index;
    renderSidebar();
    
    const trace = loadedTraces[index];
    const rootSpan = (trace && trace.data && trace.data[0]) || null;
    
    if (!rootSpan) {
      document.getElementById('run-summary').style.display = 'none';
      document.getElementById('root').innerHTML = '<div class="empty-state">No span data available.</div>';
      return;
    }
    
    document.getElementById('run-summary').style.display = 'block';
    document.getElementById('summary-title').textContent = trace.name;
    
    // Set status badge
    const completed = rootSpan.output?.completed ?? false;
    const statusBadge = document.getElementById('summary-status');
    if (completed) {
      statusBadge.textContent = "Success";
      statusBadge.className = "status-badge status-success";
    } else {
      statusBadge.textContent = "Failed / Aborted";
      statusBadge.className = "status-badge status-failure";
    }
    
    // Set stats
    document.getElementById('stat-steps').textContent = rootSpan.output?.steps ?? 0;
    document.getElementById('stat-duration').textContent = (rootSpan.durationMs ?? 0) + ' ms';
    
    // Aggregate values
    let totalTokens = 0;
    let totalCost = 0;
    
    function traverse(span) {
      if (span.tokens?.total) totalTokens += span.tokens.total;
      if (span.estimatedCostUSD) totalCost += span.estimatedCostUSD;
      if (span.children) span.children.forEach(traverse);
    }
    traverse(rootSpan);
    
    document.getElementById('stat-tokens').textContent = totalTokens;
    document.getElementById('stat-cost').textContent = '$' + totalCost.toFixed(6);
    
    // Render tree
    document.getElementById('root').innerHTML = [rootSpan].map(renderSpan).join('');
  }

  function handleFiles(files) {
    let processed = 0;
    const newTraces = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          let traceData = JSON.parse(e.target.result);
          if (traceData && !Array.isArray(traceData) && traceData.trace) {
            traceData = traceData.trace;
          }
          newTraces.push({
            name: file.name,
            data: Array.isArray(traceData) ? traceData : [traceData]
          });
        } catch (err) {
          console.error("Failed to parse", file.name);
        }
        
        processed++;
        if (processed === files.length) {
          newTraces.sort((a, b) => a.name.localeCompare(b.name));
          loadedTraces = [...loadedTraces, ...newTraces];
          renderSidebar();
          selectTrace(loadedTraces.length - newTraces.length);
        }
      };
      reader.readAsText(file);
    }
  }

  document.getElementById('clear-trace').addEventListener('click', () => {
    loadedTraces = goldenTraces.length > 0
      ? JSON.parse(JSON.stringify(goldenTraces))
      : [{ name: "Default Run", data: defaultTrace }];
    activeIndex = 0;
    renderSidebar();
    selectTrace(0);
    // Scroll main content back to top
    const main = document.querySelector('.main-content');
    if (main) main.scrollTop = 0;
    // Visual feedback flash
    const btn = document.getElementById('clear-trace');
    btn.style.background = 'rgba(16,185,129,0.3)';
    setTimeout(() => { btn.style.background = ''; }, 600);
  });

  // Initial render
  selectTrace(0);
</script>
</body>
</html>
`;

  mkdirSync(
    join(workspaceRoot, "generated", "viewer"),
    {
      recursive: true,
    }
  );

  writeFileSync(
    join(
      workspaceRoot,
      "generated",
      "viewer",
      "trace-viewer.html"
    ),
    html,
    "utf8"
  );

  console.log(
    "Trace Viewer Generated Successfully!"
  );
}