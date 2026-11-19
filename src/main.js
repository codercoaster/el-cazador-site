import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CATEGORIES, FEATURED, findItem, RESTAURANT } from './menu.js';
import { initHeader, stars, money, imgSrc, icon, fmtTime, openStatus } from './shared.js';
import { renderPicado } from './picado.js';

gsap.registerPlugin(ScrollTrigger);

// Scroll reveals fire as soon as an element peeks into view, so nothing sits invisible
// at the bottom of a small screen.
const REVEAL = 'top 97%';

/* ------------------------------------------------------------------ content */
document.querySelectorAll('[data-stars]').forEach((el) => (el.outerHTML = stars(Number(el.dataset.stars))));
document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
document.querySelectorAll('[data-picado]').forEach(renderPicado);

const rail = document.querySelector('[data-favs-rail]');
rail.innerHTML = FEATURED.map((id, i) => {
  const item = findItem(id);
  const img = item.img || (id === 'f4' ? 'fajitas-platter' : 'tacos-spread');
  return `
    <article class="dish">
      <div class="dish__media">
        <img src="${imgSrc(img)}" alt="${item.name}" loading="lazy">
        <span class="dish__num tnum">0${i + 1}</span>
      </div>
      <div class="dish__body">
        <h3 class="dish__name">${item.name}</h3>
        <span class="dish__price tnum">${money(item.price)}</span>
        <p class="dish__desc">${item.desc}</p>
        <button type="button" class="btn btn--sm dish__add" data-add="${id}">${icon.plus} Add to order</button>
      </div>
    </article>`;
}).join('');

const lunch = CATEGORIES.find((c) => c.id === 'lunch').items;
document.querySelector('[data-lunch-list]').innerHTML = ['l9', 'l3', 'l10', 'l8', 'l4', 'l15']
  .map((id) => lunch.find((i) => i.id === id))
  .map(
    (i) => `
    <li class="menu-row" data-reveal>
      <h3>${i.name}</h3><span class="price tnum">${money(i.price)}</span>
      <p>${i.desc}</p>
    </li>`,
  )
  .join('');

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const today = openStatus().day;
document.querySelector('[data-hours]').innerHTML = [1, 2, 3, 4, 5, 6, 0]
  .map((d) => `<li class="${d === today ? 'is-today' : ''}"><span>${days[d]}</span><span>${fmtTime(RESTAURANT.hours[d][0])} – ${fmtTime(RESTAURANT.hours[d][1])}</span></li>`)
  .join('');

initHeader();

