// Responsive prototype helpers (ADR 0008): one nav (tab bar / sidebar), keyboard map, review-page hand-off.
(() => {
  const TABS = [['house', 'Hôm nay', 'd-today.html'], ['path', 'Lộ trình', 'd-roadmap.html'], ['brain', 'Luyện tập', 'd-shell.html?tab=2'], ['user-circle', 'Tôi', 'd-shell.html?tab=3']];
  const SPRITE = window.SPRITE ?? '../icons.svg';
  const ic = (id, cls = 'ic') => '<svg class="' + cls + '"><use href="' + SPRITE + '#i-' + id + '"/></svg>';
  window.ic = ic;
  const inReview = window.parent !== window;
  window.go = (href) => { if (inReview) parent.postMessage({ chaiyoGo: href }, '*'); else location.href = href; };
  window.renderNav = (el, active) => {
    el.setAttribute('aria-label', 'Điều hướng chính');
    el.innerHTML = '<a class="brand" href="d-today.html"><img src="../../static/brand/icon-192.png" alt="">Chaiyo!</a><ul>' + TABS.map(([icon, label, href], i) =>
      '<li><a href="' + href + '"' + (i === active ? ' aria-current="page"' : '') + '><span class="icw" aria-hidden="true">' + ic('regular-' + icon, 'ic l') + ic('fill-' + icon, 'ic f n-' + icon) + '</span><span>' + label + '</span></a></li>').join('') + '</ul>';
    if (inReview) el.querySelectorAll('a').forEach((a) => (a.onclick = (e) => { e.preventDefault(); go(a.getAttribute('href')); }));
  };
  // focus flows only: Digit/Numpad 1..9 by event.code (layout-safe), Enter, Space, Escape; no letters.
  // skips IME composition, modifier combos, already-handled events and text fields
  window.onKeys = (map) => addEventListener('keydown', (e) => {
    if (e.isComposing || e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target, typing = t.matches?.('input, textarea, [contenteditable]');
    const d = /^(?:Digit|Numpad)([1-9])$/.exec(e.code)?.[1];
    const k = e.code === 'Space' ? 'Space' : e.key;
    if (typing && k !== 'Enter' && k !== 'Escape') return;
    const f = d ? map.digit && ((ev) => map.digit(+d, ev)) : map[k];
    if (!f) return;
    if (k === 'Space' && t.matches?.('button, a')) return;
    if (k === 'Enter' && t.matches?.('button:not(.opt):not(.idk), a') && !typing) return;
    if (f(e) !== false) e.preventDefault();
  });
})();
