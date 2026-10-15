/* The roll — a 3D tape of the studio's work, printed on the outside.
   Drag to spin it, click it for points, [Tab] to orbit, [Space] to rewind. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const BG = 0xcbcbcb;
const R_OUT = 1.5, R_IN = 0.93, R_CORE = 0.86, BAND_H = 1.62;
const TEX_W = 4096, TEX_H = 704;

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
    if (i % 2 === 0) ctx.fillRect(cx, y, bw * 1.6, h);
    cx += bw * 1.6 + 1.6; i++;
  }
}

/* ---- printed outer band ---- */
function makeBand(cards) {
  const c = document.createElement('canvas');
  c.width = TEX_W; c.height = TEX_H;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 8;

  const cw = TEX_W / cards.length;
  const imgs = new Array(cards.length).fill(null);

  function draw() {
    ctx.fillStyle = '#f3f3f1';
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    cards.forEach((card, i) => {
      const x = i * cw, pad = 26;
      // edge stitching
      ctx.fillStyle = 'rgba(0,0,0,.08)';
      ctx.fillRect(x, 0, 2, TEX_H);
      ctx.fillStyle = '#111';
      ctx.font = '600 22px "Albert Sans", sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('+  ' + card.title.toUpperCase().split('').join(' '), x + pad, 46);
      barcode(ctx, x + cw - pad - 70, 38, 70, 16);
      const ix = x + pad, iy = 76, iw = cw - pad * 2, ih = TEX_H - 76 - 96;
      const img = imgs[i];
      if (img) coverDraw(ctx, img, ix, iy, iw, ih);
      else {
        const g = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih);
        g.addColorStop(0, card.kind === 'cinematic' ? '#2a1714' : '#d9d9d6');
        g.addColorStop(1, card.kind === 'cinematic' ? '#0b0b0b' : '#bdbdb9');
        ctx.fillStyle = g; ctx.fillRect(ix, iy, iw, ih);
        ctx.fillStyle = card.kind === 'cinematic' ? 'rgba(255,255,255,.85)' : '#111';
        ctx.font = '200 64px "Albert Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(card.kind === 'cinematic' ? '▶' : card.title, ix + iw / 2, iy + ih / 2 - (card.kind === 'cinematic' ? 30 : 0));
        if (card.kind === 'cinematic') { ctx.font = '500 26px "Albert Sans", sans-serif'; ctx.fillText(card.title.toUpperCase(), ix + iw / 2, iy + ih / 2 + 50); }
        ctx.textAlign = 'left';
      }
      // tags + index
      ctx.fillStyle = '#111';
      ctx.font = '400 17px "Albert Sans", sans-serif';
      ctx.fillText(card.tags.map(t => '[' + t.toUpperCase() + ']').join(' '), x + pad, TEX_H - 48);
      ctx.font = '600 38px "Albert Sans", sans-serif';
      const num = String(i + 1).padStart(2, '0');
      const nw = ctx.measureText(num).width;
      ctx.fillText(num, x + cw - pad - nw, TEX_H - 48);
      ctx.fillStyle = card.kind === 'cinematic' ? '#e2402f' : '#7a4cff';
      ctx.beginPath();
      const tx = x + cw - pad - nw - 30, ty = TEX_H - 48;
      ctx.moveTo(tx, ty + 12); ctx.lineTo(tx + 22, ty + 12); ctx.lineTo(tx + 22, ty - 14); ctx.closePath(); ctx.fill();
    });
    tex.needsUpdate = true;
  }

  draw();
  cards.forEach((card, i) => {
    if (!card.img) return;
    loadImg(card.img, card.cors).then(im => { if (im) { imgs[i] = im; draw(); } });
  });
  const setImage = (id, src) => {
    const i = cards.findIndex(c => c.id === id);
    if (i < 0) return;
    loadImg(src, true).then(im => { if (im) { imgs[i] = im; try { draw(); } catch (e) { imgs[i] = null; draw(); } } });
  };
  document.fonts && document.fonts.ready.then(draw);
  return { tex, setImage };
}

