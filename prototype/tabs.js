// Frost tab bar for tab roots. Markup: <nav class="tabs"><span class="pill"></span><a class="tab" href aria-current?>…</a>×4</nav>
// Pill follows the finger while held, springs to the nearest tab on release, then the page navigates.
// Only the pill's transform changes per frame; the frosted bar is plain CSS and never re-renders.
const NAMES = ['house', 'path', 'brain', 'user-circle'];
const tabs = document.querySelector('.tabs'), pill = tabs.querySelector('.pill');
const items = [...tabs.querySelectorAll('.tab')];
let active = items.findIndex((a) => a.hasAttribute('aria-current')), geo;
const measure = () => {
  geo = { left: tabs.getBoundingClientRect().left, w: items[0].offsetWidth, c: items.map((a) => a.offsetLeft + a.offsetWidth / 2) };
  pill.style.width = geo.w + 'px';
};
// each tab icon = line + fill stacked; selection crossfades them (fill pops in, line fades out)
items.forEach((a, i) => {
  const w = document.createElement('span'); w.className = 'icw'; w.setAttribute('aria-hidden', 'true');
  w.innerHTML = `<svg class="ic l"><use href="icons.svg#i-regular-${NAMES[i]}"/></svg><svg class="ic f n-${NAMES[i]}"><use href="icons.svg#i-fill-${NAMES[i]}"/></svg>`;
  a.querySelector('.ic').replaceWith(w);
});
const paintIcons = () => items.forEach((a, i) => a.querySelector('.icw').classList.toggle('on', i === active));
const s = { x: 0, v: 0, tx: 0 };
let running = false, last = 0, held = false, pending = null;
const put = () => { pill.style.transform = `translateX(${(s.x - geo.w / 2 - 5).toFixed(2)}px)`; };
const step = (now) => {
  const dt = Math.min(0.034, (now - (last || now)) / 1000); last = now;
  const [k, z] = held ? [900, 0.9] : [420, 0.62];
  for (let n = Math.max(1, Math.ceil(dt * 240)), h = dt / n; n--;) { s.v += (k * (s.tx - s.x) - 2 * z * Math.sqrt(k) * s.v) * h; s.x += s.v * h; }
  put();
  if (!held && Math.abs(s.tx - s.x) < 0.05 && Math.abs(s.v) < 0.5) {
    s.x = s.tx; put(); running = false; last = 0;
    if (pending) { location.href = pending; pending = null; }
  } else requestAnimationFrame(step);
};
const kick = () => { if (!running) { running = true; requestAnimationFrame(step); } };
const fingerX = (e) => Math.min(geo.c.at(-1), Math.max(geo.c[0], e.clientX - geo.left));
const nearest = (x) => geo.c.reduce((b, c, i) => (Math.abs(c - x) < Math.abs(geo.c[b] - x) ? i : b), 0);
tabs.addEventListener('pointerdown', (e) => {
  e.preventDefault(); tabs.setPointerCapture(e.pointerId); measure();
  held = true; tabs.classList.add('held'); s.tx = fingerX(e); kick();
});
tabs.addEventListener('pointermove', (e) => { if (held) { s.tx = fingerX(e); kick(); } });
const release = (e) => {
  if (!held) return;
  held = false; tabs.classList.remove('held');
  const i = nearest(e.type === 'pointercancel' ? s.x : fingerX(e));
  if (i !== active) {
    items[active].removeAttribute('aria-current'); items[i].setAttribute('aria-current', 'page'); active = i; paintIcons();
    const href = items[i].getAttribute('href');
    if (href && href !== '#') pending = href;  // unbuilt tabs keep href="#": pill moves, no navigation
  }
  s.tx = geo.c[i]; kick();
};
items.forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  if (e.detail === 0 && a.getAttribute('href') !== '#') location.href = a.getAttribute('href');  // keyboard Enter
}));
tabs.addEventListener('pointerup', release);
tabs.addEventListener('pointercancel', release);
const reset = () => { measure(); s.x = s.tx = geo.c[active]; put(); };
paintIcons(); reset();
addEventListener('resize', reset);
