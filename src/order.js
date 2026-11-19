import { gsap } from 'gsap';
import { CATEGORIES } from './menu.js';
import { initHeader, cart, money, imgSrc, icon, linePrice, lineMods, reduceMotion, drawer } from './shared.js';
import { renderPicado } from './picado.js';
import { findItem } from './menu.js';

document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
document.querySelectorAll('[data-picado]').forEach(renderPicado);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const TAG_LABEL = { popular: 'Popular', spicy: 'Spicy', veg: 'Veggie' };

/* ------------------------------------------------------------------ menu render */
const menuEl = document.querySelector('[data-menu]');
const itemHTML = (item) => `
  <button type="button" class="item" data-add="${item.id}" data-item="${item.id}" aria-label="${esc(item.name)}, ${money(item.price)}">
    <span class="item__body">
      <span class="item__name">${esc(item.name)}</span>
      ${item.desc ? `<span class="item__desc">${esc(item.desc)}</span>` : ''}
      <span class="item__foot">
        <span class="item__price tnum">${money(item.price)}</span>
        ${(item.tags || []).map((t) => `<span class="tag tag--${t}">${TAG_LABEL[t]}</span>`).join('')}
      </span>
    </span>
    ${
      item.img
        ? `<span class="item__thumb"><img src="${imgSrc(item.img)}" alt="" loading="lazy"><span class="item__plus">${icon.plus}</span></span>`
        : `<span class="item__plus item__plus--inline">${icon.plus}</span>`
    }
  </button>`;

menuEl.innerHTML =
  CATEGORIES.map(
    (c) => `
  <section class="menu-cat" id="${c.id}" data-cat="${c.id}">
    <div class="menu-cat__head"><h2>${esc(c.name)}</h2><span class="serif">${esc(c.es)}</span></div>
    ${c.note ? `<p class="menu-cat__note">${esc(c.note)}</p>` : '<div style="height:12px"></div>'}
    <div class="items">${c.items.map(itemHTML).join('')}</div>
  </section>`,
  ).join('') +
  `<div class="empty-search" data-empty hidden><strong>No matches</strong>Try “fajita”, “shrimp” or “queso”.</div>`;

/* ------------------------------------------------------------------ category nav + scrollspy */
const list = document.querySelector('[data-cat-list]');
const pill = document.querySelector('[data-cat-pill]');
const scroller = document.querySelector('[data-cat-scroller]');
list.insertAdjacentHTML('beforeend', CATEGORIES.map((c) => `<a href="#${c.id}" data-cat-link="${c.id}">${esc(c.name)}</a>`).join(''));

let activeCat = null;
let clickLock = false;
function setActive(id, instant = false) {
  if (id === activeCat) return;
  activeCat = id;
  const link = list.querySelector(`[data-cat-link="${id}"]`);
  if (!link) return;
  list.querySelectorAll('a').forEach((a) => a.classList.toggle('is-active', a === link));
  if (instant) pill.style.transition = 'none';
  pill.style.width = `${link.offsetWidth}px`;
  pill.style.transform = `translateX(${link.offsetLeft}px)`;
  if (instant) requestAnimationFrame(() => (pill.style.transition = ''));
  const target = link.offsetLeft - scroller.clientWidth / 2 + link.offsetWidth / 2;
  scroller.scrollTo({ left: target, behavior: reduceMotion || instant ? 'auto' : 'smooth' });
}

const spy = () => {
  if (clickLock) return;
  const line = Math.min(260, window.innerHeight * 0.32);
  let current = CATEGORIES[0].id;
  document.querySelectorAll('[data-cat]:not([hidden])').forEach((sec) => {
    if (sec.getBoundingClientRect().top - line <= 0) current = sec.dataset.cat;
  });
  setActive(current);
};
window.addEventListener('scroll', spy, { passive: true });
window.addEventListener('resize', () => {
  const id = activeCat;
  activeCat = null;
  setActive(id, true);
});

list.addEventListener('click', (e) => {
  const a = e.target.closest('[data-cat-link]');
  if (!a) return;
  e.preventDefault();
  const sec = document.getElementById(a.dataset.catLink);
  setActive(a.dataset.catLink);
  clickLock = true;
  const y = sec.getBoundingClientRect().top + window.scrollY - 140;
  window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  history.replaceState(null, '', `#${a.dataset.catLink}`);
  clearTimeout(list._t);
  list._t = setTimeout(() => (clickLock = false), 900);
});

