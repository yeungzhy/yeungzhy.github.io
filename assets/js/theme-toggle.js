// 深色 / 浅色主题切换
//
// 「深色 / 浅色」两个文字标签的切换交给 CSS（见 assets/main.scss
// 的 .theme-label--*），这里负责：
//   1. 改 body 的 class、记住选择、维护 aria-pressed
//   2. 把「从哪儿扩散」的坐标写给 CSS（--theme-reveal-x/y/radius），
//      扩散动画本身在 CSS 里（见 main.scss 的 @keyframes theme-reveal）
//   3. 浏览器不支持 View Transitions、或用户在系统里开了"减少动态效果"时，
//      退回直接切换
//
// 注意：扩散动画**不能**改回 JS 的 element.animate(..., { pseudoElement })。
// 那条路要等 transition.ready 兑现，而新版 Chromium 会拒绝它
// （InvalidStateError: Transition was aborted / timeout in DOM update），
// 被拒绝后整段静默跳过 —— 表现就是"旧版 Chrome 有扩散、新版没有"。
(function () {
  const btn = document.getElementById('theme-toggle');
  const body = document.body;
  const root = document.documentElement;
  const storageKey = 'resume-theme-mode';

  // 切换的目标状态。不能只读 body 的 class —— View Transitions 要等浏览器
  // 拍完"切换前"快照才执行回调，在这之前 body 还是旧值。连点两次时两次点击
  // 都会读到旧值、算出同一个目标，结果是双击后停在深色而不是转回原样。
  let pendingDark = null;
  // 正在进行的过渡数量。连点会让新的过渡顶掉旧的，旧过渡的 finished 会先
  // 落地，如果只看它就把过渡期间的样式解锁了，而新的其实还在跑。
  let running = 0;

  function applyMode(isDark) {
    body.classList.toggle('dark', isDark);
    localStorage.setItem(storageKey, isDark ? 'dark' : 'light');
    if (btn) btn.setAttribute('aria-pressed', String(isDark));
  }

  function done() {
    running -= 1;
    if (running <= 0) {
      running = 0;
      root.classList.remove('theme-switching'); // 见 main.scss
      pendingDark = null;
    }
  }

  // 扩散圆心到视口最远角的距离 —— 圆的半径要够大才能盖满整屏
  function coverRadius(x, y) {
    return Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
  }

  // 扩散的原点：优先用鼠标点击的坐标（用户要的"从点击的位置扩散"）。
  // 键盘激活（Enter / Space）时 clientX/Y 都是 0，这时退回按钮中心，
  // 否则圆会从左上角展开。
  function revealOrigin(event) {
    const rect = btn.getBoundingClientRect();
    const fromPointer = event && (event.clientX || event.clientY);
    const x = fromPointer ? event.clientX : rect.left + rect.width / 2;
    const y = fromPointer ? event.clientY : rect.top + rect.height / 2;
    return { x: Math.round(x), y: Math.round(y) };
  }

  function toggleTheme(event) {
    const isDark = !(pendingDark === null ? body.classList.contains('dark') : pendingDark);
    pendingDark = isDark;

    // 不做扩散、直接切的情况：
    //   1. 浏览器不支持 View Transitions
    //   2. 用户在系统里开了"减少动态效果"
    if (
      !document.startViewTransition ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      applyMode(isDark);
      pendingDark = null; // 没有动画要等，立刻交还控制权
      return;
    }

    const { x, y } = revealOrigin(event);
    root.style.setProperty('--theme-reveal-x', x + 'px');
    root.style.setProperty('--theme-reveal-y', y + 'px');
    root.style.setProperty('--theme-reveal-radius', Math.round(coverRadius(x, y)) + 'px');

    root.classList.add('theme-switching');

    const transition = document.startViewTransition(() => applyMode(isDark));

    // then(done, done) 而不是 finally：被顶掉时 finished 是 reject，
    // finally 会把拒绝继续往下传，变成未处理的 Promise 错误。
    running += 1;
    transition.finished.then(done, done);
  }

  if (btn) {
    // 初始同步：body 的 class 已由 _layouts/default.html 里的内联脚本设好，
    // 这里只是把按钮的 aria 状态对齐，避免读屏软件读到过期状态。
    btn.setAttribute('aria-pressed', String(body.classList.contains('dark')));
    btn.addEventListener('click', toggleTheme);
  }
})();
