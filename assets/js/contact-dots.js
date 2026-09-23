// 联系方式行的分隔圆点：只在「同一行里相邻」的两项之间画。
//
// 为什么需要 JS：圆点落在行首会读成列表符号（"· GitHub"），而纯 CSS
// 判断不了某一项是不是被挤到了行首 —— 圆点无论挂在前一项的 ::after
// 还是后一项的 ::before，换行时总有一头会变成孤立的行首 / 行尾符号。
//
// 这里用几何信息判断：一行是从左往右排的，如果某一项的左边落在上一项的
// 右边界之内，说明它已经换到下一行了 —— 它是行首，不该有圆点。
// （不去比 top：将来某项字号不同时，baseline 对齐会让同一行内各元素的
// top 不一致，比 top 会误判。）
//
// 圆点本身是绝对定位画在留白里的（见 _sass/modern-resume-theme.scss），
// 加不加这个 class 都不占布局，所以这里不会引起重排或位移。
(function () {
  var row = document.querySelector('.resume-contact');
  if (!row) return;

  var items = Array.prototype.slice.call(row.children);
  if (items.length < 2) return;

  function mark() {
    var prevRight = -Infinity;
    items.forEach(function (el, i) {
      var rect = el.getBoundingClientRect();

      // 被 display:none 藏起来的项（如打印介质下的 .no-print）尺寸为 0，
      // 拿它当基准会把后面所有项的判断带偏，直接跳过。
      if (!rect.width && !rect.height) return;

      var wrapped = i > 0 && rect.left < prevRight - 0.5;
      el.classList.toggle('has-dot', i > 0 && !wrapped);
      prevRight = rect.right;
    });
  }

  mark();

  // 换行位置会随窗口宽度变化，也会随字体替换（font-display: swap）变化，
  // 两处都要重算。resize 用 rAF 节流：拖动窗口时每帧最多算一次。
  var pending = 0;
  window.addEventListener('resize', function () {
    if (pending) return;
    pending = requestAnimationFrame(function () {
      pending = 0;
      mark();
    });
  });

  // 打印时社交链接整条 .no-print 隐藏，剩下的项可能重新排布，
  // 圆点得按纸面的布局重算一次。beforeprint 在打印预览生成前触发，
  // 此时改 class 还来得及反映到纸上。
  window.addEventListener('beforeprint', mark);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(mark);
  }
})();
