/* The roll — a tape printed with the studio's work.
   On the first visit a wolf pushes it along and it writes "HI" in tape.
   After that the roll follows the cursor and lays the tape down frame by frame.
   Drag to orbit the camera, [Space] rewinds the tape. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const BG = 0xcbcbcb;
const W = 1.6;                 // tape width (= roll width)
const R = 2.16;                // outer radius; circumference ≈ one full set of frames
const R_IN = 1.36, R_CORE = 1.28;
const DS = 0.06;               // tape sample spacing
const MAX = 6000;              // samples kept on the floor
const TEX_W = 4096, TEX_H = 480;
const CIRC = Math.PI * 2 * R;

const loadImg = (src, cors) => new Promise(res => {
  const im = new Image();
  if (cors) im.crossOrigin = 'anonymous';
  im.onload = () => res(im);
  im.onerror = () => res(null);
  im.src = src;
});

function coverDraw(ctx, img, x, y, w, h) {
  const r = Math.max(w / img.width, h / img.height);
  const sw = w / r, sh = h / r;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

function barcode(ctx, x, y, w, h) {
  let cx = x, i = 0;
  const pat = [1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1];
  while (cx < x + w) {
    const bw = pat[i % pat.length];
    if (i % 2 === 0) ctx.fillRect(cx, y, bw * 1.4, h);
    cx += bw * 1.4 + 1.4; i++;
  }
}

/* ---- the printed tape: one canvas, two textures (roll + floor) ---- */
function makeTape(cards) {
  const c = document.createElement('canvas');
  c.width = TEX_W; c.height = TEX_H;
  const ctx = c.getContext('2d');
  const mk = () => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  const texRoll = mk(), texFloor = mk();
  const cw = TEX_W / cards.length;
  const imgs = new Array(cards.length).fill(null);

  function draw() {
    ctx.fillStyle = '#f4f4f2';
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    cards.forEach((card, i) => {
      const x = i * cw, pad = 20;
      ctx.fillStyle = 'rgba(0,0,0,.10)';
      ctx.fillRect(x, 0, 1.5, TEX_H);
      ctx.fillStyle = '#111';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.font = '600 17px "Albert Sans", sans-serif';
      ctx.fillText('+  ' + card.title.toUpperCase().split('').join(' '), x + pad, 30);
      barcode(ctx, x + cw - pad - 58, 23, 58, 13);
      const ix = x + pad, iy = 54, iw = cw - pad * 2, ih = TEX_H - 54 - 62;
      const img = imgs[i];
      if (img) coverDraw(ctx, img, ix, iy, iw, ih);
      else {
        const cine = card.kind === 'cinematic';
        const g = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih);
        g.addColorStop(0, cine ? '#2a1714' : '#d9d9d6');
        g.addColorStop(1, cine ? '#0b0b0b' : '#bdbdb9');
        ctx.fillStyle = g; ctx.fillRect(ix, iy, iw, ih);
        ctx.fillStyle = cine ? 'rgba(255,255,255,.85)' : '#111';
        ctx.textAlign = 'center';
        ctx.font = '200 52px "Albert Sans", sans-serif';
        ctx.fillText(cine ? '▶' : card.title, ix + iw / 2, iy + ih / 2 - (cine ? 22 : 0));
        if (cine) { ctx.font = '500 20px "Albert Sans", sans-serif'; ctx.fillText(card.title.toUpperCase(), ix + iw / 2, iy + ih / 2 + 36); }
        ctx.textAlign = 'left';
      }
      ctx.fillStyle = '#111';
      ctx.font = '400 14px "Albert Sans", sans-serif';
      ctx.fillText(card.tags.map(t => '[' + t.toUpperCase() + ']').join(' '), x + pad, TEX_H - 30);
      ctx.font = '600 30px "Albert Sans", sans-serif';
      const num = String(i + 1).padStart(2, '0');
      const nw = ctx.measureText(num).width;
      ctx.fillText(num, x + cw - pad - nw, TEX_H - 30);
      ctx.fillStyle = card.kind === 'cinematic' ? '#e2402f' : '#7a4cff';
      const tx = x + cw - pad - nw - 24, ty = TEX_H - 30;
      ctx.beginPath(); ctx.moveTo(tx, ty + 10); ctx.lineTo(tx + 18, ty + 10); ctx.lineTo(tx + 18, ty - 12); ctx.closePath(); ctx.fill();
    });
    texRoll.needsUpdate = true;
    texFloor.needsUpdate = true;
  }

  draw();
  cards.forEach((card, i) => {
    if (card.img) loadImg(card.img).then(im => { if (im) { imgs[i] = im; draw(); } });
  });
  const setImage = (id, src) => {
    const i = cards.findIndex(c => c.id === id);
    if (i < 0) return;
    loadImg(src, true).then(im => {
      if (!im) return;
      imgs[i] = im;
      try { draw(); ctx.getImageData(0, 0, 1, 1); } catch (e) { imgs[i] = null; draw(); }
    });
  };
  document.fonts && document.fonts.ready.then(draw);
  return { texRoll, texFloor, setImage };
}

