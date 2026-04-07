

function enterApp() {
  const landing = document.getElementById('landing');
  landing.style.opacity = "0";
  setTimeout(() => {
    landing.style.display = "none";
  }, 300);
}
