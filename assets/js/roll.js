/* The roll — a tape printed with the studio's work.
   On the first visit a wolf runs it on a leash and writes "Welcome" in tape.
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

/* ---- "Welcome", one cursive stroke (glyph units: x right, y up, x-height 1) ---- */
const WELCOME = [
  [0, 2], [0.38, 0], [0.72, 1.25], [1.06, 0], [1.44, 2.0],          // W
  [1.62, 0.55], [2.25, 0.72], [2.18, 1.1], [1.86, 1.12], [1.66, 0.62], [1.88, 0.02], [2.45, 0.12], // e
  [2.95, 1.15], [3.02, 2.02], [2.74, 2.12], [2.6, 1.62], [2.68, 0.4], [2.95, 0.0], [3.35, 0.22],   // l
  [3.8, 0.88], [3.55, 1.06], [3.28, 0.62], [3.45, 0.04], [3.98, 0.18],                            // c
  [4.3, 0.92], [4.66, 0.98], [4.82, 0.5], [4.6, 0.0], [4.28, 0.18], [4.34, 0.74], [4.72, 0.98], [5.12, 0.86], // o
  [5.26, 0.02], [5.5, 0.92], [5.78, 0.96], [5.88, 0.02], [6.1, 0.92], [6.38, 0.96], [6.48, 0.02], [6.8, 0.22], // m
  [7.42, 0.62], [7.36, 1.04], [7.04, 1.06], [6.84, 0.58], [7.06, 0.03], [7.75, 0.16],              // e
];
const WORD_W = 7.75, WORD_H = 2.12;

const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));

