const accentColors = document.querySelectorAll('#themecolor-picker span');
if (localStorage.getItem('auto-next')) {
  document.getElementById('autoBtn').checked = true;
}
if (localStorage.getItem('black-theme')) {
  document.getElementById('blackBtn').checked = true;
}

accentColors.forEach((color) => {
  color.addEventListener('click', () => {
    accentColors.forEach((el) => el.classList.remove('active'));
    color.classList.add('active');
    const colorNow1 = color.style.getPropertyValue('background-color');
    document.documentElement.style.setProperty('--accentColor', colorNow1);
    localStorage.setItem('theme', colorNow1);
  });
});

document.getElementById('autoBtn').addEventListener('click', function () {
  if (localStorage.getItem('auto-next')) {
    localStorage.removeItem('auto-next');
  } else {
    localStorage.setItem('auto-next', true);
  }
});
document.getElementById('blackBtn').addEventListener('click', function () {
  if (localStorage.getItem('black-theme')) {
    localStorage.removeItem('black-theme');
    document.documentElement.classList.remove('black');
  } else {
    localStorage.setItem('black-theme', true);
    document.documentElement.classList.add('black');
  }
});
