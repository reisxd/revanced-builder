const accentColors = document.querySelectorAll('.theming span');
accentColors.forEach((color) => {
  color.addEventListener('click', () => {
    accentColors.forEach((el) => el.classList.remove('active'));
    color.classList.add('active');
    const colorNow1 = color.style.getPropertyValue('background-color');
    document.documentElement.style.setProperty('--accentColor', colorNow1);
    localStorage.setItem('theme', colorNow1);
  });
});
