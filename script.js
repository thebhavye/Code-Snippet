const STORE_KEY = 'snippetvault_v2';

let snippets = [];
let activeId = null;
let activeLang = 'all';

function enterApp() {
  const landing = document.getElementById('landing');
  const app = document.getElementById('app');

  landing.style.opacity = "0";
  setTimeout(() => {
    landing.style.display = "none";
    app.classList.add("visible");
    loadData();
    renderSidebar();
  }, 300);
}

function loadData() {
  const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  snippets = [...saved];
}

function persist() {
  localStorage.setItem(STORE_KEY, JSON.stringify(snippets));
}

function showForm() {
  document.getElementById('main').innerHTML = `
    <h2>New Snippet</h2>
    <input id="title" placeholder="Title"><br><br>
    <textarea id="code" placeholder="Your code"></textarea><br><br>
    <button onclick="saveSnippet()">Save</button>
  `;
}

function saveSnippet() {
  const title = document.getElementById('title').value;
  const code  = document.getElementById('code').value;

  if (!title || !code) return alert("Fill all fields");

  const newSnippet = {
    id: Date.now().toString(),
    title,
    code
  };

  snippets.push(newSnippet);
  persist();
  renderSidebar();
}

function renderSidebar() {
  const list = document.getElementById('main');

  if (snippets.length === 0) {
    list.innerHTML = "<p>No snippets yet</p>";
    return;
  }

  list.innerHTML = snippets.map(s => `
    <div>
      <h3>${s.title}</h3>
      <pre>${s.code}</pre>
    </div>
  `).join('');
}
