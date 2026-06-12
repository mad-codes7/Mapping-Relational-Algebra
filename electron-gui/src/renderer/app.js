const raInput    = document.getElementById('raInput');
const sqlOut     = document.getElementById('sqlOutput');
const resWrap    = document.getElementById('resultsWrap');
const rowCount   = document.getElementById('rowCount');
const spinner    = document.getElementById('spinner');
const runBtn     = document.getElementById('translateBtn');
const histList   = document.getElementById('historyList');
const schemaTree = document.getElementById('schemaTree');
let queryHistory = [];

// Icon name → message type mapping
const TYPE_ICON = {
  error:   'x-circle',
  warning: 'alert-triangle',
  success: 'check-circle',
};
const TYPE_CLS  = { error: 'err', warning: 'warn', success: 'ok' };

(async () => {
  const schema = await window.api.getSchema();
  document.getElementById('dbName').textContent = schema.dbName;

  if (schema.error || schema.tables.length === 0) {
    schemaTree.innerHTML = `<div class="schema-msg">${schema.error ? esc(schema.error) : 'No tables found.'}</div>`;
    lucide.createIcons();
    return;
  }

  schemaTree.innerHTML = schema.tables.map(t => `
    <div class="schema-table-item">
      <div class="schema-table-header" onclick="toggleTable(this)">
        <i data-lucide="chevron-right" class="icon-xs schema-toggle"></i>
        <span class="schema-table-name" onclick="insertTable(event,'${esc(t.name)}')" title="Click to insert">
          <i data-lucide="table-2" class="icon-xs"></i> ${esc(t.name)}
        </span>
        <span class="schema-table-count">${t.columns.length} cols</span>
      </div>
      <div class="schema-cols">
        ${t.columns.map(c => `
          <div class="schema-col-row">
            ${c.key==='PRI' ? '<span class="badge-pk">PK</span>' : c.key==='MUL' ? '<span class="badge-fk">FK</span>' : '<span style="width:18px"></span>'}
            <i data-lucide="columns-2" class="icon-xs" style="color:var(--text2)"></i>
            <span class="schema-col-name">${esc(c.name)}</span>
            <span class="schema-col-type">${esc(c.type)}</span>
          </div>`).join('')}
      </div>
    </div>`).join('');

  lucide.createIcons();
})();

document.getElementById('symbols').addEventListener('click', e => {
  const btn = e.target.closest('.sym-btn');
  if (!btn) return;
  const sym = btn.dataset.sym;
  const s   = raInput.selectionStart;
  raInput.value = raInput.value.slice(0, s) + sym + raInput.value.slice(raInput.selectionEnd);
  raInput.setSelectionRange(s + sym.length, s + sym.length);
  raInput.focus();
});

raInput.addEventListener('keydown', e => { if (e.key === 'Enter') runBtn.click(); });

document.getElementById('clearBtn').addEventListener('click', () => {
  raInput.value = '';
  sqlOut.textContent = '— SQL will appear here —';
  resWrap.innerHTML  = '<div class="result-msg">— Run a query to see results —</div>';
  rowCount.style.display = 'none';
  document.getElementById('clearResultsBtn').style.display = 'none';
  raInput.focus();
});

runBtn.addEventListener('click', async () => {
  const expr = raInput.value.trim();
  if (!expr) { raInput.focus(); return; }

  runBtn.disabled = true;
  spinner.style.display = 'block';
  sqlOut.textContent = 'Translating…';
  resWrap.innerHTML  = '<div class="result-msg">Executing…</div>';
  rowCount.style.display = 'none';

  const res = await window.api.translate(expr);
  sqlOut.textContent = res.sql || '—';
  renderResults(res.results);
  addHistory(expr);

  runBtn.disabled = false;
  spinner.style.display = 'none';
});

function renderResults(r) {
  if (!r) { resWrap.innerHTML = '<div class="result-msg">No response.</div>'; return; }

  if (r.type === 'table') {
    let html = '<table class="results-table"><thead><tr>';
    r.headers.forEach(h => { html += `<th>${esc(h)}</th>`; });
    html += '</tr></thead><tbody>';
    r.rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => { html += `<td>${esc(String(cell ?? ''))}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    resWrap.innerHTML = html;
    rowCount.textContent = `${r.rows.length} row(s) returned`;
    rowCount.style.display = 'block';
    document.getElementById('clearResultsBtn').style.display = 'inline-block';
    return;
  }

  const icon = TYPE_ICON[r.type] || 'info';
  const cls  = TYPE_CLS[r.type]  || '';
  const msg  = r.message || String(r);
  resWrap.innerHTML = `<div class="result-msg ${cls}"><i data-lucide="${icon}" class="icon-sm"></i><span>${esc(msg)}</span></div>`;
  lucide.createIcons();
  rowCount.style.display = 'none';
  document.getElementById('clearResultsBtn').style.display = 'inline-block';
}

function clearResults() {
  resWrap.innerHTML = '<div class="result-msg">— Run a query to see results —</div>';
  sqlOut.textContent = '— SQL will appear here —';
  rowCount.style.display = 'none';
  document.getElementById('clearResultsBtn').style.display = 'none';
}

function addHistory(expr) {
  const p = histList.querySelector('.h-empty');
  if (p) p.remove();
  if (queryHistory[0] === expr) return;
  queryHistory.unshift(expr);
  if (queryHistory.length > 25) queryHistory.pop();
  const li = document.createElement('li');
  li.className = 'h-item';
  li.innerHTML = `<div class="h-expr">${esc(expr)}</div><div class="h-time">${new Date().toLocaleTimeString()}</div>`;
  li.addEventListener('click', () => { raInput.value = expr; raInput.focus(); });
  histList.prepend(li);
}

function toggleTable(header) {
  const cols  = header.nextElementSibling;
  const arrow = header.querySelector('.schema-toggle');
  const open  = cols.classList.toggle('open');
  // Swap chevron-right ↔ chevron-down when toggling
  arrow.setAttribute('data-lucide', open ? 'chevron-down' : 'chevron-right');
  lucide.createIcons({ nodes: [arrow] });
}

function insertTable(e, tableName) {
  e.stopPropagation();
  const s = raInput.selectionStart;
  raInput.value = raInput.value.slice(0, s) + tableName + raInput.value.slice(s);
  raInput.setSelectionRange(s + tableName.length, s + tableName.length);
  raInput.focus();
}

function copySQL() {
  const txt = sqlOut.textContent;
  if (!txt || txt.includes('will appear')) return;
  navigator.clipboard.writeText(txt).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.innerHTML = '<i data-lucide="check" class="icon-xs"></i> Copied!';
    lucide.createIcons({ nodes: [btn] });
    setTimeout(() => {
      btn.innerHTML = '<i data-lucide="clipboard" class="icon-xs"></i> Copy';
      lucide.createIcons({ nodes: [btn] });
    }, 1500);
  });
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Initialize all static Lucide icons on page load
lucide.createIcons();