/* ---- side faces: wound tape layers ---- */
function makeSide() {
  const S = 1024, c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d');
  const k = (S / 2) / R_OUT;
  ctx.translate(S / 2, S / 2);
  // core (cardboard)
  ctx.fillStyle = '#b9b5ad';
  ctx.beginPath(); ctx.arc(0, 0, R_IN * k, 0, Math.PI * 2); ctx.fill();
  // tape layers
  let r = R_IN * k;
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (r < S / 2) {
    const w = 1.2 + rnd() * 2.4;
    const v = 118 + Math.floor(rnd() * 64);
    ctx.strokeStyle = `rgb(${v},${v},${v})`;
    ctx.lineWidth = w;
    ctx.beginPath(); ctx.arc(0, 0, r + w / 2, 0, Math.PI * 2); ctx.stroke();
    r += w;
  }
  // grain
  for (let i = 0; i < 26000; i++) {
    const a = rnd() * Math.PI * 2, rr = (R_IN + rnd() * (R_OUT - R_IN)) * k;
    ctx.fillStyle = rnd() > .5 ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.12)';
    ctx.fillRect(Math.cos(a) * rr, Math.sin(a) * rr, 1.5, 1.5);
  }
  // outer edge darker
  ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 6;
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
  ctx.strokeStyle = 'rgba(0,0,0,.22)';
  ctx.fillStyle = 'rgba(0,0,0,.32)';
  ctx.lineWidth = 1.2;
  let seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 34; i++) {
    const x = rnd() * S, y = rnd() * S, a = rnd() * Math.PI, L = 20 + rnd() * 120;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(L, 0); ctx.moveTo(0, -L * .7); ctx.lineTo(0, L * .7); ctx.stroke();
    if (i % 3 === 0) { ctx.font = '500 13px "Albert Sans", sans-serif'; ctx.fillText('N O  R O L L .', 8, -8); }
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function createRoll(canvas, { cards, onPoints, onFps, onOrbit }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  const CAM_HOME = new THREE.Vector3(0, 8.6, 9.2);
  const LOOK = new THREE.Vector3(0, 0.9, 0);
  camera.position.copy(CAM_HOME);
  camera.lookAt(LOOK);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(LOOK);
  controls.enabled = false;
  controls.enableDamping = true;
  controls.minDistance = 6; controls.maxDistance = 22;
  controls.maxPolarAngle = Math.PI * 0.48;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.55));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(4.5, 10, 3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
  sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  // floor: marks (unlit) + shadow catcher
  const floorMarks = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ map: makeFloor(), transparent: true, depthWrite: false })
  );
  floorMarks.rotation.x = -Math.PI / 2;
  scene.add(floorMarks);
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.26 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.002;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  // the roll
  const band = makeBand(cards);
  const roll = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.CylinderGeometry(R_OUT, R_OUT, BAND_H, 160, 1, true),
    new THREE.MeshStandardMaterial({ map: band.tex, roughness: 0.62, metalness: 0 })
  );
  outer.castShadow = true;
  roll.add(outer);
  const sideTex = makeSide();
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 1, side: THREE.DoubleSide });
  [1, -1].forEach(s => {
    const ring = new THREE.Mesh(new THREE.RingGeometry(R_CORE, R_OUT, 160, 1), sideMat);
    ring.rotation.x = -Math.PI / 2 * s;
    ring.position.y = BAND_H / 2 * s;
    ring.castShadow = true;
    roll.add(ring);
  });
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(R_CORE, R_CORE, BAND_H, 96, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xa8a49c, roughness: 1, side: THREE.BackSide })
  );
  roll.add(core);

  // holder sets the pose, roll spins inside it
  const holder = new THREE.Group();
  holder.add(roll);
  const BASE = [1.25, 0, 0.75];
  holder.rotation.set(BASE[0], BASE[1], BASE[2]);
  scene.add(holder);
  const pose = { x: 0, y: 2.0, z: 0.2 };
  holder.position.set(pose.x, pose.y, pose.z);

  // ---- state ----
  let spin = 0, spinVel = 0.0042, baseVel = 0.0042;
  let tilt = { x: 0, y: 0 }, tiltVel = { x: 0, y: 0 };
  let points = 0, mode = 'home', target = { ...pose }, orbit = false;
  let mouse = { x: 0, y: 0 };

  // ---- interaction ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let drag = null;
  canvas.addEventListener('pointerdown', e => {
    if (orbit) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', e => {
    mouse.x = e.clientX / window.innerWidth - 0.5;
    mouse.y = e.clientY / window.innerHeight - 0.5;
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    spinVel += dx * 0.0009;
    tiltVel.x += dy * 0.0004;
    drag.x = e.clientX; drag.y = e.clientY;
  });
  const end = e => {
    if (!drag) return;
    canvas.classList.remove('is-dragging');
    if (drag.moved < 6) {
      ndc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      if (ray.intersectObject(roll, true).length) {
        spinVel += 0.12;
        addPoints(1 + Math.floor(Math.random() * 9));
      }
    }
    drag = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  function addPoints(n) {
    points += n;
    onPoints && onPoints(points);
  }

  function rewind() {
    spinVel = -0.42;
    addPoints(10);
  }

  function toggleOrbit(force) {
    orbit = typeof force === 'boolean' ? force : !orbit;
    controls.enabled = orbit;
    canvas.style.cursor = orbit ? 'move' : '';
    onOrbit && onOrbit(orbit);
  }

  function setMode(m) {
    mode = m;
    const away = window.innerWidth < 820 ? 0 : 15;
    if (m === 'home') target = { ...pose };
    else if (m === 'cinematic') target = { x: -away, y: pose.y + 3, z: pose.z - 3 };
    else target = { x: away, y: pose.y + 3, z: pose.z - 3 };
    if (m !== 'home' && orbit) toggleOrbit(false);
    if (m !== 'home') spinVel = m === 'cinematic' ? -0.18 : 0.18; // unroll toward its side
  }

  // ---- size ----
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the roll comfortably sized on narrow screens
    camera.fov = w / h < 0.8 ? 52 : w / h < 1.2 ? 40 : 32;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- loop ----
  let last = performance.now(), frames = 0, fpsT = last, running = true;
  const camBase = CAM_HOME.clone();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(64, now - last) / 16.67; last = now;
    frames++;
    if (now - fpsT > 500) { onFps && onFps(Math.round(frames * 1000 / (now - fpsT))); frames = 0; fpsT = now; }

    // physics
    spinVel += (baseVel - spinVel) * 0.035 * dt;
    spin += spinVel * dt;
    roll.rotation.y = spin;
    tiltVel.x *= Math.pow(0.9, dt);
    tilt.x += tiltVel.x * dt;
    tilt.x += (0 - tilt.x) * 0.02 * dt;
    holder.rotation.x = BASE[0] + tilt.x;
    holder.position.x += (target.x - holder.position.x) * 0.06 * dt;
    holder.position.z += (target.z - holder.position.z) * 0.06 * dt;
    const bob = mode === 'home' ? Math.sin(now / 1400) * 0.06 : 0;
    holder.position.y += (target.y + bob - holder.position.y) * 0.06 * dt;

    if (orbit) controls.update();
    else {
      // gentle parallax, ease back from any orbit
      const want = camBase.clone().add(new THREE.Vector3(mouse.x * 0.8, -mouse.y * 0.4, 0));
      camera.position.lerp(want, 0.04 * dt);
      controls.target.lerp(LOOK, 0.08 * dt);
      camera.lookAt(controls.target);
    }

    // skip rendering when the roll is off-screen behind the works column
    const offscreen = mode !== 'home' && Math.abs(holder.position.x - target.x) < 0.05 && target.x !== 0;
    if (!offscreen || running) renderer.render(scene, camera);
    running = !offscreen;
  }
  requestAnimationFrame(tick);

  return { setMode, rewind, toggleOrbit, setImage: band.setImage, isOrbit: () => orbit };
}
