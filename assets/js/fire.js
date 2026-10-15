/* The fire dog: runs in from the left, leaps onto a title and sets it alight.
   runDogOnto(titleEl) resolves once the dog has landed and the fire has caught;
   the fire keeps burning until extinguish() is called. */

const DOG_SRC = new URL('../img/dog-fire.webp', import.meta.url).href;
const DOG_RATIO = 900 / 781;          // image width / height, dog faces right

const ease = {
  inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  out: t => 1 - Math.pow(1 - t, 3),
};
const lerp = (a, b, t) => a + (b - a) * t;
const wait = ms => new Promise(r => setTimeout(r, ms));

// preload so the first click doesn't wait on the network
const dogImg = new Image();
dogImg.src = DOG_SRC;
const dogReady = dogImg.decode ? dogImg.decode().catch(() => {}) : Promise.resolve();

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

function ignite(el) {
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
let busy = false;

export async function runDogOnto(titleEl) {
  if (busy) return false;
  busy = true;
  await dogReady;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tr = titleEl.getBoundingClientRect();
  const fs = parseFloat(getComputedStyle(titleEl).fontSize);
  const vw = window.innerWidth, vh = window.innerHeight;

  if (reduce) { ignite(titleEl); busy = false; return true; }

  const dogH = Math.max(110, Math.min(fs * 3.1, vh * 0.3));
  const dogW = dogH * DOG_RATIO;
  const dog = document.createElement('img');
  dog.src = DOG_SRC; dog.alt = ''; dog.className = 'fire-dog';
  Object.assign(dog.style, { width: `${dogW}px`, height: `${dogH}px` });
  document.body.appendChild(dog);

  // positions are the dog's bottom-centre (its paws)
  const start = { x: -dogW * 0.7, y: vh * 0.42 };
  const land = { x: tr.left + Math.min(tr.width * 0.42, dogW * 0.75), y: tr.top + fs * 0.16 };
  const take = { x: land.x - dogW * 0.55, y: Math.min(land.y - fs * 0.6, vh * 0.72) };
  const place = (x, y, rot = 0, sx = 1, sy = 1) => {
    dog.style.transform = `translate(${x - dogW / 2}px, ${y - dogH}px) rotate(${rot}deg) scale(${sx}, ${sy})`;
  };

  const RUN = 900, LEAP = 520;
  await new Promise(resolve => {
    const t0 = performance.now();
    (function step(now) {
      const t = now - t0;
      if (t < RUN) {
        // gallop: forward with a bound every ~300 ms
        const k = ease.inOut(t / RUN);
        const phase = (t / 300) * Math.PI;
        const bound = Math.abs(Math.sin(phase)) * dogH * 0.1;
        place(lerp(start.x, take.x, k), lerp(start.y, take.y, k) - bound,
          Math.sin(phase * 2) * 4 + 6, 1 + Math.sin(phase * 2) * 0.02, 1 - Math.sin(phase * 2) * 0.03);
        requestAnimationFrame(step);
      } else if (t < RUN + LEAP) {
        // the leap: a clean arc onto the letters
        const k = (t - RUN) / LEAP;
        const arc = Math.sin(k * Math.PI) * dogH * 0.55;
        place(lerp(take.x, land.x, ease.out(k)), lerp(take.y, land.y, k) - arc, lerp(-14, 8, k));
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    })(t0);
  });

  // landing: squash, catch fire
  ignite(titleEl);
  dog.animate([
    { transform: dog.style.transform.replace(/scale\([^)]*\)/, 'scale(1.06, .9)') },
    { transform: dog.style.transform.replace(/scale\([^)]*\)/, 'scale(1, 1)') },
  ], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
  place(land.x, land.y, 0);
  await wait(900);
  dog.style.transition = 'opacity .45s ease, transform .45s ease';
  dog.style.opacity = '0';
  place(land.x + dogW * 0.25, land.y - dogH * 0.15, -8);
  setTimeout(() => dog.remove(), 500);
  busy = false;
  return true;
}