/* ---- side faces: wound tape layers ---- */
function makeSide() {
  const S = 1024, c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const k = (S / 2) / R;
  ctx.translate(S / 2, S / 2);
  ctx.fillStyle = '#b9b5ad';
  ctx.beginPath(); ctx.arc(0, 0, R_IN * k, 0, Math.PI * 2); ctx.fill();
  let r = R_IN * k, seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (r < S / 2) {
    const w = 1 + rnd() * 2.2;
    const v = 112 + Math.floor(rnd() * 70);
    ctx.strokeStyle = `rgb(${v},${v},${v})`;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(0, 0, r + w / 2, 0, Math.PI * 2); ctx.stroke();
    r += w;
  }
  for (let i = 0; i < 30000; i++) {
    const a = rnd() * Math.PI * 2, rr = (R_IN + rnd() * (R - R_IN)) * k;
    ctx.fillStyle = rnd() > .5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.12)';
    ctx.fillRect(Math.cos(a) * rr, Math.sin(a) * rr, 1.5, 1.5);
  }
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, 0, S / 2 - 3, 0, Math.PI * 2); ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ---- floor marks ---- */
function makeFloor() {
  const S = 2048, c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = 'rgba(0,0,0,.2)';
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.lineWidth = 1.2;
  let seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 34; i++) {
    const x = rnd() * S, y = rnd() * S, a = rnd() * Math.PI, L = 18 + rnd() * 110;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L, 0); ctx.moveTo(0, -L * .7); ctx.lineTo(0, L * .7); ctx.stroke();
    if (i % 3 === 0) { ctx.font = '500 13px "Albert Sans", sans-serif'; ctx.fillText('N O  R O L L .', 8, -8); }
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 7);
  return tex;
}

/* ---- "HI" (glyph units: x right, y up, cap height 2).
   [x, y, draw]: draw = 1 lays tape from this point to the next, 0 is a "pen-up" move where
   the roll travels between strokes without leaving tape. Four strokes: H left stem, crossbar,
   H right stem, I. The moves between them curve so the wolf never turns sharply. ---- */
const ROUTE = [
  [0.00, 2.05, 1], [0.00, 1.40, 1], [0.00, 0.70, 1], [0.00, 0.00, 0],          // H left stem, down
  [-0.30, 0.25, 0], [-0.30, 0.80, 0], [-0.10, 1.00, 1],                         // swing back up
  [0.40, 1.00, 1], [0.80, 1.00, 1], [1.30, 1.00, 0],                            // crossbar
  [1.62, 1.28, 0], [1.62, 2.22, 0], [1.40, 2.42, 0], [1.20, 2.05, 1],          // loop up over the top
  [1.20, 1.40, 1], [1.20, 0.70, 1], [1.20, 0.00, 0],                            // H right stem, down
  [1.42, -0.32, 0], [1.80, -0.20, 0], [1.92, 0.60, 0], [1.86, 1.80, 0],
  [1.96, 2.40, 0], [2.10, 2.32, 0], [2.15, 2.05, 1],                            // over to the top of the I
  [2.15, 1.40, 1], [2.15, 0.70, 1], [2.15, 0.00, 0],                            // I, down
  [2.30, -0.30, 0], [2.62, -0.06, 0], [2.80, 0.50, 0], [2.86, 0.95, 0],          // glide clear of the word
];
const WORD_W = 2.15, WORD_H = 2.05;   // the word itself (the exit glide sits outside it)

const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

