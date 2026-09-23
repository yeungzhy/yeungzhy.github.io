// 深色 / 浅色主题切换
(function () {
  const btn = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  const body = document.body;
  const storageKey = 'resume-theme-mode';

  function updateIcon(isDark) {
    if (!icon) return;
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  }

  function setMode(isDark) {
    if (isDark) {
      body.classList.add('dark');
      localStorage.setItem(storageKey, 'dark');
    } else {
      body.classList.remove('dark');
      localStorage.setItem(storageKey, 'light');
    }
    updateIcon(isDark);
  }

  // 初始化图标（与 body 当前状态保持一致）
  updateIcon(body.classList.contains('dark'));

  if (btn) {
    btn.addEventListener('click', function () {
      setMode(!body.classList.contains('dark'));
    });
  }
})();
