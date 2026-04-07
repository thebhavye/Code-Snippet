const STORE_KEY = 'snippetvault_v2';
const DEMO_IDS  = ['_demo1','_demo2','_demo3'];

let snippets   = [];
let activeId   = null;
let activeLang = 'all';
let editingId  = null;
let hiddenDemos = new Set(JSON.parse(localStorage.getItem('sv_hidden_demos') || '[]'));

const DEMO_SNIPPETS = [
  {
    id: '_demo1',
    title: 'Debounce Function',
    language: 'JavaScript',
    tags: 'utility, performance, events',
    description: 'Delays invoking a function until after a wait period since the last call.',
    code: `function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const handleResize = debounce(() => {
  console.log('Window resized!');
}, 300);

window.addEventListener('resize', handleResize);`,
    isDemo: true, createdAt: 0, updatedAt: 0
  },
  {
    id: '_demo2',
    title: 'Fetch with Async/Await',
    language: 'JavaScript',
    tags: 'async, api, fetch',
    description: 'Async/await wrapper around the Fetch API with error handling.',
    code: `async function getData(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    return await res.json();
  } catch (err) {
    console.error('Fetch failed:', err.message);
    throw err;
  }
}

getData('https://api.example.com/users')
  .then(users => console.log(users))
  .catch(err  => console.error(err));`,
    isDemo: true, createdAt: 0, updatedAt: 0
  },
  {
    id: '_demo3',
    title: 'Flatten Nested List',
    language: 'Python',
    tags: 'list, recursion, utility',
    description: 'Recursively flattens an arbitrarily nested Python list.',
    code: `def flatten(lst):
    result = []
    for item in lst:
        if isinstance(item, list):
            result.extend(flatten(item))
        else:
            result.append(item)
    return result

nested = [1, [2, [3, [4, 5]]], 6]
print(flatten(nested))  # [1, 2, 3, 4, 5, 6]`,
    isDemo: true, createdAt: 0, updatedAt: 0
  }
];

function loadData() {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  snippets = [...DEMO_SNIPPETS.filter(d => !hiddenDemos.has(d.id)), ...saved.filter(s => !DEMO_IDS.includes(s.id))];
}

function userSnippets() {
  return snippets.filter(s => !s.isDemo);
}

