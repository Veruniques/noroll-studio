/* The fire dog.
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
