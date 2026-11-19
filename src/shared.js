import { gsap } from 'gsap';
import { OPTION_GROUPS, ALL_ITEMS, findItem, RESTAURANT } from './menu.js';

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ icons */
export const icon = {
  bag: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  plus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
  close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  arrow: '<svg class="arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8L12 2.8Z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  pin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  plate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/></svg>',
  sombrero:
    '<svg viewBox="0 0 120 80" fill="none" aria-hidden="true"><ellipse cx="60" cy="58" rx="56" ry="14" fill="currentColor" opacity=".18"/><path d="M8 56c10 10 94 10 104 0" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M40 52c0-26 8-40 20-40s20 14 20 40" fill="currentColor"/><path d="M42 40c10 4 26 4 36 0" stroke="oklch(80% 0.155 72)" stroke-width="5" stroke-linecap="round"/></svg>',
};

export const stars = (n = 5) =>
  `<span class="stars" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => (i < Math.round(n) ? icon.star : icon.star.replace('currentColor"', 'currentColor" opacity=".3"'))).join('')}</span>`;

export const money = (n) => `$${n.toFixed(2)}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const imgSrc = (name) => `./img/${name}.webp`;

/* ------------------------------------------------------------------ hours (America/Chicago) */
function chicagoNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { day, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
export const fmtTime = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${ap}` : `${h12} ${ap}`;
};
export function openStatus() {
  const { day, minutes } = chicagoNow();
  const [o, c] = RESTAURANT.hours[day];
  if (minutes >= o && minutes < c) return { open: true, label: `Open now · until ${fmtTime(c)}`, day, minutes };
  const nextDay = minutes < o ? day : (day + 1) % 7;
  const when = minutes < o ? 'today' : 'tomorrow';
  return { open: false, label: `Closed · opens ${fmtTime(RESTAURANT.hours[nextDay][0])} ${when}`, day, minutes };
}
export function pickupSlots() {
  const { day, minutes } = chicagoNow();
  const slots = [];
  const prep = 20;
  const build = (d, from, prefix) => {
    const [o, c] = RESTAURANT.hours[d];
    let t = Math.max(o + prep, Math.ceil((from + prep) / 15) * 15);
    for (; t <= c - 15; t += 15) slots.push({ value: `${prefix}-${t}`, label: `${prefix === 'today' ? 'Today' : 'Tomorrow'}, ${fmtTime(t)}` });
  };
  build(day, minutes, 'today');
  build((day + 1) % 7, 0, 'tomorrow');
  return slots;
}

/* ------------------------------------------------------------------ cart store */
const KEY = 'elcazador.cart.v1';
const listeners = new Set();
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { lines: [], mode: 'pickup' };
  } catch {
    return { lines: [], mode: 'pickup' };
  }
};
let state = read();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — cart lives in memory */
  }
  listeners.forEach((fn) => fn(state));
};

export const resolveGroups = (item) => (item.options || []).map((o) => (typeof o === 'string' ? OPTION_GROUPS[o] : o));

export function linePrice(line) {
  const item = findItem(line.id);
  const groups = resolveGroups(item);
  let unit = item.price;
  Object.entries(line.choices || {}).forEach(([gi, idxs]) => idxs.forEach((ci) => (unit += groups[gi]?.choices[ci]?.price || 0)));
  return unit;
}
export function lineMods(line) {
  const item = findItem(line.id);
  const groups = resolveGroups(item);
  const mods = [];
  Object.entries(line.choices || {}).forEach(([gi, idxs]) => idxs.forEach((ci) => mods.push(groups[gi]?.choices[ci]?.label)));
  return mods.filter(Boolean);
}

export const cart = {
  get: () => state,
  subscribe(fn) {
    listeners.add(fn);
    fn(state);
    return () => listeners.delete(fn);
  },
  count: () => state.lines.reduce((s, l) => s + l.qty, 0),
  qtyOf: (id) => state.lines.filter((l) => l.id === id).reduce((s, l) => s + l.qty, 0),
  subtotal: () => state.lines.reduce((s, l) => s + linePrice(l) * l.qty, 0),
  add(id, qty = 1, choices = {}, notes = '') {
    const key = `${id}|${JSON.stringify(choices)}|${notes}`;
    const existing = state.lines.find((l) => l.key === key);
    if (existing) existing.qty += qty;
    else state.lines.push({ key, id, qty, choices, notes });
    persist();
  },
  setQty(key, qty) {
    const l = state.lines.find((x) => x.key === key);
    if (!l) return;
    if (qty <= 0) state.lines = state.lines.filter((x) => x.key !== key);
    else l.qty = qty;
    persist();
  },
  remove(key) {
    state.lines = state.lines.filter((x) => x.key !== key);
    persist();
  },
  clear() {
    state.lines = [];
    persist();
  },
  setMode(mode) {
    state.mode = mode;
    persist();
  },
};