export function createRoll(canvas, { cards, onPoints, onFps, onRewind, onIntroEnd, intro = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);

  // camera looks down at the floor from the front; distance adapts to the screen
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
  const CAM_DIR = new THREE.Vector3(0, 22, 20).normalize();
  const WORD_CENTER = new THREE.Vector3(-0.4, 0, -0.8);
  const look = WORD_CENTER.clone();
  let homeDist = 30, wordDist = 30, placed = false;

  const controls = new OrbitControls(camera, canvas);
  controls.enabled = true;            // orbit is always on: drag to look around, scroll to zoom
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 12; controls.maxDistance = 90;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.target.copy(look);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  const SUN_OFF = new THREE.Vector3(7, 16, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 60 });
  sun.shadow.radius = 5;
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);

  // floor layers, drawn in this order: marks → tape → shadow
  const floorMarks = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshBasicMaterial({ map: makeFloor(), transparent: true, depthWrite: false })
  );
  floorMarks.rotation.x = -Math.PI / 2;
  floorMarks.renderOrder = 0;
  scene.add(floorMarks);

  const tape = makeTape(cards);

  // ---- tape on the floor: a ribbon that grows behind the roll ----
  const pos = new Float32Array(MAX * 2 * 3);
  const uv = new Float32Array(MAX * 2 * 2);
  const idx = new Uint32Array((MAX - 1) * 6);
  for (let i = 0; i < MAX - 1; i++) {
    const a = i * 2;
    idx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6);
  }
  const ribbonGeo = new THREE.BufferGeometry();
  ribbonGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  ribbonGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2).setUsage(THREE.DynamicDrawUsage));
  ribbonGeo.setIndex(new THREE.BufferAttribute(idx, 1));
  ribbonGeo.setDrawRange(0, 0);
  const ribbon = new THREE.Mesh(ribbonGeo, new THREE.MeshBasicMaterial({ map: tape.texFloor, side: THREE.DoubleSide, depthWrite: false }));
  ribbon.frustumCulled = false;
  ribbon.renderOrder = 1;
  scene.add(ribbon);

  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.24, depthWrite: false }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.01;
  shadowCatcher.receiveShadow = true;
  shadowCatcher.renderOrder = 2;
  scene.add(shadowCatcher);

  // ---- the roll: root (position + heading) → spinner (rolling) → wheel ----
  const root = new THREE.Group();
  const spinner = new THREE.Group();
  const wheel = new THREE.Group();
  wheel.rotation.z = Math.PI / 2; // cylinder axis → local X
  const outer = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, W, 180, 1, true),
    new THREE.MeshStandardMaterial({ map: tape.texRoll, roughness: 0.62 })
  );
  outer.castShadow = true;
  wheel.add(outer);
  const sideMat = new THREE.MeshStandardMaterial({ map: makeSide(), roughness: 1, side: THREE.DoubleSide });
  [1, -1].forEach(s => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(R_CORE, R, 180, 1), sideMat);
    ring.rotation.x = -Math.PI / 2 * s;
    ring.position.y = W / 2 * s;
    ring.castShadow = true;
    wheel.add(ring);
  });
  wheel.add(new THREE.Mesh(
    new THREE.CylinderGeometry(R_CORE, R_CORE, W, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xa8a49c, roughness: 1, side: THREE.BackSide })
  ));
  spinner.add(wheel);
  root.add(spinner);
  root.renderOrder = 3;
  scene.add(root);

  // ---- state ----
  const p = new THREE.Vector2(0, 0);
  let heading = -2.5;                      // radians, 0 = +z (toward camera)
  let target = null;                       // floor point the cursor is over
  let laid = 0, acc = 0, n = 0;
  let rewinding = false, mode = 'home', visible = true;
  let tilt = 0;
  const samples = [];                      // {x, z, h, s}

  function writeSample(i, sm) {
    const nx = Math.cos(sm.h), nz = -Math.sin(sm.h);
    const o = i * 6;
    const hw = (sm.w ?? W) / 2;                        // w = 0 marks a break between strokes
    pos[o] = sm.x - nx * hw; pos[o + 1] = 0.004; pos[o + 2] = sm.z - nz * hw;
    pos[o + 3] = sm.x + nx * hw; pos[o + 4] = 0.004; pos[o + 5] = sm.z + nz * hw;
    const u = i * 4, s = -sm.s / CIRC;
    uv[u] = s; uv[u + 1] = 1; uv[u + 2] = s; uv[u + 3] = 0;
  }
  function flush() {
    ribbonGeo.attributes.position.needsUpdate = true;
    ribbonGeo.attributes.uv.needsUpdate = true;
    ribbonGeo.setDrawRange(0, Math.max(0, n - 1) * 6);
    onPoints && onPoints(n);
  }
  function push() {
    if (n >= MAX) {
      const drop = 1000;
      samples.splice(0, drop);
      n -= drop;
      samples.forEach((sm, i) => writeSample(i, sm));
    }
    const sm = { x: p.x, z: p.y, h: heading, s: laid, w: arguments[0] ?? W };
    samples.push(sm);
    writeSample(n, sm);
    n++;
  }
  function resetTape() { samples.length = 0; n = 0; laid = 0; acc = 0; push(); flush(); }

  // ---- the "HI" route ----
  const S = 5.4;
  const route = new THREE.CatmullRomCurve3(
    ROUTE.map(([x, y]) => new THREE.Vector3((x - WORD_W / 2) * S + WORD_CENTER.x, 0, -(y - WORD_H / 2) * S + WORD_CENTER.z)),
    false, 'centripetal'
  );
  const routeLen = route.getLength();
  // arc-length ranges where tape is laid
  const penRanges = (() => {
    const L = route.getLengths(4000), N = ROUTE.length - 1, out = [];
    const at = k => L[Math.round((k / N) * 4000)];
    ROUTE.forEach((pt, k) => { if (k < N && pt[2]) out.push([at(k), at(k + 1)]); });
    return out;
  })();
  const penDown = d => penRanges.some(([a, b]) => d >= a - 1e-6 && d <= b + 1e-6);
  let wasDown = true;
  const PUSH = R + 2.6;                  // roll centre → wolf centre, the wolf runs behind

  // intro state: 'wait' (model loading) → 'run' → 'exit' (wolf leaves) → null
  let introState = intro ? 'wait' : null;
  let introD = 0, introSpeed = 0, exitT = 0;
  const INTRO_PACE = 0.13;               // floor units per frame (~8 per second)
  const exitDir = new THREE.Vector3();

  if (introState) {
    const start = route.getPointAt(0), t0 = route.getTangentAt(0);
    p.set(start.x, start.z);
    heading = Math.atan2(t0.x, t0.z);
  }
  resetTape();

  // ---- the wolf: a keyed video run cycle on a camera-facing card ----
  // sprite sheet: 4×4 grid, 14 frames of 580×430, wolf facing left, feet on the bottom edge
  const WOLF_FRAMES = 14, WOLF_COLS = 4, WOLF_ROWS = 4, WOLF_FPS = 30;
  const WOLF_H = 4.4, WOLF_W = WOLF_H * 580 / 430;
  let wolf = null, wolfMat = null, wolfShadow = null, wolfFrame = 0, wolfFlip = 1, wolfHeading = heading;
  if (introState) {
    new THREE.TextureLoader().load(new URL('../img/wolf-run.webp', import.meta.url).href, tex => {
      if (introState !== 'wait') return;              // skipped while loading
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(1 / WOLF_COLS, 1 / WOLF_ROWS);
      tex.anisotropy = 4;
      wolfMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const g = new THREE.PlaneGeometry(WOLF_W, WOLF_H);
      g.translate(0, WOLF_H / 2 - 0.08, 0);
      wolf = new THREE.Mesh(g, wolfMat);
      wolf.renderOrder = 5;
      scene.add(wolf);
      // soft contact shadow
      const c = document.createElement('canvas'); c.width = c.height = 128;
      const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, 'rgba(0,0,0,.32)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
      wolfShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
      wolfShadow.rotation.x = -Math.PI / 2;
      wolfShadow.scale.set(WOLF_W * 0.8, WOLF_H * 0.45, 1);
      wolfShadow.position.y = 0.02;
      wolfShadow.renderOrder = 4;
      scene.add(wolfShadow);
      introState = 'run';
    }, undefined, () => endIntro());
  }

  function endIntro() {
    introState = null;
    if (wolf) { scene.remove(wolf, wolfShadow); wolf = null; }
    controls.target.copy(look);
    controls.enabled = true;
    onIntroEnd && onIntroEnd();
  }
  function skipIntro() {
    if (!introState) return;
    if (introState === 'wait') { endIntro(); return; }
    // fast-forward: lay the rest of the word instantly
    while (introD < routeLen) stepRoute(Math.min(DS, routeLen - introD));
    flush();
    beginExit();
  }
  function stepRoute(dd) {
    introD += dd;
    const t = Math.min(1, introD / routeLen);
    const q = route.getPointAt(t), tg = route.getTangentAt(t);
    p.set(q.x, q.z);
    heading = Math.atan2(tg.x, tg.z);
    laid += dd; acc += dd;
    const down = penDown(introD);
    if (down !== wasDown) {                         // zero-width samples = a clean cut in the tape
      if (down) { push(0); push(); } else { push(); push(0); }
      acc = 0; wasDown = down;
    }
    if (!down) { acc = 0; return; }
    while (acc >= DS) { acc -= DS; push(); }
  }
  function beginExit() {
    introState = 'exit';
    exitT = 0;
    const tg = route.getTangentAt(1);
    exitDir.set(tg.x, 0, tg.z).normalize();
  }
  // point on the route (or past its end) for the wolf
  const wolfAt = (d, out) => {
    if (d < 0) return out.copy(route.getPointAt(0)).addScaledVector(route.getTangentAt(0), d);
    if (d <= routeLen) return out.copy(route.getPointAt(d / routeLen));
    const end = route.getPointAt(1), tg = route.getTangentAt(1);
    return out.copy(end).addScaledVector(tg, d - routeLen);
  };

  // ---- pointer → floor ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  function aim(clientX, clientY) {
    if (mode !== 'home' || rewinding || introState) return;
    ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(floorPlane, hit)) {
      target = new THREE.Vector2(THREE.MathUtils.clamp(hit.x, -80, 80), THREE.MathUtils.clamp(hit.z, -80, 80));
    }
  }
  window.addEventListener('pointermove', e => aim(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerdown', e => { if (e.target === canvas) aim(e.clientX, e.clientY); }, { passive: true });

  function rewind() {
    if (n <= 1 || rewinding || mode !== 'home' || introState) return;
    rewinding = true;
    target = null;
    onRewind && onRewind(true);
  }

  function setMode(m) {
    mode = m;
    visible = m === 'home';
    canvas.style.opacity = visible ? '1' : '0';
    if (!visible) { target = null; skipIntro(); }
  }

  // camera distance so the whole word fits the screen (and never closer than home)
  function fitDist(width) {
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
    return (width / 2) / Math.tan(hHalf) * 1.18;
  }
  function fitHeight(depth) {
    // the floor is seen at an angle, so its depth shrinks on screen by the camera's elevation
    const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
    return (depth * CAM_DIR.y / 2) / Math.tan(vHalf) * 1.25;
  }
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 48 : w / h < 1.2 ? 38 : 30;
    camera.updateProjectionMatrix();
    wordDist = Math.max(30, fitDist(WORD_W * S + (w / h < 0.8 ? 3 : 10)), fitHeight(WORD_H * S + 6));
    // after the welcome the word stays in frame; on a plain visit the roll gets closer
    homeDist = w / h < 0.8 ? Math.max(30, fitDist(16)) : intro ? wordDist : 32;
    if (!placed) { camera.position.copy(look).addScaledVector(CAM_DIR, introState ? wordDist : homeDist); placed = true; }
    camera.lookAt(look);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- loop ----
  let last = performance.now(), frames = 0, fpsT = last, hidden = 0, settle = 0;
  const v3 = new THREE.Vector3(), v3b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  function tick(now) {
    requestAnimationFrame(tick);
    const dtMs = Math.min(50, now - last);
    const dt = dtMs / 16.67; last = now;
    frames++;
    if (now - fpsT > 500) { onFps && onFps(Math.round(frames * 1000 / (now - fpsT))); frames = 0; fpsT = now; }

    let turn = 0;
    if (introState === 'run') {
      // calm pace: ease in, slow down into the curves, glide to a stop at the end
      const t0 = introD / routeLen, t1 = Math.min(1, (introD + 3) / routeLen);
      const bend = route.getTangentAt(t0).angleTo(route.getTangentAt(t1));      // radians over the next 3 units
      const left = routeLen - introD;
      const want = INTRO_PACE * (1 - Math.min(0.55, bend * 0.45)) * Math.min(1, 0.25 + left / 9);
      introSpeed += (want - introSpeed) * Math.min(1, 0.03 * dt);
      const before = heading;
      stepRoute(Math.min(introSpeed * dt, routeLen - introD));
      turn = wrapAngle(heading - before);
      flush();
      if (introD >= routeLen - 1e-4) beginExit();
    } else if (introState === 'exit') {
      exitT += dtMs / 1000;
      const f = Math.max(0, 1 - exitT / 1.0);
      if (wolfMat) wolfMat.opacity = f;
      if (wolfShadow) wolfShadow.material.opacity = f;
      if (exitT > 1.2) { endIntro(); settle = 1; }
    } else if (rewinding) {
      const k = Math.max(1, Math.round(Math.min(40, 2 + n * 0.02) * dt));
      for (let i = 0; i < k && n > 1; i++) { samples.pop(); n--; }
      const sm = samples[n - 1];
      laid = sm.s; acc = 0;
      p.set(sm.x, sm.z);
      turn = wrapAngle(sm.h - heading);
      heading = sm.h;
      flush();
      if (n <= 1) { rewinding = false; onRewind && onRewind(false); }
    } else if (target && mode === 'home') {
      const dx = target.x - p.x, dz = target.y - p.y;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.35) {
        const diff = wrapAngle(Math.atan2(dx, dz) - heading);
        const speed = Math.min(dist * 0.045, 0.34) * dt;
        const step = speed * (0.25 + 0.75 * Math.max(0, Math.cos(diff)));
        const maxTurn = step / (W * 0.6) + 0.004 * dt;
        turn = THREE.MathUtils.clamp(diff * 0.14 * dt, -maxTurn, maxTurn);
        heading = wrapAngle(heading + turn);
        p.x += Math.sin(heading) * step;
        p.y += Math.cos(heading) * step;
        laid += step; acc += step;
        let added = false;
        while (acc >= DS) { acc -= DS; push(); added = true; }
        if (added) flush();
      }
    }

    // pose the roll
    root.position.set(p.x, R, p.y);
    root.rotation.y = heading;
    spinner.rotation.x = laid / R;
    tilt += (THREE.MathUtils.clamp(-turn * 6, -0.35, 0.35) - tilt) * 0.12 * dt;
    root.rotation.z = tilt;

    // the wolf runs behind the roll, pushing it along the route
    if (wolf) {
      if (introState === 'run') {
        // pushing: always right behind the roll, turning with it (smoothed)
        wolfHeading += wrapAngle(heading - wolfHeading) * Math.min(1, 0.09 * dt);
        const fx = Math.sin(wolfHeading), fz = Math.cos(wolfHeading);
        v3.set(p.x - fx * PUSH, 0, p.y - fz * PUSH);
        v3b.set(v3.x + fx, 0, v3.z + fz);
        wolf.position.copy(v3);
        // play the run cycle at the pace of the roll
        wolfFrame += (dtMs / 1000) * WOLF_FPS * THREE.MathUtils.clamp(introSpeed / 0.2, 0.3, 1);
      } else {
        // exit: slow to a stop where it stands, then fade
        wolfFrame += (dtMs / 1000) * WOLF_FPS * Math.max(0, 1 - exitT * 1.2);
        v3.copy(wolf.position); v3b.copy(v3).add(exitDir);
      }
      const fr = Math.floor(wolfFrame) % WOLF_FRAMES;
      wolfMat.map.offset.set((fr % WOLF_COLS) / WOLF_COLS, 1 - (Math.floor(fr / WOLF_COLS) + 1) / WOLF_ROWS);
      // face the camera (around Y only), mirrored to match the direction on screen
      wolf.rotation.y = Math.atan2(camera.position.x - wolf.position.x, camera.position.z - wolf.position.z);
      const sa = v3.clone().project(camera), sb = v3b.clone().project(camera);
      const dir = sb.x - sa.x;
      if (Math.abs(dir) > 0.002) wolfFlip = dir > 0 ? -1 : 1; // sprite faces left
      wolf.scale.x += (wolfFlip - wolf.scale.x) * Math.min(1, 0.35 * dt);
      wolfShadow.position.set(wolf.position.x, 0.02, wolf.position.z);
      wolfShadow.rotation.z = -wolf.rotation.y;
    }

    sun.position.set(p.x + SUN_OFF.x, SUN_OFF.y, p.y + SUN_OFF.z);
    sun.target.position.set(p.x, 0, p.y);

    controls.update();
    if (settle) {
      // on narrow screens, glide in toward the roll after the welcome
      if (homeDist !== wordDist) {
        look.lerp(v3.set(p.x, 0, p.y), 0.05 * dt);
        controls.target.copy(look);
        camera.position.lerp(v3b.copy(look).addScaledVector(CAM_DIR, homeDist), 0.05 * dt);
      }
      settle += dt;
      if (settle > 90) settle = 0;
    }

    hidden = visible ? 0 : hidden + 1;
    if (hidden < 60) renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);

  return { setMode, rewind, skipIntro, setImage: tape.setImage, isRewinding: () => rewinding, isIntro: () => !!introState };
}
