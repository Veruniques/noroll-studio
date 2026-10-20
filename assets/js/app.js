import { STUDIO, cinematic, design, info } from './data.js?v=202610201342';
import { igniteTitle, extinguish, dogStamp, preloadDog } from './fire.js?v=202610201342';
import { esc, pad, listHTML, workHTML, pathFor, pageMeta } from './render.js?v=202610201342';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// Site root. Pages live at /, /cinematic/, /about/ and /work/<id>/, each with <base href> pointing at
// the root. Freeze it as an absolute URL so relative links keep working after pushState.
const baseEl = document.querySelector('base') || document.head.appendChild(document.createElement('base'));
const ROOT = new URL(baseEl.getAttribute('href') || './', location.href);
baseEl.href = ROOT.href;

const LISTS = {
  cinematic: [...cinematic.map(w => ({ ...w, kind: 'cinematic' })), { ...info, kind: 'info' }],
  design: [...design.map(w => ({ ...w, kind: 'design' })), { ...info, kind: 'info' }],
};
const LABEL = { cinematic: 'Cinematic', design: 'Design' };
const thumbs = {}; // vimeo id -> thumbnail url

/* ---------------- 3D roll (optional: page works without WebGL) ---------------- */
let roll = null;
// frames printed on the tape: cinematic and design, alternating
const designFrames = [
  { id: 'fameplay', title: 'Fameplay', tags: ['Branding', 'Key Visual'], img: 'assets/img/work/x-fameplay-humanoid.jpg' },
  { id: 'kurnik', title: 'Kurník Šopa', tags: ['Identity'], img: 'assets/img/work/x-kurnik-0.jpg' },
  { id: 'peaq', title: 'Beyond PEAQ', tags: ['Campaign'], img: 'assets/img/work/x-peaq-22.jpg' },
  { id: 'fameplay-2', title: 'Fameplay', tags: ['Campaign'], img: 'assets/img/work/x-fameplay-store.jpg' },
  { id: 'kurnik-2', title: 'Kurník Šopa', tags: ['Illustration'], img: 'assets/img/work/x-kurnik-40.jpg' },
  { id: 'studio', title: 'About', tags: ['Director'], img: 'assets/img/portrait-1.jpg' },
];
const rollCards = cinematic.flatMap((w, i) => [
  { id: w.id, title: w.title, tags: w.tags, kind: 'cinematic' },
  { ...designFrames[i], kind: 'design' },
]);
import('./roll.js')
  .then(({ createRoll }) => {
    roll = createRoll($('#scene'), {
      cards: rollCards,
      onRewind: on => { $('#hud-rewind-label').textContent = on ? 'Rewinding…' : 'Rewind'; },
    });
    roll.setMode(document.body.dataset.view);
    Object.entries(thumbs).forEach(([id, url]) => roll.setImage(id, url));
  })
  .catch(err => console.warn('3D scene unavailable', err))
  .finally(() => setTimeout(() => document.body.classList.add('is-loaded'), 500));

/* ---------------- View Works: bar near the bottom, a line otherwise ---------------- */
const vw = $('.view-works');
const scramble = (el, text) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let f = 0;
  clearInterval(el._t);
  el._t = setInterval(() => {
    f++;
    el.textContent = text.split('').map((c, i) => (c === ' ' || i < f / 2 ? c : chars[(Math.random() * chars.length) | 0])).join('');
    if (f / 2 >= text.length) { clearInterval(el._t); el.textContent = text; }
  }, 30);
};
let barOpen = true, barTimer = null;
function setBar(open) {
  if (open === barOpen) return;
  barOpen = open;
  vw.classList.toggle('is-line', !open);
  if (open) scramble(vw, 'View Works');
}
window.addEventListener('pointermove', e => {
  setBar(e.clientY > window.innerHeight * 0.78);
}, { passive: true });
barTimer = setTimeout(() => { if (barOpen) setBar(false); }, 3200);
scramble(vw, 'View Works');

