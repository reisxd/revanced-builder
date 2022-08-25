const accentColors = document.querySelectorAll('.theming span');
accentColors.forEach((color) => {
  color.addEventListener('click', () => {
    accentColors.forEach((el) => el.classList.remove('active'));
    color.classList.add('active');
    let colorNow1 = color.style.getPropertyValue('background-color');
    // todo: in future maybe allow user to set any color, `colorNow1 = prompt("Set Custom Color:", colorNow1)`;
    document.documentElement.style.setProperty('--accentColor', colorNow1);
    localStorage.setItem('theme', colorNow1);
  });
});
