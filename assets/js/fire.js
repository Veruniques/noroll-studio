/* Fire + the fire dog.
   igniteTitle(el): sets a title alight; it keeps burning until extinguish().
   dogStamp(anchor, { onSlam }): the chrome dog runs in from the right, sits on top of
   `anchor`, lifts a paw and slams it down. onSlam fires on the slam (that's when the
   case unfolds). Returns cancel(); cancelling also fires onSlam, so content never stays folded. */

// dog-run.webp: keyed from the green-screen render, 86 frames at 33 ms, plays once.
const DOG = {
  src: new URL('../img/dog-run.webp', import.meta.url).href,
  ratio: 606 / 400,   // width / height
  pawX: 0.167,        // where the slamming paw lands, as a share of the image width
  floor: 0.981,       // where the paws touch the ground, as a share of the image height
  run: 600,           // ms the dog is still running in
  slam: 1683,         // ms until the paw hits
  end: 2838,          // ms, last frame (paw back down, dog settled)
};

const ease = { out: t => 1 - Math.pow(1 - t, 3) };
const lerp = (a, b, t) => a + (b - a) * t;
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ---------------- fire on a title ---------------- */
let fire = null;

function maskPoints(el) {
  // sample the title's own glyphs so the flames grow out of the letters
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const c = document.createElement('canvas');
  c.width = Math.ceil(r.width); c.height = Math.ceil(r.height);
  const x = c.getContext('2d');
  x.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  x.textBaseline = 'alphabetic';
  const ls = parseFloat(cs.letterSpacing) || 0;
  const text = cs.textTransform === 'uppercase' ? el.textContent.trim().toUpperCase() : el.textContent.trim();
  const m = x.measureText(text);
  const base = (r.height + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  if ('letterSpacing' in x) x.letterSpacing = `${ls}px`;
  x.fillText(text, 0, base);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  const pts = [];
  for (let y = 0; y < c.height; y += 2) for (let i = 0; i < c.width; i += 2) {
    if (d[(y * c.width + i) * 4 + 3] > 128) pts.push([i, y]);
  }
  return { pts, rect: r };
}

export function igniteTitle(el) {
  extinguish();
  el.classList.add('is-burning');
  const { pts, rect } = maskPoints(el);
  if (!pts.length) return;
  const H = rect.height;
  const pad = H * 1.1;                                   // room above the letters for the flames
  const c = document.createElement('canvas');
  c.className = 'fire-canvas';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = rect.width + H, h = rect.height + pad;
  c.width = w * dpr; c.height = h * dpr;
  Object.assign(c.style, { left: `${rect.left - H / 2}px`, top: `${rect.top - pad}px`, width: `${w}px`, height: `${h}px` });
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);

  // flames grow from the top edge of each letter: one point per column of pixels
  const topOf = new Map();
  for (const [x, y] of pts) if (!topOf.has(x) || y < topOf.get(x)) topOf.set(x, y);
  const tops = [...topOf.entries()];
  const tongues = [];
  let last = performance.now(), born = last, raf = 0;

  // calm, graphic tongues: few at a time, slow, slim, brand orange
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const age = (now - born) / 1000;
    const rate = 30 * Math.min(1, age / 0.8);            // eases in, no burst
    if (Math.random() < rate * dt) {
      const [px, py] = tops[(Math.random() * tops.length) | 0];
      tongues.push({
        x: px + H / 2, y: py + pad + H * 0.04,
        life: 0, max: 1.1 + Math.random() * 0.9,
        hMax: H * (0.35 + Math.random() * 0.5),
        wd: H * (0.07 + Math.random() * 0.06),
        seed: Math.random() * 6.28,
      });
    }
    ctx.clearRect(0, 0, w, h);
    for (let i = tongues.length - 1; i >= 0; i--) {
      const t = tongues[i];
      t.life += dt;
      const k = t.life / t.max;
      if (k >= 1) { tongues.splice(i, 1); continue; }
      const grow = Math.sin(Math.PI * k);                // rise, then sink back
      const th = t.hMax * grow;
      const tw = t.wd * (0.6 + 0.4 * grow);
      const lean = Math.sin(now / 520 + t.seed) * H * 0.07 * grow;
      const g = ctx.createLinearGradient(0, t.y, 0, t.y - th);
      g.addColorStop(0, 'rgba(255, 196, 92, .85)');
      g.addColorStop(0.45, 'rgba(255, 87, 0, .75)');
      g.addColorStop(1, 'rgba(196, 30, 0, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(t.x - tw / 2, t.y);
      ctx.quadraticCurveTo(t.x - tw / 2, t.y - th * 0.55, t.x + lean, t.y - th);
      ctx.quadraticCurveTo(t.x + tw / 2, t.y - th * 0.55, t.x + tw / 2, t.y);
      ctx.closePath();
      ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  fire = { el, c, stop: () => cancelAnimationFrame(raf) };
}

export function extinguish() {
  if (!fire) return;
  const f = fire; fire = null;
  f.el.classList.remove('is-burning');
  f.c.style.opacity = '0';
  setTimeout(() => { f.stop(); f.c.remove(); }, 600);
}

export const isBurning = () => !!fire;

/* ---------------- the dog ---------------- */
let dogBlob = null;
// fetch once; every run gets a fresh object URL so the animation restarts from frame 0
export function preloadDog() {
  if (!dogBlob) dogBlob = fetch(DOG.src).then(r => (r.ok ? r.blob() : null)).catch(() => null);
  return dogBlob;
}

export function dogStamp(anchor, { onSlam } = {}) {
  let cancelled = false, slammed = false, raf = 0, dog = null, url = null;
  const timers = [];
  const slam = () => { if (!slammed) { slammed = true; onSlam && onSlam(); } };
  const remove = () => { if (dog) dog.remove(); if (url) URL.revokeObjectURL(url); dog = null; url = null; };
  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    slam();
    remove();
  };

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { cancel(); return cancel; }

  (async () => {
    const blob = await Promise.race([preloadDog(), wait(1500).then(() => null)]);
    if (cancelled) return;
    if (!blob) return cancel();
    url = URL.createObjectURL(blob);
    dog = new Image();
    dog.alt = ''; dog.className = 'fire-dog'; dog.decoding = 'sync';
    dog.src = url;
    try { await dog.decode(); } catch { return cancel(); }
    if (cancelled) return;

    const r0 = anchor.getBoundingClientRect();
    const w = Math.min(r0.width * 0.62, 440), h = w / DOG.ratio;
    Object.assign(dog.style, { width: `${w}px`, height: `${h}px` });
    const place = (x, y) => { dog.style.transform = `translate(${x}px, ${y}px)`; };
    const from = window.innerWidth + 20;
    document.body.appendChild(dog);

    const t0 = performance.now();
    (function step(now) {
      if (cancelled) return;
      const r = anchor.getBoundingClientRect();   // follow the tab while the column settles
      const finalX = r.left + r.width * 0.16 - DOG.pawX * w;
      const k = Math.min(1, (now - t0) / DOG.run);
      place(lerp(from, finalX, ease.out(k)), r.top - DOG.floor * h);
      raf = requestAnimationFrame(step);
    })(t0);

    timers.push(setTimeout(slam, DOG.slam));
    timers.push(setTimeout(() => {
      cancelAnimationFrame(raf);
      if (!dog) return;
      dog.style.transition = 'opacity .45s ease';
      dog.style.opacity = '0';
      timers.push(setTimeout(() => { cancelled = true; remove(); }, 480));
    }, DOG.end + 350));
  })();

  return cancel;
}
