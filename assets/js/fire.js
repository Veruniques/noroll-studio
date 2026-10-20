/* Fire + the fire dog.
   igniteTitle(el): sets a title alight; it keeps burning until extinguish().
   dogStamp(anchor, { onSlam }): the chrome dog runs in from the right, sits on top of
   `anchor`, lifts a paw and slams it down. onSlam fires on the slam (that's when the
   case unfolds). Returns cancel(); cancelling also fires onSlam, so content never stays folded. */

// dog-run.webp: keyed from the green-screen render, 63 frames at 33 ms, plays once.
const DOG = {
  src: new URL('../img/dog-run.webp', import.meta.url).href,
  ratio: 602 / 400,   // width / height
  pawX: 0.158,        // where the slamming paw lands, as a share of the image width
  floor: 0.981,       // where the paws touch the ground, as a share of the image height
  run: 600,           // ms the dog is still running in
  slam: 1716,         // ms until the paw hits
  end: 2079,          // ms, last frame
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
  const pad = H * 1.6;                                   // room above the letters for the flames
  const c = document.createElement('canvas');
  c.className = 'fire-canvas';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = rect.width + H, h = rect.height + pad;
  c.width = w * dpr; c.height = h * dpr;
  Object.assign(c.style, { left: `${rect.left - H / 2}px`, top: `${rect.top - pad}px`, width: `${w}px`, height: `${h}px` });
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);

  // bias spawn points toward the upper half of each letter
  const top = pts.filter(([, y]) => y < H * 0.42);
  const parts = [];
  let last = performance.now(), born = last, raf = 0;
  const S = H / 60;                                      // scale with the title size

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const age = (now - born) / 1000;
    // a burst when the dog lands, then a steady burn
    const rate = age < 0.5 ? 1100 : 520;
    let spawn = rate * dt;
    while (spawn-- > 0) {
      const src = Math.random() < 0.94 ? top : pts;
      const [px, py] = src[(Math.random() * src.length) | 0];
      parts.push({
        x: px + H / 2, y: py + pad,
        vx: (Math.random() - 0.5) * 18 * S,
        vy: -(70 + Math.random() * 120) * S * (age < 0.5 ? 1.4 : 1),
        life: 0, max: 0.4 + Math.random() * 0.55,
        r: (6 + Math.random() * 10) * S,
        seed: Math.random() * 6.28,
      });
    }
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      const k = p.life / p.max;
      if (k >= 1) { parts.splice(i, 1); continue; }
      const sway = Math.sin(now / 140 + p.seed + p.y * 0.04) * 22 * S;
      p.x += (p.vx + sway) * dt;
      p.y += p.vy * dt;
      p.vy *= 1.01;                                      // flames accelerate upward
      const rad = p.r * (1 - k * 0.75);
      // white-hot core → yellow → orange → deep red tips, readable on the orange page
      const col = k < 0.2 ? [255, 252, 230] : k < 0.45 ? [255, 222, 90] : k < 0.7 ? [255, 140, 20] : [170, 20, 0];
      const a = (k < 0.12 ? k / 0.12 : 1 - (k - 0.12) / 0.88) * 0.4;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, 1.9 + k * 1.2);                       // tongues, not dots
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${a})`);
      g.addColorStop(0.55, `rgba(${col[0]},${col[1]},${col[2]},${a * 0.45})`);
      g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
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
