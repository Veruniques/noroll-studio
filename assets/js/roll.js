/* The roll — a tape printed with the studio's work.
   It rolls after the cursor and lays the tape down on the floor, frame by frame.
   Points = tape laid. [Tab] orbits the camera, [Space] rewinds the tape. */
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

const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

export function createRoll(canvas, { cards, onPoints, onFps, onOrbit, onRewind }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
  const CAM_HOME = new THREE.Vector3(0, 16, 14.5);
  const LOOK = new THREE.Vector3(0, 0, 0.6);
  camera.position.copy(CAM_HOME);
  camera.lookAt(LOOK);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(LOOK);
  controls.enabled = false;
  controls.enableDamping = true;
  controls.minDistance = 10; controls.maxDistance = 60;
  controls.maxPolarAngle = Math.PI * 0.47;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  const SUN_OFF = new THREE.Vector3(7, 16, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 50 });
  sun.shadow.radius = 5;
  sun.shadow.bias = -0.0006;
  scene.add(sun, sun.target);

  // floor layers, drawn in this order: marks → tape → shadow
  const floorMarks = new THREE.Mesh(
    new THREE.PlaneGeometry(160, 160),
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

  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShadowMaterial({ opacity: 0.24, depthWrite: false }));
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
  const p = new THREE.Vector2(0, 0);       // floor position (x, z)
  let heading = -2.5;                      // radians, 0 = +z (toward camera)
  let target = null;                       // floor point the cursor is over
  let laid = 0;                            // total tape length laid
  let acc = 0;
  let n = 0;                               // samples on the floor
  let rewinding = false, orbit = false, mode = 'home', visible = true;
  let tilt = 0;                            // lean into turns
  const samples = [];                      // {x, z, h, s}

  function writeSample(i, sm) {
    const nx = Math.cos(sm.h), nz = -Math.sin(sm.h); // right-hand normal
    const o = i * 6;
    pos[o] = sm.x - nx * W / 2; pos[o + 1] = 0.004; pos[o + 2] = sm.z - nz * W / 2;
    pos[o + 3] = sm.x + nx * W / 2; pos[o + 4] = 0.004; pos[o + 5] = sm.z + nz * W / 2;
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
    if (n >= MAX) { // keep the newest tape
      const drop = 1000;
      samples.splice(0, drop);
      n -= drop;
      samples.forEach((sm, i) => writeSample(i, sm));
    }
    const sm = { x: p.x, z: p.y, h: heading, s: laid };
    samples.push(sm);
    writeSample(n, sm);
    n++;
  }
  push(); flush();

  // ---- pointer → floor ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  function aim(clientX, clientY) {
    if (mode !== 'home' || rewinding) return;
    ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(floorPlane, hit)) {
      target = new THREE.Vector2(THREE.MathUtils.clamp(hit.x, -60, 60), THREE.MathUtils.clamp(hit.z, -60, 60));
    }
  }
  window.addEventListener('pointermove', e => aim(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerdown', e => { if (e.target === canvas) aim(e.clientX, e.clientY); }, { passive: true });

  function rewind() {
    if (n <= 1 || rewinding || mode !== 'home') return;
    rewinding = true;
    target = null;
    onRewind && onRewind(true);
  }

  function toggleOrbit(force) {
    orbit = typeof force === 'boolean' ? force : !orbit;
    controls.enabled = orbit;
    onOrbit && onOrbit(orbit);
  }

  function setMode(m) {
    mode = m;
    visible = m === 'home';
    canvas.style.opacity = visible ? '1' : '0';
    if (!visible) { target = null; if (orbit) toggleOrbit(false); }
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 50 : w / h < 1.2 ? 38 : 30;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- loop ----
  let last = performance.now(), frames = 0, fpsT = last, hidden = 0;
  const want = new THREE.Vector3();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(50, now - last) / 16.67; last = now;
    frames++;
    if (now - fpsT > 500) { onFps && onFps(Math.round(frames * 1000 / (now - fpsT))); frames = 0; fpsT = now; }

    let moved = 0, turn = 0;
    if (rewinding) {
      // roll back along the tape, winding it up
      const k = Math.max(1, Math.round(Math.min(40, 2 + n * 0.02) * dt));
      for (let i = 0; i < k && n > 1; i++) { samples.pop(); n--; }
      const sm = samples[n - 1];
      const back = laid - sm.s;
      laid = sm.s; acc = 0;
      p.set(sm.x, sm.z);
      turn = wrapAngle(sm.h - heading);
      heading = sm.h;
      moved = -back;
      flush();
      if (n <= 1) { rewinding = false; onRewind && onRewind(false); }
    } else if (target && mode === 'home') {
      const dx = target.x - p.x, dz = target.y - p.y;
      const dist = Math.hypot(dx, dz);
      if (dist > 0.35) {
        const diff = wrapAngle(Math.atan2(dx, dz) - heading);
        const speed = Math.min(dist * 0.045, 0.32) * dt;
        const step = speed * (0.25 + 0.75 * Math.max(0, Math.cos(diff)));
        // turning radius never tighter than the tape can lie flat
        const maxTurn = step / (W * 0.6) + 0.004 * dt;
        turn = THREE.MathUtils.clamp(diff * 0.14 * dt, -maxTurn, maxTurn);
        heading = wrapAngle(heading + turn);
        p.x += Math.sin(heading) * step;
        p.y += Math.cos(heading) * step;
        laid += step; acc += step; moved = step;
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

    sun.position.set(p.x + SUN_OFF.x, SUN_OFF.y, p.y + SUN_OFF.z);
    sun.target.position.set(p.x, 0, p.y);

    if (orbit) controls.update();
    else {
      camera.position.lerp(CAM_HOME, 0.05 * dt);
      controls.target.lerp(LOOK, 0.08 * dt);
      camera.lookAt(controls.target);
    }

    hidden = visible ? 0 : hidden + 1;
    if (hidden < 60) renderer.render(scene, camera); // stop drawing once faded out
  }
  requestAnimationFrame(tick);

  return { setMode, rewind, toggleOrbit, setImage: tape.setImage, isOrbit: () => orbit, isRewinding: () => rewinding };
}