function persist() {
  localStorage.setItem(STORE_KEY, JSON.stringify(userSnippets()));
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function parseTags(tagStr) {
  if (!tagStr) return [];
  return tagStr.split(',').map(t => t.trim()).filter(Boolean);
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}

const ALL_LANGUAGES = [
  'JavaScript','TypeScript','Python','Java','C','C++','C#',
  'HTML','CSS','SQL','PHP','Ruby','Go','Rust','Swift',
  'Kotlin','Bash','JSON','Markdown','Other'
];

function filtered() {
  const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  return snippets.filter(s => {
    const byLang   = activeLang === 'all' || s.language === activeLang;
    const bySearch = !q
      || s.title.toLowerCase().includes(q)
      || s.code.toLowerCase().includes(q)
      || (s.tags        || '').toLowerCase().includes(q)
      || (s.description || '').toLowerCase().includes(q);
    return byLang && bySearch;
  });
}

function renderSidebar() {
  const items = filtered();
  const total = snippets.length;
  document.getElementById('snippetCount').textContent =
    `${total} snippet${total !== 1 ? 's' : ''}`;

  const langs = ['all', ...new Set(snippets.map(s => s.language))];
  document.getElementById('langPills').innerHTML = langs.map(l =>
    `<button class="pill ${activeLang === l ? 'active' : ''}"
             onclick="setLang('${l}')">${l === 'all' ? 'All' : l}</button>`
  ).join('');

  const listEl = document.getElementById('snippetList');
  if (items.length === 0) {
    listEl.innerHTML = '<div class="no-snippets">No snippets found.</div>';
    return;
  }

  function sidebarCard(s) {
    const tags = parseTags(s.tags);
    return `
      <div class="snippet-card ${s.id === activeId ? 'active' : ''}"
           onclick="viewSnippet('${s.id}')">
        <div class="snippet-card-title">${esc(s.title)}</div>
        <div class="snippet-card-meta">
          <span class="lang-badge">${esc(s.language)}</span>
          ${s.isDemo ? '<span class="demo-marker">demo</span>' : ''}
          ${tags.length ? `<span class="tag-sm">${tags.slice(0,2).map(t => '#'+esc(t)).join(' ')}</span>` : ''}
        </div>
      </div>`;
  }

  const userItems = items.filter(s => !s.isDemo);
  const demoItems = items.filter(s => s.isDemo);
  let html = '';
  if (userItems.length > 0) {
    html += userItems.map(sidebarCard).join('');
  }
  if (demoItems.length > 0) {
    if (userItems.length > 0) {
      html += '<div class="sidebar-section-sep"><span>Demo</span></div>';
    } else {
      html += '<div class="sidebar-section-sep first"><span>Demo snippets</span></div>';
    }
    html += demoItems.map(sidebarCard).join('');
  }
  listEl.innerHTML = html;
}

function setLang(lang) { activeLang = lang; renderSidebar(); }

function getHighlighted(code, language) {
  try {
    const lang = language.toLowerCase().replace(/[^a-z0-9+#]/g,'');
    return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
  } catch (_) {
    return hljs.highlightAuto(code).value;
  }
}

function showGrid() {
  activeId = null;
  renderSidebar();

  const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
  const demoItems = snippets.filter(s => s.isDemo && (activeLang === 'all' || s.language === activeLang) && (!q || s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.tags||'').toLowerCase().includes(q)));
  const userItems = snippets.filter(s => !s.isDemo && (activeLang === 'all' || s.language === activeLang) && (!q || s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.tags||'').toLowerCase().includes(q)));
  const hasUser = userSnippets().length > 0;

  function cardHTML(s) {
    const tags = parseTags(s.tags);
    const previewLines = s.code.split('\n').slice(0,5).join('\n');
    return `
    <div class="grid-card ${s.isDemo ? 'is-demo' : ''}">
      <div class="grid-card-header">
        <div class="grid-card-top">
          <div class="grid-card-title">${esc(s.title)}</div>
          <span class="grid-card-lang">${esc(s.language)}</span>
        </div>
        ${s.description ? `<div class="grid-card-desc">${esc(s.description)}</div>` : ''}
        <div style="display:flex; gap:6px; margin-top:10px; flex-wrap:wrap;">
          <button class="btn" onclick="event.stopPropagation(); viewSnippet('${s.id}')">View</button>
          ${s.isDemo ? `
          <button class="btn btn-template" onclick="event.stopPropagation(); useAsTemplate('${s.id}')">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 4v4M4 6h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            Use as template
          </button>
          <button class="btn btn-dismiss" onclick="event.stopPropagation(); dismissDemo('${s.id}')">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            Hide
          </button>` : `
          <button class="btn btn-danger" onclick="event.stopPropagation(); deleteSnippet('${s.id}')">Delete</button>`}
        </div>
      </div>
      ${tags.length ? `<div class="grid-card-tags">${tags.map(t => `<span class="grid-tag">#${esc(t)}</span>`).join('')}</div>` : ''}
      <div class="grid-card-preview">${esc(previewLines)}</div>
    </div>`;
  }

  let html = `<div class="grid-view">
    <div class="grid-header">
      <span class="grid-title">Your Vault</span>
      <span class="grid-subtitle">${hasUser ? userSnippets().length + ' snippet' + (userSnippets().length !== 1 ? 's' : '') : 'No snippets yet — add your first one'}</span>
    </div>`;

  // USER SNIPPETS SECTION
  if (userItems.length > 0) {
    html += `
    <div class="section-label">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M4 6l1.5 1.5L8 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Your Snippets
      <span class="section-count">${userItems.length}</span>
    </div>
    <div class="snippet-grid">${userItems.map(cardHTML).join('')}</div>`;
  } else if (!q && activeLang === 'all') {
    html += `
    <div class="section-label">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M4 6l1.5 1.5L8 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
      Your Snippets
    </div>
    <div class="snippet-grid">
      <div class="grid-empty" style="grid-column:1/-1">
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none"><rect x="6" y="4" width="28" height="32" rx="4" stroke="currentColor" stroke-width="1.8"/><path d="M13 14h14M13 20h8M13 26h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        <h3>Your vault is empty</h3>
        <p>Save your first snippet and it will appear here.</p>
        <button class="grid-empty-btn" onclick="showForm()">+ New Snippet</button>
      </div>
    </div>`;
  }

  // DIVIDER + DEMO SECTION
  if (demoItems.length > 0) {
    html += `
    <div class="demo-section-divider">
      <div class="demo-section-line"></div>
      <div class="demo-section-label-row">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 5v3M6 3.5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        Demo Snippets
        <span class="section-count demo">${demoItems.length}</span>
        <span class="demo-section-hint">· explore &amp; learn · hide when done</span>
      </div>
    </div>
    <div class="snippet-grid demo-grid">${demoItems.map(cardHTML).join('')}</div>`;
  }

  html += `</div>`;
  document.getElementById('main').innerHTML = html;
}

function viewSnippet(id) {
  activeId = id;
  renderSidebar();
  const s = snippets.find(x => x.id === id);
  if (!s) return;

  const tags      = parseTags(s.tags);
  const lineCount = s.code.split('\n').length;
  const highlighted = getHighlighted(s.code, s.language);

  document.getElementById('main').innerHTML = `
    <div class="viewer">
      <div class="viewer-header">
        <div class="viewer-toprow">
          <div>
            <div class="viewer-title">${esc(s.title)}</div>
            <div class="viewer-meta">
              <span class="viewer-lang-badge">${esc(s.language)}</span>
              ${s.isDemo ? '<span class="viewer-demo-tag">Demo</span>' : ''}
              ${tags.map(t => `<span class="viewer-tag">#${esc(t)}</span>`).join('')}
            </div>
          </div>
          <div class="viewer-actions">
            <button class="btn btn-copy" id="copyBtn" onclick="copyCode('${id}')">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 8.5V1.5A.5.5 0 011.5 1H8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              Copy
            </button>
            ${!s.isDemo ? `
            <button class="btn" onclick="showForm('${id}')">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-6.5 6.5H2V8l6.5-6.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
              Edit
            </button>
            <button class="btn btn-danger" onclick="deleteSnippet('${id}')">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V1.5h3V3M5 5.5v3M7 5.5v3M2.5 3l.5 7h6l.5-7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Delete
            </button>` : `
            <button class="btn btn-template" onclick="useAsTemplate('${id}')">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 4v4M4 6h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              Use as template
            </button>
            <button class="btn btn-dismiss" onclick="dismissDemo('${id}')">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
              Hide demo
            </button>
            <button class="btn" onclick="showGrid()" style="color:var(--text2)">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5L3 7l4.5 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Back
            </button>`}
          </div>
        </div>
      </div>
      ${s.description ? `<div class="viewer-desc">${esc(s.description)}</div>` : ''}
      <div class="code-area">
        <span class="line-count">${lineCount} line${lineCount !== 1 ? 's' : ''}</span>
        <pre><code class="hljs">${highlighted}</code></pre>
      </div>
    </div>`;
}

function copyCode(id) {
  const s = snippets.find(x => x.id === id);
  if (!s) return;
  navigator.clipboard.writeText(s.code).then(() => {
    const btn = document.getElementById('copyBtn');
    if (btn) {
      btn.classList.add('copied');
      btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6.5l2.5 3L10 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied!`;
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M1 8.5V1.5A.5.5 0 011.5 1H8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> Copy`;
      }, 2000);
    }
    showToast('Copied to clipboard!');
  });
}

function dismissDemo(id) {
  hiddenDemos.add(id);
  localStorage.setItem('sv_hidden_demos', JSON.stringify([...hiddenDemos]));
  loadData();
  renderSidebar();
  showGrid();
  showToast('Demo snippet hidden.');
}

function useAsTemplate(id) {
  const s = snippets.find(x => x.id === id);
  if (!s) return;
  showForm();
  // Pre-fill after DOM renders
  setTimeout(() => {
    const t = document.getElementById('f_title');
    const l = document.getElementById('f_lang');
    const tg = document.getElementById('f_tags');
    const d = document.getElementById('f_desc');
    const c = document.getElementById('f_code');
    if (t) t.value = s.title + ' (copy)';
    if (l) { l.value = s.language; updateEditorLang(); }
    if (tg) tg.value = s.tags || '';
    if (d) d.value = s.description || '';
    if (c) {
      c.value = s.code;
      c.dispatchEvent(new Event('input'));
    }
  }, 50);
}


function deleteSnippet(id) {
  const s = snippets.find(x => x.id === id);
  if (!s) return;
  if (s.isDemo) { dismissDemo(id); return; }
  if (!confirm('Delete this snippet? This cannot be undone.')) return;
  snippets = snippets.filter(x => x.id !== id);
  persist();
  loadData();
  activeId = null;
  renderSidebar();
  showGrid();
  showToast('Snippet deleted.');
}

function showForm(id) {
  editingId = id || null;
  const s   = id ? snippets.find(x => x.id === id) : null;
  activeId  = id || null;
  renderSidebar();

  const currentLang = s ? s.language : 'JavaScript';
  const langOpts = ALL_LANGUAGES.map(l =>
    `<option value="${l}" ${l === currentLang ? 'selected' : ''}>${l}</option>`
  ).join('');

  document.getElementById('main').innerHTML = `
    <div class="form-view">
      <div class="form-heading">${s ? 'Edit Snippet' : 'New Snippet'}</div>
      <div class="form-group">
        <label class="form-label">Title *</label>
        <input class="form-input" id="f_title" type="text"
               placeholder="e.g. Debounce function"
               value="${s ? esc(s.title) : ''}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Language *</label>
          <select class="form-input form-select" id="f_lang" onchange="updateEditorLang()">${langOpts}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Tags</label>
          <input class="form-input" id="f_tags" type="text"
                 placeholder="utility, async, array"
                 value="${s ? esc(s.tags || '') : ''}">
          <div class="form-hint">Comma-separated</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <input class="form-input" id="f_desc" type="text"
               placeholder="Brief explanation (optional)"
               value="${s ? esc(s.description || '') : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Code *</label>
        <div class="editor-wrap" id="editorWrap">
          <div class="editor-toolbar">
            <span class="editor-lang-label" id="editorLangLabel">${esc(currentLang)}</span>
            <span class="editor-hint">Tab = 2 spaces &nbsp;·&nbsp; Live syntax highlighting</span>
          </div>
          <div class="editor-container" id="editorContainer">
            <pre class="editor-highlight hljs" id="editorHighlight" aria-hidden="true"><code id="editorHighlightCode"></code></pre>
            <textarea class="form-textarea" id="f_code"
                      spellcheck="false"
                      autocomplete="off"
                      autocorrect="off"
                      autocapitalize="off"
                      placeholder="Type or paste your code here…">${s ? esc(s.code) : ''}</textarea>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-save" onclick="saveSnippet()">Save Snippet</button>
        <button class="btn-cancel"
                onclick="${s ? `viewSnippet('${s.id}')` : 'showGrid()'}">Cancel</button>
      </div>
    </div>`;

  initEditor(currentLang, s ? s.code : '');
}

function initEditor(language, initialCode) {
  const textarea = document.getElementById('f_code');
  const highlightCode = document.getElementById('editorHighlightCode');

  function syncHighlight() {
    const code = textarea.value;
    const lang = (document.getElementById('f_lang')?.value || language).toLowerCase().replace(/[^a-z0-9+#]/g, '');
    try {
      highlightCode.innerHTML = hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    } catch (_) {
      highlightCode.innerHTML = hljs.highlightAuto(code).value;
    }
    const pre = document.getElementById('editorHighlight');
    if (pre) { pre.scrollTop = textarea.scrollTop; pre.scrollLeft = textarea.scrollLeft; }
  }

  if (initialCode) syncHighlight();
  textarea.addEventListener('input', syncHighlight);
  textarea.addEventListener('scroll', () => {
    const pre = document.getElementById('editorHighlight');
    if (pre) { pre.scrollTop = textarea.scrollTop; pre.scrollLeft = textarea.scrollLeft; }
  });

  textarea.addEventListener('keydown', function(e) {

  if (e.key === 'Tab') {
    e.preventDefault();
    const start = this.selectionStart;
    const end   = this.selectionEnd;

    this.value =
      this.value.substring(0, start) +
      "  " +
      this.value.substring(end);

    this.selectionStart = this.selectionEnd = start + 2;
    syncHighlight();
  }

  if (e.key === 'Enter') {
    const pos = this.selectionStart;
    const before = this.value.slice(0, pos);
    const lineStart = before.lastIndexOf('\n') + 1;
    const line = before.slice(lineStart);

    const indent = line.match(/^(\s*)/)[1];
    const extra = /[{(\[]$/.test(line.trim()) ? '  ' : '';

    e.preventDefault();
    const insert = '\n' + indent + extra;

    this.value =
      this.value.slice(0, pos) +
      insert +
      this.value.slice(this.selectionEnd);

    this.selectionStart = this.selectionEnd = pos + insert.length;
    syncHighlight();
  }

  // 🔥 FULL AUTO BRACKET COMPLETE
  if (['"', "'", '`', '(', '[', '{'].includes(e.key)) {
    const pairs = { '"':'"', "'":"'", '`':'`', '(':')','[':']','{':'}' };
    const close = pairs[e.key];

    const start = this.selectionStart;
    const end   = this.selectionEnd;

    e.preventDefault();

    if (start === end) {
      this.value =
        this.value.slice(0, start) +
        e.key + close +
        this.value.slice(end);

      this.selectionStart = this.selectionEnd = start + 1;
    } else {
      const selected = this.value.slice(start, end);

      this.value =
        this.value.slice(0, start) +
        e.key + selected + close +
        this.value.slice(end);

      this.selectionStart = start + 1;
      this.selectionEnd   = end + 1;
    }

    syncHighlight();
  }
});
}

function updateEditorLang() {
  const lang = document.getElementById('f_lang')?.value || 'JavaScript';
  const label = document.getElementById('editorLangLabel');
  if (label) label.textContent = lang;
  const textarea = document.getElementById('f_code');
  if (textarea) {
    const event = new Event('input');
    textarea.dispatchEvent(event);
  }
}

// ONLY showing modified parts — rest remains same

function saveSnippet() {
  const title = document.getElementById('f_title').value.trim();
  const lang  = document.getElementById('f_lang').value;
  const tags  = document.getElementById('f_tags').value.trim();
  const desc  = document.getElementById('f_desc').value.trim();
  const code  = document.getElementById('f_code').value;

  if (!title) { alert('Please enter a title.'); return; }
  if (!code.trim()) { alert('Please enter some code.'); return; }

  if (editingId) {
    const idx = snippets.findIndex(s => s.id === editingId);
    if (idx !== -1) {
      snippets[idx] = { ...snippets[idx], title, language: lang, tags, description: desc, code, updatedAt: Date.now() };
    }
    persist();
    loadData();
    renderSidebar();
    showToast('Snippet updated!');
    showGrid(); // 🔥 FIXED
  } else {
    const newSnip = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title, language: lang, tags, description: desc, code,
      isDemo: false, createdAt: Date.now(), updatedAt: Date.now()
    };

    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    saved.unshift(newSnip);
    localStorage.setItem(STORE_KEY, JSON.stringify(saved));

    loadData();
    renderSidebar();
    showToast('Snippet saved!');
    showGrid(); 
  }
}

function enterApp() {
  loadData(); // 🔥 ADD THIS

  const landing = document.getElementById('landing');
  const app     = document.getElementById('app');

  landing.classList.add('exit');

  setTimeout(() => {
    landing.style.display = 'none';
    app.classList.add('visible');

    renderSidebar();
    showGrid();
  }, 400);
}

function enterAppAndNew() {
  loadData(); // 🔥 ADD THIS

  const landing = document.getElementById('landing');
  const app     = document.getElementById('app');

  landing.classList.add('exit');

  setTimeout(() => {
    landing.style.display = 'none';
    app.classList.add('visible');

    renderSidebar();
    showForm();
  }, 400);
}

loadData();
