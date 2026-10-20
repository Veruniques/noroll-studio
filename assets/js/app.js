import { STUDIO, cinematic, design, info } from './data.js?v=20261020b';
import { runDogOnto, extinguish } from './fire.js?v=20261020b';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const STAR = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 0v14M0 7h14M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.2"/></svg>';

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
  list.innerHTML = items.map((w, i) => `
    <li data-i="${i}" style="${w.kind === 'info' ? '--accent:#111' : ''}">
      <button type="button" data-open-work="${w.id}">
        <span class="works__title">${STAR}${esc(w.title)}</span>
        <span class="works__tags">// ${w.tags.map(esc).join(' // ')}</span>
      </button>
    </li>`).join('');
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

function section(title, html) {
  return `<h3 class="work__h">${STAR}${esc(title)}</h3>${html}`;
}

function renderWork(side, id) {
  const items = LISTS[side];
  const i = items.findIndex(w => w.id === id);
  if (i < 0) return false;
  const w = items[i];
  const next = items[(i + 1) % items.length];
  countA.textContent = pad(i + 1);
  countB.textContent = pad(items.length);
  const nextBtn = `<button class="work__next" type="button" data-open-work="${next.id}"><span>Next</span><span>${esc(next.title)}</span></button>`;
  const head = (kicker, meta) => `
    <p class="work__kicker">${esc(kicker)}</p>
    <h2 class="work__title">${esc(w.title)}</h2>
    ${meta ? `<div class="work__meta">${meta}</div>` : ''}`;

  if (w.kind === 'cinematic') {
    work.innerHTML = `
      <div class="work__video"><iframe src="https://player.vimeo.com/video/${w.vimeo}?title=0&byline=0&portrait=0&dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="${esc(w.title)}"></iframe></div>
      <div class="work__body">
        ${head(w.tags.join(' · '), `<span><b>Client</b>${esc(w.client)}</span>${w.format ? `<span><b>Format</b>${esc(w.format)}</span>` : ''}${w.producedFor ? `<span><b>Produced for</b>${esc(w.producedFor)}</span>` : '<span><b>Director</b>Veronika Dominiková</span>'}`)}
        ${w.idea ? section('Idea', `<p class="work__text">${esc(w.idea)}</p>`) : section('About', `<p class="work__text">${esc(w.text)}</p>`)}
        ${w.role && w.role.length ? section('My role', `<ul class="work__list">${w.role.map(r => `<li>${esc(r)}</li>`).join('')}</ul>${w.credits ? `<p class="work__text">${esc(w.credits)}</p>` : ''}`) : ''}
        ${w.result ? section('Result', `<p class="work__text">${esc(w.result)}</p>`) : ''}
        ${w.tools && w.tools.length ? section('Tools', `<ul class="chips">${w.tools.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`) : ''}
        ${w.rights ? `<p class="work__rights">${esc(w.rights)}</p>` : ''}
        ${nextBtn}
      </div>`;
  } else if (w.kind === 'design') {
    work.innerHTML = `
      <div class="work__body">
        ${head(w.tags.join(' · '), `<span><b>Client</b>${esc(w.client)}</span>`)}
        ${section('About', `<p class="work__text">${esc(w.text)}</p>`)}
      </div>
      <div class="work__gallery">${w.images.map((src, k) => `<img src="${src}" alt="${esc(w.title)} — visual ${k + 1}" loading="${k < 2 ? 'eager' : 'lazy'}" decoding="async">`).join('')}</div>
      <div class="work__body">${nextBtn}</div>`;
  } else {
    work.innerHTML = `
      <div class="work__body">
        <p class="work__kicker">${esc(w.role)}</p>
        <h2 class="work__title">${esc(STUDIO.director)}</h2>
        <div class="work__meta"><span><b>Method</b>NO ROLL</span><span><b>Based</b>Czech Republic, works everywhere</span></div>
        ${section('About', w.intro.map(p => `<p class="work__text">${esc(p)}</p>`).join(''))}
        ${section('What I do', `<ul class="chips">${w.services.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`)}
        ${section('Pipeline', `<ul class="chips">${w.tools.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`)}
        ${section('Contact', `<div class="work__contact">
          <a href="mailto:${esc(STUDIO.email)}"><span>Email</span><span>${esc(STUDIO.email)}</span></a>
          <a href="${esc(STUDIO.linkedin)}" target="_blank" rel="noopener"><span>LinkedIn</span><span>${esc(STUDIO.director)} ↗</span></a>
        </div>`)}
        <img class="work__portrait" src="${esc(w.portrait)}" alt="${esc(STUDIO.director)}, AI film & campaign director" loading="lazy">
        ${nextBtn}
      </div>`;
  }
  return true;
}

/* ---------------- routing: ?view=cinematic|design&work=id ---------------- */
function readURL() {
  const q = new URLSearchParams(location.search);
  const view = ['cinematic', 'design'].includes(q.get('view')) ? q.get('view') : 'home';
  return { view, work: view === 'home' ? null : q.get('work') };
}

function apply({ view, work: id }, { fromNav } = {}) {
  document.body.dataset.view = view;
  if (view !== 'cinematic') extinguish();          // the fire only burns while you're in Cinematic
  roll && roll.setMode(view);
  if (view === 'home') {
    col.classList.remove('is-open', 'is-detail');
    setTimeout(() => { if (document.body.dataset.view === 'home') col.hidden = true; }, 760);
    return;
  }
  col.hidden = false;
  requestAnimationFrame(() => col.classList.add('is-open'));
  renderList(view);
  if (id && renderWork(view, id)) {
    col.classList.add('is-detail');
  } else {
    col.classList.remove('is-detail');
    work.innerHTML = '';
  }
  scroller.scrollTop = 0;
  if (fromNav) {
    const focusEl = col.classList.contains('is-detail') ? $('#back') : $('button', list);
    focusEl && focusEl.focus({ preventScroll: true });
  }
}

function go(view, id = null) {
  const url = view === 'home' ? location.pathname : `?view=${view}${id ? `&work=${encodeURIComponent(id)}` : ''}`;
  history.pushState(null, '', url);
  apply({ view, work: id }, { fromNav: true });
}

window.addEventListener('popstate', () => apply(readURL()));

document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) {
    e.preventDefault();
    // the Cinematic title: the fire dog runs in, leaps onto it and sets it alight, then we go
    if (nav.matches('.side-label--left') && document.body.dataset.view === 'home') {
      runDogOnto(nav.querySelector('.side-label__text') || nav).then(ran => { if (ran) go('cinematic'); });
      return;
    }
    go(nav.dataset.nav);
    return;
  }
  const open = e.target.closest('[data-open-work]');
  if (open) {
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

apply(readURL());