/* ---------------- Vimeo thumbnails ---------------- */
cinematic.forEach(w => {
  fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent('https://vimeo.com/' + w.vimeo)}&width=1280`)
    .then(r => (r.ok ? r.json() : null))
    .then(j => {
      if (!j || !j.thumbnail_url) return;
      thumbs[w.id] = j.thumbnail_url;
      $$(`[data-thumb="${w.id}"]`).forEach(el => { el.style.backgroundImage = `url("${j.thumbnail_url}")`; });
      roll && roll.setImage(w.id, j.thumbnail_url);
    })
    .catch(() => {});
});

/* ---------------- film strips beside the column ---------------- */
const strips = {};
function buildStrip(side) {
  const items = LISTS[side].filter(w => w.kind !== 'info');
  const card = (w, i) => {
    const img = w.kind === 'cinematic' ? (thumbs[w.id] || '') : w.cover;
    return `<div class="card" style="--accent:${side === 'cinematic' ? 'var(--cine)' : 'var(--design)'}">
      <div class="card__top"><span>+ ${esc(w.title)}</span><span class="card__barcode"></span></div>
      <div class="card__img" data-thumb="${w.kind === 'cinematic' ? w.id : ''}" style="${img ? `background-image:url('${img}')` : ''}">${w.kind === 'cinematic' ? `<span>▶<br>${esc(w.title)}</span>` : ''}</div>
      <div class="card__bottom"><span>${w.tags.map(t => '[' + esc(t) + ']').join(' ')}</span><span class="card__num">${pad(i + 1)}</span></div>
    </div>`;
  };
  const set = items.map(card).join('');
  const track = $(`.strip--${side} .strip__track`);
  track.innerHTML = `<div class="strip__inner">${set}${set}${set}</div>`;
  strips[side] = { inner: track.firstElementChild, offset: 0, target: null, count: items.length };
}
buildStrip('cinematic');
buildStrip('design');

function stripTick() {
  const view = document.body.dataset.view;
  const s = strips[view];
  if (s) {
    const cards = s.inner.children;
    const setH = cards[s.count] ? cards[s.count].offsetTop - cards[0].offsetTop : 0;
    if (setH > 0) {
      if (s.target != null) {
        const want = cards[s.count + s.target].offsetTop - window.innerHeight * 0.35;
        s.offset += (want - s.offset) * 0.08;
      } else {
        s.offset += 0.6;
        if (s.offset > setH * 2) s.offset -= setH;
        if (s.offset < setH * 0.5) s.offset += setH;
      }
      s.inner.style.transform = `translate3d(0, ${-s.offset}px, 0)`;
    }
  }
  requestAnimationFrame(stripTick);
}
Object.values(strips).forEach(s => { s.offset = 900; });
requestAnimationFrame(stripTick);

/* ---------------- works column ---------------- */
const col = $('#column'), scroller = $('#column-scroll'), list = $('#works'), work = $('#work');
const countA = $('#count-a'), countB = $('#count-b');

function renderList(side) {
  const items = LISTS[side];
  // Design is no longer in the navigation: the header just names the list
  $('#column-switch').textContent = LABEL[side];
  $('#column-switch').removeAttribute('data-nav');
  $('#column-switch').setAttribute('aria-disabled', 'true');
  $('#column-switch').tabIndex = -1;
  countB.textContent = pad(items.length);
  countA.textContent = '01';
  list.style.setProperty('--accent', side === 'cinematic' ? 'var(--cine)' : 'var(--design)');
  list.innerHTML = listHTML(items, side);
  $$('li', list).forEach(li => {
    const i = +li.dataset.i;
    const enter = () => {
      countA.textContent = pad(i + 1);
      const s = strips[side];
      if (s && items[i].kind !== 'info') s.target = i;
    };
    const leave = () => { if (strips[side]) strips[side].target = null; };
    li.addEventListener('mouseenter', enter);
    li.addEventListener('focusin', enter);
    li.addEventListener('mouseleave', leave);
    li.addEventListener('focusout', leave);
  });
}

function renderWork(side, id, { folded = false } = {}) {
  const items = LISTS[side];
  const i = items.findIndex(w => w.id === id);
  if (i < 0) return null;
  const w = items[i];
  countA.textContent = pad(i + 1);
  countB.textContent = pad(items.length);
  const fold = folded && w.kind === 'cinematic';
  work.innerHTML = workHTML(w, { index: i, next: items[(i + 1) % items.length], side, studio: STUDIO, folded: fold });
  work.classList.toggle('is-folded', fold);
  return w;
}

/* ---------------- the dog stamps the case open ---------------- */
let stopStamp = null;
function unfold() {
  const tab = $('.work__tab', work);
  if (tab) {
    tab.classList.add('is-pressed');
    setTimeout(() => tab.classList.add('is-gone'), 160);
  }
  work.classList.remove('is-folded');
}
function stamp() {
  const tab = $('.work__tab', work);
  if (!tab) return;
  stopStamp = dogStamp(tab, { onSlam: unfold });
}
function cancelStamp() { if (stopStamp) { const s = stopStamp; stopStamp = null; s(); } }
// any interaction skips the animation (and unfolds straight away)
['wheel', 'touchstart', 'keydown'].forEach(t => window.addEventListener(t, () => { if (stopStamp && work.classList.contains('is-folded')) cancelStamp(); }, { passive: true }));

/* ---------------- page metadata follows the route ---------------- */
function setMeta(view, w) {
  const m = pageMeta({ view, w: w && w.kind !== 'design' ? w : null, studio: STUDIO, cinematic });
  document.title = m.title;
  const set = (sel, attr, val) => { const el = $(sel); if (el) el.setAttribute(attr, val); };
  set('meta[name="description"]', 'content', m.description);
  set('link[rel="canonical"]', 'href', m.url);
  set('meta[property="og:url"]', 'content', m.url);
  set('meta[property="og:title"]', 'content', m.title);
  set('meta[property="og:description"]', 'content', m.description);
}

/* ---------------- routing: ?view=cinematic|design&work=id ---------------- */
// renamed slugs: old links keep working
const ALIAS = { 'rb-cinema': 'raiffeisenbank-cinema-spot', 'rb-hybrid': 'raiffeisenbank-hybrid', 'fameplay-voice': 'fameplay-brand-voices', kofola: 'kofola-phteven' };
function readURL() {
  const r = readRawURL();
  return r.work && ALIAS[r.work] ? { ...r, work: ALIAS[r.work] } : r;
}
function readRawURL() {
  const q = new URLSearchParams(location.search);
  // old links: ?view=cinematic&work=monoprix
  if (q.get('view')) {
    const view = ['cinematic', 'design'].includes(q.get('view')) ? q.get('view') : 'home';
    return { view, work: view === 'home' ? null : q.get('work') };
  }
  let rel = location.pathname.startsWith(ROOT.pathname) ? location.pathname.slice(ROOT.pathname.length) : '';
  rel = decodeURIComponent(rel.replace(/index\.html$/, ''));
  const m = rel.match(/^work\/([^/]+)\/?$/);
  if (m) return { view: LISTS.cinematic.some(w => w.id === m[1]) ? 'cinematic' : 'design', work: m[1] };
  if (/^about\/?$/.test(rel)) return { view: 'cinematic', work: 'studio' };
  if (/^cinematic\/?$/.test(rel)) return { view: 'cinematic', work: null };
  return { view: 'home', work: null };
}

function apply({ view, work: id }, { fromNav } = {}) {
  cancelStamp();
  document.body.dataset.view = view;
  if (view !== 'cinematic') extinguish();          // the fire only burns while you're in Cinematic
  roll && roll.setMode(view);
  if (view === 'home') {
    setMeta('home');
    col.classList.remove('is-open', 'is-detail');
    setTimeout(() => { if (document.body.dataset.view === 'home') col.hidden = true; }, 760);
    return;
  }
  col.hidden = false;
  requestAnimationFrame(() => col.classList.add('is-open'));
  renderList(view);
  const w = id ? renderWork(view, id, { folded: fromNav }) : null;
  if (w) {
    col.classList.add('is-detail');
  } else {
    col.classList.remove('is-detail');
    work.innerHTML = '';
    work.classList.remove('is-folded');
  }
  setMeta(view, w);
  scroller.scrollTop = 0;
  if (w && work.classList.contains('is-folded')) stamp();
  if (fromNav) {
    const focusEl = col.classList.contains('is-detail') ? $('#back') : $('button', list);
    focusEl && focusEl.focus({ preventScroll: true });
  }
}

function go(view, id = null) {
  history.pushState(null, '', new URL(pathFor(view, id), ROOT).href);
  apply({ view, work: id }, { fromNav: true });
}

window.addEventListener('popstate', () => apply(readURL()));

document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) {
    e.preventDefault();
    // the Cinematic title catches fire and keeps burning while you're in Cinematic
    if (nav.matches('.side-label--left') && document.body.dataset.view === 'home') {
      igniteTitle(nav.querySelector('.side-label__text') || nav);
    }
    go(nav.dataset.nav);
    return;
  }
  const open = e.target.closest('[data-open-work]');
  if (open) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let "open in new tab" work
    e.preventDefault();
    const id = open.dataset.openWork;
    let view = document.body.dataset.view;
    if (view === 'home' || !LISTS[view].some(w => w.id === id)) {
      view = LISTS.cinematic.some(w => w.id === id) ? 'cinematic' : 'design';
    }
    go(view, id);
  }
  const key = e.target.closest('[data-key]');
  if (key && roll) roll.rewind();
});

$('#back').addEventListener('click', () => go(document.body.dataset.view));

document.addEventListener('keydown', e => {
  const view = document.body.dataset.view;
  if (e.key === 'Escape' && view !== 'home') {
    if (col.classList.contains('is-detail')) go(view); else go('home');
    return;
  }
  if (view !== 'home' || !roll) return;
  const idle = document.activeElement === document.body || document.activeElement === $('#scene');
  if (e.key === ' ' && idle) { e.preventDefault(); roll.rewind(); }
});

// tidy old ?view= links into the new addresses
{
  const first = readURL();
  if (location.search.includes('view=') && first.view === 'cinematic') history.replaceState(null, '', new URL(pathFor(first.view, first.work), ROOT).href);
  apply(first);
}
// fetch the dog once the page is idle, so the first case opens without waiting
(window.requestIdleCallback || (f => setTimeout(f, 1500)))(() => preloadDog());
