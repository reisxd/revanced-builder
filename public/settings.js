const accentColors = document.querySelectorAll('#themecolor-picker span');
const enbtn = document.querySelector('#enable');
const dbbtn = document.querySelector('#disable');

accentColors.forEach((color) => {
  color.addEventListener('click', () => {
    accentColors.forEach((el) => el.classList.remove('active'));
    color.classList.add('active');

    const colorNow1 = color.style.getPropertyValue('background-color');

    document.documentElement.style.setProperty('--accentColor', colorNow1);
    localStorage.setItem('theme', colorNow1);
  });
});

if (localStorage.getItem('auto-next')) {
  enbtn.style.display = 'none';
} else {
  dbbtn.style.display = 'none';
}
enbtn.addEventListener('click', function () {
  enbtn.style.display = 'none';
  dbbtn.style.display = 'block';
  localStorage.setItem('auto-next', true);
});
dbbtn.addEventListener('click', function () {
  dbbtn.style.display = 'none';
  enbtn.style.display = 'block';
  localStorage.removeItem('auto-next');
});