window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = read();
    listeners.forEach((fn) => fn(state));
  }
});

/* ------------------------------------------------------------------ scroll lock + scrim */
let lockCount = 0;
const lock = () => {
  if (lockCount++ === 0) document.body.classList.add('is-locked');
};
const unlock = () => {
  if (--lockCount <= 0) {
    lockCount = 0;
    document.body.classList.remove('is-locked');
  }
};

function mount(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  const el = t.content.firstElementChild;
  document.body.appendChild(el);
  return el;
}

const scrim = mount('<div class="scrim" aria-hidden="true"></div>');
let activeOverlay = null;
scrim.addEventListener('click', () => activeOverlay?.close());
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') activeOverlay?.close();
});

function trapFocus(container, e) {
  if (e.key !== 'Tab') return;
  const f = [...container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
    (el) => !el.disabled && el.offsetParent !== null && !el.closest('[data-pos="left"], [data-pos="right"]'),
  );
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/* ------------------------------------------------------------------ toast */
const toastEl = mount('<div class="toast" role="status" aria-live="polite"><span class="toast__icon">' + icon.check + '</span><span class="toast__msg"></span><button type="button">View order</button></div>');
let toastTimer;
toastEl.querySelector('button').addEventListener('click', () => {
  toastEl.classList.remove('is-visible');
  drawer.open();
});
export function toast(msg) {
  toastEl.querySelector('.toast__msg').textContent = msg;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
}

/* ------------------------------------------------------------------ fly-to-cart */
export function flyToCart(fromEl) {
  const target = [...document.querySelectorAll('[data-cart-target]')].find((el) => el.offsetParent !== null);
  if (!fromEl || !target || reduceMotion) return bumpCart();
  const a = fromEl.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dot = document.createElement('div');
  dot.className = 'fly-dot';
  document.body.appendChild(dot);
  const x0 = a.left + a.width / 2 - 9;
  const y0 = a.top + a.height / 2 - 9;
  const x1 = b.left + b.width / 2 - 9;
  const y1 = b.top + b.height / 2 - 9;
  gsap.set(dot, { x: x0, y: y0, scale: 0.6 });
  const tl = gsap.timeline({ onComplete: () => (dot.remove(), bumpCart()) });
  tl.to(dot, { x: x1, duration: 0.62, ease: 'power2.inOut' }, 0)
    .to(dot, { y: Math.min(y0, y1) - 80, duration: 0.28, ease: 'power2.out' }, 0)
    .to(dot, { y: y1, duration: 0.34, ease: 'power2.in' }, 0.28)
    .to(dot, { scale: 1, duration: 0.3, ease: 'power2.out' }, 0)
    .to(dot, { scale: 0.4, opacity: 0, duration: 0.14 }, 0.52);
}
function bumpCart() {
  document.querySelectorAll('[data-cart-target]').forEach((el) => {
    gsap.fromTo(el, { scale: 1 }, { scale: 1.14, duration: 0.14, ease: 'power2.out', yoyo: true, repeat: 1 });
  });
}

/* ------------------------------------------------------------------ item sheet */
const sheet = mount(`
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
    <div class="sheet__scroll"></div>
    <div class="sheet__foot">
      <div class="stepper" aria-label="Quantity">
        <button type="button" data-q="-1" aria-label="Decrease quantity">${icon.minus}</button>
        <output class="tnum">1</output>
        <button type="button" data-q="1" aria-label="Increase quantity">${icon.plus}</button>
      </div>
      <button type="button" class="btn btn--chile sheet__add"><span>Add to order</span><span class="tnum sheet__total"></span></button>
    </div>
  </div>`);

let sheetState = null;
let sheetReturnFocus = null;

function renderSheet() {
  const { item, qty, choices } = sheetState;
  const groups = resolveGroups(item);
  sheet.querySelector('.sheet__scroll').innerHTML = `
    ${
      item.img
        ? `<div class="sheet__media"><img src="${imgSrc(item.img)}" alt="${esc(item.name)}"><button type="button" class="icon-btn sheet__close" aria-label="Close">${icon.close}</button></div>`
        : ''
    }
    <div class="sheet__head">
      <div class="sheet__head-row">
        <h2 id="sheet-title">${esc(item.name)}</h2>
        ${item.img ? '' : `<button type="button" class="icon-btn sheet__close sheet__close--plain" aria-label="Close">${icon.close}</button>`}
      </div>
      ${item.desc ? `<p>${esc(item.desc)}</p>` : ''}
      <div class="sheet__price tnum">${money(item.price)}</div>
    </div>
    ${groups
      .map(
        (g, gi) => `
      <fieldset class="opt-group" data-group="${gi}" style="border:0;padding-inline:26px;">
        <legend class="sr-only">${esc(g.title)}</legend>
        <div class="opt-group__head">
          <h3>${esc(g.title)}</h3>
          <span class="opt-group__badge ${g.required ? (choices[gi]?.length ? 'is-done' : 'is-required') : ''}">${g.required ? (choices[gi]?.length ? 'Selected' : 'Required') : 'Optional'}</span>
        </div>
        ${g.choices
          .map(
            (c, ci) => `
          <label class="opt ${g.type === 'multi' ? 'opt--multi' : ''}">
            <input type="${g.type === 'multi' ? 'checkbox' : 'radio'}" name="g${gi}" value="${ci}" ${choices[gi]?.includes(ci) ? 'checked' : ''}>
            <span class="opt__ctl"></span>
            <span class="opt__label">${esc(c.label)}</span>
            ${c.price ? `<span class="opt__price tnum">+${money(c.price)}</span>` : ''}
          </label>`,
          )
          .join('')}
      </fieldset>`,
      )
      .join('')}
    <div class="notes">
      <label class="field-label" for="sheet-notes">Special instructions</label>
      <textarea id="sheet-notes" placeholder="No onions, sauce on the side…" maxlength="160">${esc(sheetState.notes)}</textarea>
    </div>`;
  updateSheetFoot();
}

function updateSheetFoot() {
  const { item, qty, choices } = sheetState;
  sheet.querySelector('.sheet__foot output').textContent = qty;
  const unit = linePrice({ id: item.id, choices });
  sheet.querySelector('.sheet__total').textContent = money(unit * qty);
  sheet.querySelector('[data-q="-1"]').disabled = qty <= 1;
}

sheet.addEventListener('change', (e) => {
  const input = e.target.closest('input[name^="g"]');
  if (!input) return;
  const gi = Number(input.name.slice(1));
  const group = resolveGroups(sheetState.item)[gi];
  const fs = sheet.querySelectorAll(`input[name="g${gi}"]`);
  sheetState.choices[gi] = [...fs].filter((x) => x.checked).map((x) => Number(x.value));
  if (!sheetState.choices[gi].length) delete sheetState.choices[gi];
  if (group.required) {
    const badge = input.closest('.opt-group').querySelector('.opt-group__badge');
    badge.className = 'opt-group__badge is-done';
    badge.textContent = 'Selected';
  }
  updateSheetFoot();
});
sheet.addEventListener('input', (e) => {
  if (e.target.id === 'sheet-notes') sheetState.notes = e.target.value;
});
sheet.addEventListener('click', (e) => {
  if (e.target.closest('.sheet__close')) return itemSheet.close();
  const q = e.target.closest('[data-q]');
  if (q) {
    sheetState.qty = Math.max(1, Math.min(20, sheetState.qty + Number(q.dataset.q)));
    updateSheetFoot();
  }
  if (e.target.closest('.sheet__add')) {
    const groups = resolveGroups(sheetState.item);
    const missing = groups.findIndex((g, gi) => g.required && !sheetState.choices[gi]?.length);
    if (missing > -1) {
      const fs = sheet.querySelector(`[data-group="${missing}"]`);
      fs.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      fs.classList.remove('is-shake');
      void fs.offsetWidth;
      fs.classList.add('is-shake');
      return;
    }
    const { item, qty, choices, notes } = sheetState;
    cart.add(item.id, qty, choices, notes.trim());
    const origin = sheetState.origin;
    itemSheet.close();
    flyToCart(origin && origin.isConnected ? origin : sheet.querySelector('.sheet__add'));
    toast(`${qty > 1 ? qty + ' × ' : ''}${item.name} added`);
  }
});
sheet.addEventListener('keydown', (e) => trapFocus(sheet, e));

export const itemSheet = {
  open(id, origin) {
    const item = findItem(id);
    if (!item) return;
    // auto-select the first choice of required single groups? No — make the guest choose, except size groups.
    const choices = {};
    resolveGroups(item).forEach((g, gi) => {
      if (g.title === 'Size') choices[gi] = [0];
    });
    sheetState = { item, qty: 1, choices, notes: '', origin };
    sheetReturnFocus = document.activeElement;
    renderSheet();
    sheet.querySelector('.sheet__scroll').scrollTop = 0;
    activeOverlay = itemSheet;
    lock();
    scrim.classList.add('is-open');
    sheet.classList.add('is-open');
    requestAnimationFrame(() => sheet.querySelector('.sheet__close')?.focus({ preventScroll: true }));
  },
  close() {
    sheet.classList.remove('is-open');
    scrim.classList.remove('is-open');
    activeOverlay = null;
    unlock();
    sheetReturnFocus?.focus?.({ preventScroll: true });
  },
};

/* ------------------------------------------------------------------ drawer (cart → checkout → confirmation) */
const drawer = (() => {
  const el = mount(`
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div class="drawer__head">
        <div class="drawer__title">
          <button type="button" class="icon-btn drawer__back" aria-label="Back to your order" hidden>${icon.back}</button>
          <h2 id="drawer-title">Your order</h2>
        </div>
        <button type="button" class="icon-btn drawer__close" aria-label="Close">${icon.close}</button>
      </div>
      <div class="drawer__steps">
        <section class="drawer__step" data-step="cart" data-pos="center"></section>
        <section class="drawer__step" data-step="checkout" data-pos="right"></section>
        <section class="drawer__step" data-step="done" data-pos="right"></section>
      </div>
    </aside>`);

  const steps = ['cart', 'checkout', 'done'];
  let step = 'cart';
  let tipPct = 0.15;
  let returnFocus = null;
  const titles = { cart: 'Your order', checkout: 'Checkout', done: 'Order placed' };

  const totals = () => {
    const sub = cart.subtotal();
    const fee = cart.count() ? RESTAURANT.togoFee : 0;
    const tax = (sub + fee) * RESTAURANT.taxRate;
    const tip = sub * tipPct;
    return { sub, fee, tax, tip, total: sub + fee + tax + tip };
  };

  const totalsHTML = (withTip) => {
    const t = totals();
    return `
      <div class="totals tnum">
        <div><span>Subtotal</span><span>${money(t.sub)}</span></div>
        <div><span>To-go packaging</span><span>${money(t.fee)}</span></div>
        <div><span>Tax</span><span>${money(t.tax)}</span></div>
        ${withTip ? `<div><span>Tip</span><span>${money(t.tip)}</span></div>` : ''}
        <div class="grand"><span>Total</span><span>${money(withTip ? t.total : t.sub + t.fee + t.tax)}</span></div>
      </div>`;
  };

  function renderCart() {
    const node = el.querySelector('[data-step="cart"]');
    const s = cart.get();
    if (!s.lines.length) {
      node.innerHTML = `
        <div class="empty-cart">
          ${icon.sombrero}
          <strong>Nothing here yet</strong>
          <p>Fajitas, burritos, a large cheese dip… your table is waiting.</p>
          <a class="btn btn--chile" href="./order.html">Browse the menu ${icon.arrow}</a>
        </div>`;
      return;
    }
    const inCart = new Set(s.lines.map((l) => l.id));
    const upsells = ['a1', 'a4', 'd2', 'dr1', 'a10', 'd1'].filter((id) => !inCart.has(id)).slice(0, 4).map(findItem);
    node.innerHTML = `
      <div class="drawer__body">
        <div class="segmented" data-mode style="margin-top:16px;width:100%">
          <span class="segmented__pill"></span>
          <button type="button" data-mode-btn="pickup" aria-pressed="${s.mode === 'pickup'}">Pickup</button>
          <button type="button" data-mode-btn="curbside" aria-pressed="${s.mode === 'curbside'}">Curbside</button>
        </div>
        <div class="cart-lines">
        ${s.lines
          .map((l) => {
            const item = findItem(l.id);
            const mods = lineMods(l);
            return `
            <div class="cart-line" data-key="${esc(l.key)}">
              <div class="cart-line__thumb">${item.img ? `<img src="${imgSrc(item.img)}" alt="" loading="lazy">` : icon.plate}</div>
              <div>
                <h4>${esc(item.name)}</h4>
                ${mods.length || l.notes ? `<div class="cart-line__mods">${esc(mods.join(' · '))}${l.notes ? `${mods.length ? '<br>' : ''}“${esc(l.notes)}”` : ''}</div>` : ''}
                <div class="cart-line__controls">
                  <div class="stepper stepper--sm">
                    <button type="button" data-line-q="-1" aria-label="Decrease">${icon.minus}</button>
                    <output class="tnum">${l.qty}</output>
                    <button type="button" data-line-q="1" aria-label="Increase">${icon.plus}</button>
                  </div>
                  <button type="button" class="link-btn" data-remove>Remove</button>
                </div>
              </div>
              <div class="cart-line__price">${money(linePrice(l) * l.qty)}</div>
            </div>`;
          })
          .join('')}
        </div>
        ${
          upsells.length
            ? `<div class="upsell"><h3>Goes great with</h3><div class="upsell__row">${upsells
                .map((u) => `<button type="button" class="upsell__item" data-upsell="${u.id}"><strong>${esc(u.name)}</strong><span class="tnum">${money(u.price)}</span></button>`)
                .join('')}</div></div>`
            : ''
        }
        ${totalsHTML(false)}
      </div>
      <div class="drawer__foot">
        <button type="button" class="btn btn--chile btn--block" data-go="checkout" style="justify-content:space-between"><span>Checkout</span><span class="tnum">${money(totals().sub + totals().fee + totals().tax)}</span></button>
      </div>`;
    placePill(node.querySelector('[data-mode]'));
  }

  function placePill(seg) {
    if (!seg) return;
    const active = seg.querySelector('[aria-pressed="true"]');
    const pill = seg.querySelector('.segmented__pill');
    if (!active || !pill) return;
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.transform = `translateX(${active.offsetLeft - 4}px)`;
  }

  function renderCheckout() {
    const node = el.querySelector('[data-step="checkout"]');
    const s = cart.get();
    const status = openStatus();
    const slots = pickupSlots();
    node.innerHTML = `
      <form class="drawer__body" novalidate>
        <div class="form-section">
          <h3><span>1</span>Pickup time</h3>
          <div class="radio-cards">
            ${
              status.open
                ? `<label class="radio-card"><input type="radio" name="when" value="asap" checked><span class="opt__ctl"></span><span class="radio-card__text"><strong>As soon as possible</strong><small>Ready in about 20 minutes</small></span></label>`
                : ''
            }
            <label class="radio-card"><input type="radio" name="when" value="later" ${status.open ? '' : 'checked'}><span class="opt__ctl"></span><span class="radio-card__text"><strong>Schedule for later</strong><small>${status.open ? 'Pick a time that works' : esc(status.label)}</small></span></label>
          </div>
          <div class="card-fields ${status.open ? '' : 'is-open'}" data-later><div><div class="fields"><div class="field full">
            <label for="co-slot">Pickup time</label>
            <select id="co-slot" class="input" name="slot">${slots.map((x) => `<option value="${x.value}">${x.label}</option>`).join('')}</select>
          </div></div></div></div>
        </div>
        <div class="form-section">
          <h3><span>2</span>Your details</h3>
          <div class="fields">
            <div class="field"><label for="co-first">First name</label><input class="input" id="co-first" name="first" autocomplete="given-name" required><span class="err"></span></div>
            <div class="field"><label for="co-last">Last name</label><input class="input" id="co-last" name="last" autocomplete="family-name" required><span class="err"></span></div>
            <div class="field full"><label for="co-phone">Mobile number</label><input class="input" id="co-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(205) 555-0123" required><span class="err"></span></div>
            <div class="field full"><label for="co-email">Email for your receipt</label><input class="input" id="co-email" name="email" type="email" autocomplete="email" required><span class="err"></span></div>
            ${
              s.mode === 'curbside'
                ? `<div class="field full"><label for="co-car">Car make & color</label><input class="input" id="co-car" name="car" placeholder="Red Toyota Tacoma" required><span class="err"></span></div>`
                : ''
            }
          </div>
        </div>
        <div class="form-section">
          <h3><span>3</span>Add a tip</h3>
          <div class="tips">
            ${[0, 0.1, 0.15, 0.2]
              .map(
                (p) =>
                  `<button type="button" class="tip" data-tip="${p}" aria-pressed="${p === tipPct}">${p ? Math.round(p * 100) + '%' : 'No tip'}<small class="tnum">${p ? money(cart.subtotal() * p) : '—'}</small></button>`,
              )
              .join('')}
          </div>
          <p style="color:var(--ink-3);font-size:.86rem;margin-top:10px">100% of tips go to our kitchen and front-of-house team.</p>
        </div>
        <div class="form-section">
          <h3><span>4</span>Payment</h3>
          <div class="radio-cards">
            <label class="radio-card"><input type="radio" name="pay" value="card" checked><span class="opt__ctl"></span><span class="radio-card__text"><strong>Pay now with card</strong><small>Skip the line at the register</small></span></label>
            <label class="radio-card"><input type="radio" name="pay" value="store"><span class="opt__ctl"></span><span class="radio-card__text"><strong>Pay at pickup</strong><small>Cash or card in the restaurant</small></span></label>
          </div>
          <div class="card-fields is-open" data-card><div>
            <div class="fields">
              <div class="field full"><label for="co-cc">Card number</label><input class="input tnum" id="co-cc" name="cc" inputmode="numeric" autocomplete="off" placeholder="1234 1234 1234 1234" maxlength="19"><span class="err"></span></div>
              <div class="field"><label for="co-exp">Expiry</label><input class="input tnum" id="co-exp" name="exp" inputmode="numeric" autocomplete="off" placeholder="MM / YY" maxlength="7"><span class="err"></span></div>
              <div class="field"><label for="co-cvc">CVC</label><input class="input tnum" id="co-cvc" name="cvc" inputmode="numeric" autocomplete="off" placeholder="123" maxlength="4"><span class="err"></span></div>
            </div>
            <p class="secure-note">${icon.lock} Payments are encrypted and processed securely.</p>
          </div></div>
        </div>
        <div class="form-section" data-co-totals>${totalsHTML(true)}</div>
      </form>
      <div class="drawer__foot">
        <button type="button" class="btn btn--chile btn--block" data-place style="justify-content:space-between"><span>Place order</span><span class="tnum" data-co-grand>${money(totals().total)}</span></button>
      </div>`;
  }

  function refreshCheckoutTotals() {
    const node = el.querySelector('[data-step="checkout"]');
    node.querySelector('[data-co-totals]').innerHTML = totalsHTML(true);
    node.querySelector('[data-co-grand]').textContent = money(totals().total);
  }

  function validate(form) {
    let ok = true;
    const set = (name, msg) => {
      const input = form.elements[name];
      if (!input) return;
      input.classList.toggle('is-invalid', !!msg);
      const err = input.parentElement.querySelector('.err');
      if (err) err.textContent = msg || '';
      if (msg && ok) {
        input.focus({ preventScroll: true });
        input.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
        ok = false;
      }
    };
    const v = (n) => (form.elements[n]?.value || '').trim();
    set('first', v('first') ? '' : 'Please add your first name');
    set('last', v('last') ? '' : 'Please add your last name');
    set('phone', v('phone').replace(/\D/g, '').length >= 10 ? '' : 'We’ll text you when it’s ready');
    set('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')) ? '' : 'Enter a valid email');
    if (form.elements.car) set('car', v('car') ? '' : 'So we can find you');
    if (form.elements.pay.value === 'card') {
      set('cc', v('cc').replace(/\D/g, '').length >= 15 ? '' : 'Check your card number');
      set('exp', /^\d{2}\s?\/\s?\d{2}$/.test(v('exp')) ? '' : 'MM / YY');
      set('cvc', /^\d{3,4}$/.test(v('cvc')) ? '' : '3–4 digits');
    }
    return ok;
  }

  function renderDone(order) {
    const node = el.querySelector('[data-step="done"]');
    node.innerHTML = `
      <div class="confirm">
        <div class="confirm__check">${icon.check}</div>
        <h3><span class="serif">¡Gracias, ${esc(order.first)}!</span>We’re on it.</h3>
        <p class="confirm__lede">We sent a confirmation to <strong>${esc(order.email)}</strong> and we’ll text <strong>${esc(order.phone)}</strong> the moment your order is ready.</p>
        <div class="progress" aria-label="Order progress">
          <div class="progress__step is-active"><div class="progress__bar"><i></i></div>Received</div>
          <div class="progress__step"><div class="progress__bar"><i></i></div>In the kitchen</div>
          <div class="progress__step"><div class="progress__bar"><i></i></div>Ready</div>
        </div>
        <div class="ticket">
          <div class="ticket__row"><span>Order</span><strong class="tnum">#${order.number}</strong></div>
          <div class="ticket__row"><span>${order.mode === 'curbside' ? 'Curbside pickup' : 'Pickup'}</span><strong>${esc(order.when)}</strong></div>
          <div class="ticket__row"><span>Where</span><strong>${RESTAURANT.address}<br>${RESTAURANT.city}</strong></div>
          <div class="ticket__row"><span>${order.items} item${order.items > 1 ? 's' : ''}</span><strong class="tnum">${money(order.total)}${order.pay === 'store' ? ' · pay at pickup' : ' · paid'}</strong></div>
        </div>
        ${order.mode === 'curbside' ? '<p style="color:var(--ink-2);font-size:.95rem">Park in any spot out front and reply “here” to our text — we’ll bring it right out.</p>' : ''}
        <a class="btn btn--ghost btn--block" href="${RESTAURANT.mapsUrl}" target="_blank" rel="noopener">Get directions</a>
      </div>
      <div class="drawer__foot"><button type="button" class="btn btn--block" data-done>Done</button></div>`;
    if (!reduceMotion) {
      gsap.from(node.querySelector('.confirm__check'), { scale: 0.6, opacity: 0, duration: 0.6, ease: 'back.out(2)', delay: 0.25 });
      gsap.from(node.querySelectorAll('.confirm > *:not(.confirm__check)'), { y: 16, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06, delay: 0.35 });
    }
    const bars = node.querySelectorAll('.progress__bar i');
    const labels = node.querySelectorAll('.progress__step');
    const tl = gsap.timeline({ delay: 0.6 });
    tl.to(bars[0], { scaleX: 1, duration: 1.4, ease: 'power1.inOut' })
      .add(() => labels[1].classList.add('is-active'))
      .to(bars[1], { scaleX: 0.42, duration: 2.6, ease: 'power1.out' });
  }

  function go(next) {
    const idx = steps.indexOf(next);
    steps.forEach((s, i) => {
      el.querySelector(`[data-step="${s}"]`).dataset.pos = i < idx ? 'left' : i > idx ? 'right' : 'center';
    });
    step = next;
    el.querySelector('#drawer-title').textContent = titles[next];
    el.querySelector('.drawer__back').hidden = next !== 'checkout';
    const current = el.querySelector(`[data-step="${next}"]`);
    current.scrollTop = 0;
  }

  el.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('.drawer__close') || t.closest('[data-done]')) return api.close();
    if (t.closest('.drawer__back')) return go('cart');
    const browse = t.closest('a[href="./order.html"]');
    if (browse && location.pathname.endsWith('order.html')) {
      e.preventDefault();
      return api.close();
    }
    const modeBtn = t.closest('[data-mode-btn]');
    if (modeBtn) {
      cart.setMode(modeBtn.dataset.modeBtn);
      return;
    }
    const lineEl = t.closest('.cart-line');
    if (lineEl) {
      const key = lineEl.dataset.key;
      const line = cart.get().lines.find((l) => l.key === key);
      const q = t.closest('[data-line-q]');
      if (q && line) cart.setQty(key, line.qty + Number(q.dataset.lineQ));
      if (t.closest('[data-remove]')) {
        gsap.to(lineEl, { opacity: 0, x: 24, duration: 0.22, ease: 'power2.in', onComplete: () => cart.remove(key) });
      }
      return;
    }
    const up = t.closest('[data-upsell]');
    if (up) {
      const item = findItem(up.dataset.upsell);
      if (item.options?.length) {
        api.close();
        setTimeout(() => itemSheet.open(item.id), 200);
      } else {
        cart.add(item.id);
        toast(`${item.name} added`);
      }
      return;
    }
    if (t.closest('[data-go="checkout"]')) {
      renderCheckout();
      go('checkout');
      return;
    }
    const tip = t.closest('[data-tip]');
    if (tip) {
      tipPct = Number(tip.dataset.tip);
      el.querySelectorAll('[data-tip]').forEach((b) => b.setAttribute('aria-pressed', b === tip));
      refreshCheckoutTotals();
      return;
    }
    const place = t.closest('[data-place]');
    if (place) {
      const form = el.querySelector('[data-step="checkout"] form');
      if (!validate(form)) return;
      place.disabled = true;
      place.firstElementChild.textContent = 'Placing order…';
      const f = form.elements;
      const slotLabel = f.when.value === 'asap' ? `Today, ~${fmtTime(openStatus().minutes + 20 - ((openStatus().minutes + 20) % 5))}` : f.slot.selectedOptions[0]?.textContent;
      const order = {
        number: String(Math.floor(1000 + Math.random() * 8999)),
        first: f.first.value.trim(),
        email: f.email.value.trim(),
        phone: f.phone.value.trim(),
        when: slotLabel,
        pay: f.pay.value,
        mode: cart.get().mode,
        items: cart.count(),
        total: totals().total,
      };
      setTimeout(() => {
        renderDone(order);
        go('done');
        cart.clear();
        tipPct = 0.15;
      }, 1100);
    }
  });

  el.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'when') el.querySelector('[data-later]').classList.toggle('is-open', t.value === 'later');
    if (t.name === 'pay') el.querySelector('[data-card]').classList.toggle('is-open', t.value === 'card');
  });
  el.addEventListener('input', (e) => {
    const t = e.target;
    if (t.classList.contains('is-invalid')) {
      t.classList.remove('is-invalid');
      const err = t.parentElement.querySelector('.err');
      if (err) err.textContent = '';
    }
    if (t.name === 'cc') t.value = t.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
    if (t.name === 'exp') {
      const d = t.value.replace(/\D/g, '').slice(0, 4);
      t.value = d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
    }
    if (t.name === 'cvc') t.value = t.value.replace(/\D/g, '').slice(0, 4);
  });
  el.addEventListener('keydown', (e) => trapFocus(el, e));

  let lastSig = '';
  cart.subscribe((st) => {
    const sig = JSON.stringify(st.lines);
    if (step === 'cart' && sig === lastSig) {
      const seg = el.querySelector('[data-mode]');
      seg?.querySelectorAll('[data-mode-btn]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.modeBtn === st.mode));
      placePill(seg);
      return;
    }
    lastSig = sig;
    if (step === 'cart') renderCart();
    else if (step === 'checkout' && cart.count()) refreshCheckoutTotals();
  });

  const api = {
    open() {
      toastEl.classList.remove('is-visible');
      returnFocus = document.activeElement;
      if (step === 'done') go('cart');
      renderCart();
      go('cart');
      activeOverlay = api;
      lock();
      scrim.classList.add('is-open');
      el.classList.add('is-open');
      requestAnimationFrame(() => {
        placePill(el.querySelector('[data-mode]'));
        el.querySelector('.drawer__close').focus({ preventScroll: true });
      });
    },
    close() {
      el.classList.remove('is-open');
      scrim.classList.remove('is-open');
      activeOverlay = null;
      unlock();
      if (step === 'done') setTimeout(() => go('cart'), 500);
      returnFocus?.focus?.({ preventScroll: true });
    },
  };
  return api;
})();
export { drawer };

/* ------------------------------------------------------------------ header */
export function initHeader() {
  const header = document.querySelector('.site-header');
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 12);
    const hide = y > 400 && y > lastY + 4 && !document.body.classList.contains('is-locked');
    const show = y < lastY - 4 || y < 400;
    if (hide) {
      header.classList.add('is-hidden');
      document.body.classList.add('header-hidden');
    } else if (show) {
      header.classList.remove('is-hidden');
      document.body.classList.remove('header-hidden');
    }
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  document.querySelectorAll('[data-open-cart]').forEach((b) => b.addEventListener('click', () => drawer.open()));
  const counts = document.querySelectorAll('.cart-btn__count');
  cart.subscribe(() => {
    const n = cart.count();
    counts.forEach((c) => {
      c.textContent = n;
      c.classList.toggle('has-items', n > 0);
    });
  });

  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add]');
    if (!add) return;
    e.preventDefault();
    itemSheet.open(add.dataset.add, add);
  });

  document.querySelectorAll('[data-open-status]').forEach((el) => {
    const s = openStatus();
    el.textContent = s.label;
    el.classList.toggle('is-closed', !s.open);
  });
}

export { ALL_ITEMS, RESTAURANT };