/* ------------------------------------------------------------------ search */
const search = document.querySelector('[data-search]');
const emptyEl = menuEl.querySelector('[data-empty]');
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  let any = false;
  CATEGORIES.forEach((c) => {
    const sec = document.getElementById(c.id);
    let catHas = false;
    c.items.forEach((it) => {
      const hit = !q || `${it.name} ${it.desc} ${c.name} ${c.es}`.toLowerCase().includes(q);
      sec.querySelector(`[data-item="${it.id}"]`).hidden = !hit;
      if (hit) catHas = true;
    });
    sec.hidden = !catHas;
    list.querySelector(`[data-cat-link="${c.id}"]`).hidden = !catHas;
    if (catHas) any = true;
  });
  emptyEl.hidden = any;
  activeCat = null;
  spy();
});

/* ------------------------------------------------------------------ mode toggle (page) */
const seg = document.querySelector('[data-page-mode]');
function syncMode() {
  const mode = cart.get().mode;
  seg.querySelectorAll('[data-mode-btn]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.modeBtn === mode));
  const active = seg.querySelector('[aria-pressed="true"]');
  const p = seg.querySelector('.segmented__pill');
  p.style.width = `${active.offsetWidth}px`;
  p.style.transform = `translateX(${active.offsetLeft - 4}px)`;
}
seg.addEventListener('click', (e) => {
  const b = e.target.closest('[data-mode-btn]');
  if (b) cart.setMode(b.dataset.modeBtn);
});

/* ------------------------------------------------------------------ mini cart + bar + badges */
const mini = document.querySelector('[data-mini-cart]');
const bar = document.querySelector('[data-cart-bar]');
const headerTotal = document.querySelector('[data-header-total]');

function renderMini() {
  const s = cart.get();
  const sub = cart.subtotal();
  if (!s.lines.length) {
    mini.innerHTML = `
      <h3>Your order</h3>
      <div class="mini-cart__empty">${icon.sombrero}<span>Your bag is empty.<br>Pick something delicious.</span></div>`;
  } else {
    mini.innerHTML = `
      <h3>Your order</h3>
      <ul>${s.lines
        .map((l) => {
          const it = findItem(l.id);
          const mods = lineMods(l);
          return `<li><b class="tnum">${l.qty}×</b><span>${esc(it.name)}${mods.length ? `<br><small style="color:var(--ink-3)">${esc(mods.join(' · '))}</small>` : ''}</span><span class="tnum">${money(linePrice(l) * l.qty)}</span></li>`;
        })
        .join('')}</ul>
      <div class="mini-cart__total tnum"><span>Subtotal</span><span>${money(sub)}</span></div>
      <button type="button" class="btn btn--chile btn--block" data-open-cart-mini>Review &amp; checkout</button>`;
  }
  headerTotal.textContent = s.lines.length ? `· ${money(sub)}` : '';
  bar.querySelector('[data-bar-count]').textContent = cart.count();
  bar.querySelector('[data-bar-total]').textContent = money(sub);
  bar.classList.toggle('is-visible', s.lines.length > 0);
  document.body.classList.toggle('has-cart-bar', s.lines.length > 0 && window.innerWidth <= 1080);

  // per-item quantity badges
  document.querySelectorAll('.item__qty').forEach((b) => b.remove());
  const qty = {};
  s.lines.forEach((l) => (qty[l.id] = (qty[l.id] || 0) + l.qty));
  Object.entries(qty).forEach(([id, n]) => {
    const el = document.querySelector(`[data-item="${id}"]`);
    if (el) el.insertAdjacentHTML('beforeend', `<span class="item__qty tnum" aria-label="${n} in your order">${n}</span>`);
  });
  syncMode();
}
mini.addEventListener('click', (e) => {
  if (e.target.closest('[data-open-cart-mini]')) drawer.open();
});

const mobileBtn = document.querySelector('[data-mobile-cart]');
const syncHeaderBtns = () => {
  const small = window.innerWidth <= 860;
  mobileBtn.style.display = small ? '' : 'none';
};
window.addEventListener('resize', syncHeaderBtns);
syncHeaderBtns();

initHeader();
cart.subscribe(renderMini);

/* ------------------------------------------------------------------ entrance */
const start = location.hash.slice(1);
requestAnimationFrame(() => {
  if (start && document.getElementById(start)) {
    const sec = document.getElementById(start);
    window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY - 140, behavior: 'auto' });
  }
  setActive(start && document.getElementById(start) ? start : CATEGORIES[0].id, true);
  spy();
});

if (!reduceMotion) {
  gsap.from('.order-hero h1, .order-hero .eyebrow, .store-card, .order-tools > *', { y: 18, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 });
  gsap.from('.menu-cat:first-child .item', { y: 24, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.035, delay: 0.15 });
}
