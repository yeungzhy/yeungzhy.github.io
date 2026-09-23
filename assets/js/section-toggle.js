// 可折叠块：点击标题收起 / 展开，并记住选择
//
// 页面里所有带 data-collapse-key 的标题按钮都由这里统一接管 ——
// 目前就是 _layouts/default.html 里 site.content 的每个 section。
//
// JS 不关心「收起」到底藏掉什么，那是 CSS 按 key 决定的（见 assets/main.scss）：
// 普通 section 藏的是整个 [data-collapse-body]。所以以后再加可折叠块，
// 只要给它一个 data-collapse-key，这里一行都不用动。
//
// 三件事：
//   1. 点击切换 <html data-collapsed="key1 key2">，CSS 用 [data-collapsed~=key] 匹配
//   2. 把选择写进 localStorage 的一张 JSON 表，刷新后由 default.html 顶部的
//      内联脚本在正文解析前恢复，避免先渲染再消失的闪烁
//   3. 同步每个按钮的 aria-expanded
(function () {
  const buttons = document.querySelectorAll('[data-collapse-key]');
  if (!buttons.length) return;

  const STORAGE_KEY = 'resume-collapsed'; // 键名与 default.html 的内联脚本一致
  const root = document.documentElement;

  // 初始状态来自内联脚本预渲染的 data-collapsed；为空就是全部展开。
  // 用 Set 是为了增删都是 O(1)，且天然去重。
  const collapsed = new Set((root.dataset.collapsed || '').split(/\s+/).filter(Boolean));

  function syncDataset() {
    // key 不含空格（模板已 slugify），所以空格分隔可以安全地喂给 CSS 的 ~=
    root.dataset.collapsed = Array.from(collapsed).join(' ');
  }

  function persist() {
    // 每个块都显式记 0/1，不能只存收起的那些。
    // 因为有的块「默认收起」（见 _config.yml 的 collapsed），用户把它点开后存的
    // 是 0；如果省略这个 0，下次刷新会被默认值重新收起来，用户的展开动作就白做了。
    const map = {};
    buttons.forEach(function (btn) {
      const key = btn.dataset.collapseKey;
      if (key) map[key] = collapsed.has(key) ? 1 : 0;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (e) {} // 隐私模式等写不进去时静默降级：当次会话仍可用，只是不记忆
  }

  buttons.forEach(function (btn) {
    const key = btn.dataset.collapseKey;
    if (!key) return;

    // 初始 aria 对齐：模板里写死 aria-expanded="true"，这里按恢复出来的状态纠正，
    // 否则读屏软件会读到和画面相反的状态。
    btn.setAttribute('aria-expanded', String(!collapsed.has(key)));

    btn.addEventListener('click', function () {
      const nowCollapsed = !collapsed.has(key);
      if (nowCollapsed) collapsed.add(key);
      else collapsed.delete(key);

      syncDataset();
      persist();
      btn.setAttribute('aria-expanded', String(!nowCollapsed));
    });
  });
})();
