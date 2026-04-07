function enterApp() {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').style.display = 'block';
}

function enterApp() {
  const landing = document.getElementById('landing');
  landing.style.opacity = "0";
  setTimeout(() => {
    landing.style.display = "none";
  }, 300);
}
