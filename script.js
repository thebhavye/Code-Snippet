function enterApp() {
  const landing = document.getElementById('landing');
  const app = document.getElementById('app');

  landing.style.opacity = "0";
  setTimeout(() => {
    landing.style.display = "none";
    app.classList.add("visible");
  }, 300);
}

function showForm() {
  document.getElementById('main').innerHTML = `
    <h2>New Snippet</h2>
    <p>Form coming next...</p>
  `;
}