/* ------------------------------------------------------------------ motion */
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  // hero intro — lines rise from their masks, then supporting content fades up.
  // Starts paused and only plays once fonts + hero image are ready, so the first frame is final layout.
  gsap.set('.hero__img--a', { rotation: -4 }); // resting tilt (GSAP owns this transform)
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  tl.from('.hero__title .line > span', { yPercent: 110, duration: 1.2, stagger: 0.09 })
    .from('[data-hero-fade]', { y: 18, opacity: 0, duration: 0.9, stagger: 0.07 }, 0.25)
    .from('.hero__img--main', { clipPath: 'inset(100% 0 0 0 round 200px 200px 22px 22px)', duration: 1.3, ease: 'expo.inOut' }, 0)
    .from('.hero__img--main img', { scale: 1.25, duration: 1.8 }, 0)
    .from('.hero__img--a', { y: 60, opacity: 0, rotate: -12, duration: 1.1 }, 0.5)
    .from('.hero__img--b', { scale: 0.7, opacity: 0, duration: 1 }, 0.62)
    .from('.hero__sticker', { scale: 0.5, opacity: 0, rotate: -90, duration: 1.1, ease: 'back.out(1.6)' }, 0.75);
  tl.from('.site-header__bar', { y: -16, opacity: 0, duration: 0.9 }, 0.1);
  tl.progress(0); // apply the "from" states before revealing anything

  const heroImg = document.querySelector('.hero__img--main img');
  const imgReady = heroImg.complete ? Promise.resolve() : heroImg.decode().catch(() => {});
  const timeout = new Promise((r) => setTimeout(r, 1200));
  Promise.race([Promise.all([document.fonts.ready, imgReady]), timeout]).then(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('is-intro');
      tl.play();
    });
  });

  // layered parallax in hero
  gsap.utils.toArray('[data-parallax]').forEach((el) => {
    gsap.to(el, {
      yPercent: Number(el.dataset.parallax),
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  });

  // slow-spinning stickers
  gsap.utils.toArray('[data-spin]').forEach((el) => gsap.to(el, { rotate: 360, duration: 24, ease: 'none', repeat: -1 }));

  // marquee: endless loop at a constant speed (not affected by scroll)
  const track = document.querySelector('[data-marquee]');
  const group = track.querySelector('.marquee__group');
  track.appendChild(group.cloneNode(true));
  track.appendChild(group.cloneNode(true));
  gsap.to(track, { xPercent: -100 / 3, duration: 28, ease: 'none', repeat: -1 });

  // inner image parallax
  gsap.utils.toArray('[data-inner-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // section headings: words rise in
  gsap.utils.toArray('.section-head h2, .margs h2, .story__text h2, .visit h2, .lunch__card h2').forEach((h) => {
    gsap.from(h, { y: 24, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: h, start: REVEAL } });
  });

  // list rows + quotes
  ScrollTrigger.batch('[data-reveal]', {
    start: REVEAL,
    onEnter: (els) => gsap.from(els, { y: 20, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.06 }),
    once: true,
  });

  // margaritas: flavors pop in
  gsap.from('.flavor', { scale: 0.85, opacity: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.05, clearProps: 'transform,translate,scale,rotate', scrollTrigger: { trigger: '.flavors', start: REVEAL } });
  gsap.from('.margs__visual .frame', { clipPath: 'inset(30% 10% 30% 10% round 999px)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.margs__visual', start: REVEAL } });

  // count-up stats and rating
  gsap.utils.toArray('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    const suffix = el.textContent.includes('+') ? '+' : '';
    const o = { v: 0 };
    gsap.to(o, {
      v: end,
      duration: 1.6,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: REVEAL },
      onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString('en-US') + suffix),
    });
  });
  const rating = document.querySelector('[data-rating]');
  const r = { v: 0 };
  gsap.to(r, { v: RESTAURANT.rating, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: rating, start: REVEAL }, onUpdate: () => (rating.textContent = r.v.toFixed(1)) });
  gsap.from('.mention', { y: 12, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.04, clearProps: 'transform,translate,scale,rotate', scrollTrigger: { trigger: '.mentions', start: REVEAL } });

  // footer wordmark slides up
  gsap.from('.footer__word', { yPercent: 40, ease: 'none', scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
});

// favorites: pinned horizontal scroll on large screens, native swipe on touch
mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
  const viewport = document.querySelector('[data-favs]');
  viewport.classList.add('is-pinned');
  const distance = () => Math.max(0, rail.scrollWidth - window.innerWidth);
  // Pin once the whole card row (photo + text) is in view with a cushion below it.
  // If the row is taller than the viewport, pin with its top just under the edge instead.
  const CUSHION = 48;
  const pinStart = () => {
    const r = viewport.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const bottom = r.bottom + window.scrollY;
    return Math.min(bottom + CUSHION - window.innerHeight, top - 24);
  };
  const tween = gsap.to(rail, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '.favs',
      start: pinStart,
      end: () => `+=${distance()}`,
      pin: '.favs',
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  });
  gsap.from('.dish', { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: '.favs', start: 'top 70%' } });
  return () => {
    viewport.classList.remove('is-pinned');
    tween.scrollTrigger?.kill();
  };
});

// hero photos: the whole card grows on hover, the photo inside only a touch
mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
  const cards = [
    ['.hero__img--main', { scale: 1.03 }, { scale: 1 }],
    ['.hero__img--a', { scale: 1.06, rotation: 1 }, { scale: 1, rotation: -4 }],
    ['.hero__img--b', { scale: 1.08, rotation: 8 }, { scale: 1, rotation: 0 }],
    ['.hero__sticker', { scale: 1.08 }, { scale: 1 }],
  ];
  const ease = { duration: 0.7, ease: 'expo.out', overwrite: 'auto' };
  const offs = cards.map(([sel, on, off]) => {
    const el = document.querySelector(sel);
    const img = el.querySelector('img');
    const enter = () => {
      gsap.to(el, { ...on, ...ease });
      if (img) gsap.to(img, { scale: 1.02, ...ease });
    };
    const leave = () => {
      gsap.to(el, { ...off, ...ease });
      if (img) gsap.to(img, { scale: 1, ...ease });
    };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    return () => (el.removeEventListener('pointerenter', enter), el.removeEventListener('pointerleave', leave));
  });
  return () => offs.forEach((f) => f());
});

window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts.ready.then(() => ScrollTrigger.refresh());
let lastH = document.body.scrollHeight;
let refreshTimer;
new ResizeObserver(() => {
  const h = document.body.scrollHeight;
  if (Math.abs(h - lastH) < 4) return;
  lastH = h;
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
}).observe(document.body);
