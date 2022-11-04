const colorNow = localStorage.getItem('theme') ?? '#4873b3';
document.documentElement.style.setProperty('--accentColor', colorNow);