/* Dark wolf skin with an iridescent rim, fading out on cue */
function wolfMaterial() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x151519, roughness: 0.48, metalness: 0.25, flatShading: false, transparent: true });
  const u = { uTime: { value: 0 }, uFade: { value: 1 } };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.fragmentShader = 'uniform float uTime;\nuniform float uFade;\n' + sh.fragmentShader.replace(
      '#include <tonemapping_fragment>',
      `float rim = pow(1.0 - clamp(abs(dot(normal, geometryViewDir)), 0.0, 1.0), 2.6);
       vec3 iri = 0.5 + 0.5 * cos(6.2831 * (rim * 0.8 + uTime * 0.06 + vec3(0.55, 0.65, 0.8)));
       gl_FragColor.rgb += iri * rim * (0.42 + (1.0 - uFade) * 1.8);
       gl_FragColor.a *= uFade;
       #include <tonemapping_fragment>`
    );
  };
  return { mat, u };
}

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
  const WORD_CENTER = new THREE.Vector3(0, 0, -1.2);
  const look = WORD_CENTER.clone();
  let homeDist = 30, wordDist = 30;

  const controls = new OrbitControls(camera, canvas);
  controls.enabled = false;           // switched on after the intro
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

  // ---- leash: a yoke on the roll's axle + a strip of film to the wolf's collar ----
  const leashMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, transparent: true });
  const yoke = new THREE.Group();
  const YOKE_TIP = new THREE.Vector3(0, 0.5, R + 1.1);
  [1, -1].forEach(s => {
    const a = new THREE.Vector3(s * (W / 2 + 0.12), 0, 0);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, a.distanceTo(YOKE_TIP), 8), leashMat);
    rod.position.copy(a).add(YOKE_TIP).multiplyScalar(0.5);
    rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), YOKE_TIP.clone().sub(a).normalize());
    rod.castShadow = true;
    yoke.add(rod);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16), leashMat);
    cap.rotation.z = Math.PI / 2; cap.position.copy(a);
    yoke.add(cap);
  });
  yoke.visible = false;
  root.add(yoke);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.025, 1), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.5, transparent: true }));
  strip.castShadow = true;
  strip.visible = false;
  scene.add(strip);

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
    if (n >= MAX) {
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
  function resetTape() { samples.length = 0; n = 0; laid = 0; acc = 0; push(); flush(); }

  // ---- the "Welcome" route ----
  const S = 4.1;
  const route = new THREE.CatmullRomCurve3(
    WELCOME.map(([x, y]) => new THREE.Vector3((x - WORD_W / 2) * S + WORD_CENTER.x, 0, -(y - WORD_H / 2) * S + WORD_CENTER.z)),
    false, 'centripetal'
  );
  const routeLen = route.getLength();
  const LEASH = 7;                       // roll centre → wolf hips along the route

  // intro state: 'wait' (model loading) → 'run' → 'exit' (wolf leaves) → null
  let introState = intro ? 'wait' : null;
  let introD = 0, introSpeed = 0, exitT = 0;
  const exitDir = new THREE.Vector3();

  if (introState) {
    const start = route.getPointAt(0), t0 = route.getTangentAt(0);
    p.set(start.x, start.z);
    heading = Math.atan2(t0.x, t0.z);
  }
  resetTape();

  // ---- the wolf ----
  let wolf = null, mixer = null, wolfSkin = null, neck = null;
  if (introState) {
    import('three/addons/loaders/GLTFLoader.js').then(({ GLTFLoader }) => {
      new GLTFLoader().load(new URL('../models/dog.glb', import.meta.url).href, gltf => {
        wolf = gltf.scene;
        const skin = wolfMaterial();
        wolfSkin = skin;
        wolf.traverse(o => {
          if (o.isMesh) {
            if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals(); // the model ships without normals
            o.material = skin.mat; o.castShadow = true; o.frustumCulled = false;
          }
          if (o.isBone && /Neck/.test(o.name)) neck = o;
          if (o.isBone && /Tail01/.test(o.name)) o.scale.setScalar(0.82); // a wolf, not a fox
        });
        wolf.scale.setScalar(0.05);
        scene.add(wolf);
        mixer = new THREE.AnimationMixer(wolf);
        const run = gltf.animations.find(a => a.name === 'Run') || gltf.animations[0];
        mixer.clipAction(run).setEffectiveTimeScale(1.25).play();
        yoke.visible = strip.visible = true;
        introState = 'run';
      }, undefined, () => endIntro());
    }).catch(() => endIntro());
  }

  function endIntro() {
    introState = null;
    if (wolf) { scene.remove(wolf); wolf = null; }
    yoke.visible = strip.visible = false;
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
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 48 : w / h < 1.2 ? 38 : 30;
    camera.updateProjectionMatrix();
    wordDist = Math.max(30, fitDist(WORD_W * S + 4));
    // after the welcome the word stays in frame; on a plain visit the roll gets closer
    homeDist = w / h < 0.8 ? Math.max(30, fitDist(16)) : intro ? wordDist : 32;
    if (!controls.enabled) camera.position.copy(look).addScaledVector(CAM_DIR, introState ? wordDist : homeDist);
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
      introSpeed = Math.min(0.34, introSpeed + 0.012 * dt);
      const before = heading;
      stepRoute(Math.min(introSpeed * dt, routeLen - introD));
      turn = wrapAngle(heading - before);
      flush();
      if (introD >= routeLen - 1e-4) beginExit();
    } else if (introState === 'exit') {
      exitT += dtMs / 1000;
      if (wolfSkin) wolfSkin.u.uFade.value = Math.max(0, 1 - exitT / 1.1);
      leashMat.opacity = strip.material.opacity = Math.max(0, 1 - exitT / 0.6);
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

    // the wolf runs ahead on the route; leash from the yoke tip to its collar
    if (wolf) {
      mixer.update(dtMs / 1000);
      if (wolfSkin) wolfSkin.u.uTime.value = now / 1000;
      if (introState === 'run' || introState === 'wait') {
        const d = introD + LEASH;
        wolfAt(d, v3); wolfAt(d + 0.6, v3b);
      } else {
        wolf.position.addScaledVector(exitDir, 0.34 * dt * 1.15);
        v3.copy(wolf.position); v3b.copy(v3).add(exitDir);
      }
      wolf.position.set(v3.x, 0, v3.z);
      wolf.rotation.y = Math.atan2(v3b.x - v3.x, v3b.z - v3.z);
      if (introState === 'run') wolf.position.y = 0;
      // leash
      root.updateMatrixWorld();
      const a = yoke.localToWorld(YOKE_TIP.clone());
      const b = new THREE.Vector3();
      if (neck) neck.getWorldPosition(b); else b.copy(wolf.position).setY(2);
      b.y -= 0.3;
      strip.position.copy(a).add(b).multiplyScalar(0.5);
      strip.scale.z = a.distanceTo(b);
      strip.lookAt(b);
    }

    sun.position.set(p.x + SUN_OFF.x, SUN_OFF.y, p.y + SUN_OFF.z);
    sun.target.position.set(p.x, 0, p.y);

    if (controls.enabled) controls.update();
    else {
      v3.copy(look).addScaledVector(CAM_DIR, introState ? wordDist : homeDist);
      camera.position.lerp(v3, 0.05 * dt);
      camera.lookAt(look);
    }
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
