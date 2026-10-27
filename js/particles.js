/* 3D particle portrait for the hero section.
   Needs three.js (loaded in index.html) and js/portrait-data.js.
   If WebGL or three.js is unavailable, the original photo stays in place. */
(function () {
  const hero = document.querySelector('.hero');
  const photo = document.querySelector('.hero-photo');
  if (!hero || !photo || !window.THREE || !window.PORTRAIT_SRC) return;

  // Tweak these three to taste
  const DEPTH = 1;      // how far the face and body stand out (0 = flat, 1.5 = more)
  const TURN = 0.38;    // how far the portrait turns toward your cursor (radians)
  const ACID = 0xcbef70; // colour of the floating sparks (matches the site accent)
  const small = window.matchMedia('(max-width: 800px)').matches;
  const STEP = small ? 3 : 2;           // lower = more particles = sharper likeness
  const PW = 75, PH = 100, SIZE = small ? 1.5 : 1.05;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const BG = window.PORTRAIT_BG;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (err) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  photo.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 1, 1000);
  const group = new THREE.Group();
  scene.add(group);

  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const sg = sprite.getContext('2d');
  sg.beginPath(); sg.arc(32, 32, 30, 0, 7); sg.fillStyle = '#fff'; sg.fill();
  const texture = new THREE.CanvasTexture(sprite);

  // Depth comes from face shape only (never from brightness), so teeth, collar and tie
  // stay on the same plane as the rest of the face instead of sticking out.
  function depthAt(u, v) {
    const g = (cu, cv, su, sv) => Math.exp(-(((u - cu) ** 2) / (2 * su * su) + ((v - cv) ** 2) / (2 * sv * sv)));
    const head = 20 * g(0.5, 0.33, 0.14, 0.2);
    const nose = 3 * g(0.51, 0.355, 0.03, 0.05);
    const shoulderFade = Math.min(1, Math.max(0, (v - 0.45) / 0.2));
    const body = 9 * Math.max(0, 1 - Math.pow((u - 0.5) * 2, 2)) * shoulderFade;
    return head + nose + body;
  }
  const tone = (c) => Math.min(1, 0.05 + Math.pow(c / 255, 0.92) * 1.04);

  let n = 0, home, pos, vel, geo, started = false, onScreen = true;
  const mouse = { x: 0, y: 0, on: false };
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -8);

  const img = new Image();
  img.onload = () => {
    const iw = img.width, ih = img.height;
    const off = document.createElement('canvas');
    off.width = iw; off.height = ih;
    const oc = off.getContext('2d');
    oc.drawImage(img, 0, 0);
    const d = oc.getImageData(0, 0, iw, ih).data;
    const H = [], C = [];
    for (let y = 0; y < ih - 1; y += STEP) {
      for (let x = 0; x < iw - 1; x += STEP) {
        const i = ((y + 1) * iw + x + 1) * 4, r = d[i], g = d[i + 1], b = d[i + 2];
        if (Math.hypot(r - BG[0], g - BG[1], b - BG[2]) < 44) continue; // skip the photo backdrop
        const u = x / iw, v = y / ih;
        H.push((u - 0.5) * PW, (0.5 - v) * PH, depthAt(u, v) * DEPTH + (Math.random() - 0.5) * 0.3);
        C.push(tone(r), tone(g), tone(b));
      }
    }
    n = H.length / 3;
    home = new Float32Array(H);
    vel = new Float32Array(n * 3);
    pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 190;
      pos[i + 1] = (Math.random() - 0.5) * 150;
      pos[i + 2] = (Math.random() - 0.5) * 130;
    }
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(C), 3));
    group.add(new THREE.Points(geo, new THREE.PointsMaterial({
      size: SIZE, map: texture, vertexColors: true, alphaTest: 0.5, sizeAttenuation: true
    })));
    group.add(makeSparks());
    photo.classList.add('has-3d');
    resize();
    waitForPreload(() => {
      started = true;
      if (reduce) { pos.set(home); }
    });
    requestAnimationFrame(loop);
  };
  img.src = window.PORTRAIT_SRC;

  // A few drifting sparks around the portrait for atmosphere
  let sparks;
  function makeSparks() {
    const count = 360, arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      arr[i] = (Math.random() - 0.5) * 170; arr[i + 1] = (Math.random() - 0.5) * 130; arr[i + 2] = (Math.random() - 0.5) * 70 - 15;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    sparks = new THREE.Points(g, new THREE.PointsMaterial({
      size: 0.7, map: texture, color: ACID, alphaTest: 0.4, transparent: true, opacity: 0.65, sizeAttenuation: true, depthWrite: false
    }));
    return sparks;
  }

  // Begin assembling once the greeting screen has finished
  function waitForPreload(done) {
    const pre = document.getElementById('preload');
    if (!pre || pre.classList.contains('is-gone')) return done();
    const mo = new MutationObserver(() => {
      if (pre.classList.contains('is-gone')) { mo.disconnect(); done(); }
    });
    mo.observe(pre, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => { mo.disconnect(); done(); }, 6000);
  }

  function resize() {
    const w = photo.clientWidth, h = photo.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const tv = Math.tan(camera.fov * Math.PI / 360), th = tv * camera.aspect;
    const dV = PH * 1.1 / 2 / tv, dH = PW * 1.1 / 2 / th;
    const dist = camera.aspect < 0.9 ? dV * 1.15 : Math.max(dV, dH); // fill tall phone screens
    camera.position.set(0, 0, dist + 10);
    camera.lookAt(0, 0, 0);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(photo);
  else window.addEventListener('resize', resize);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; }, { threshold: 0 }).observe(hero);
  }

  function track(e) {
    const r = hero.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    mouse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    mouse.on = true;
  }
  hero.addEventListener('pointermove', track);
  hero.addEventListener('pointerleave', () => { mouse.on = false; });
  hero.addEventListener('pointerdown', (e) => {
    track(e);
    if (reduce || !n || e.target.closest('a, button')) return;
    for (let i = 0; i < n * 3; i += 3) { // click the background to scatter
      const l = Math.hypot(pos[i], pos[i + 1], pos[i + 2]) || 1, s = 0.6 + Math.random() * 2;
      vel[i] += pos[i] / l * s + (Math.random() - 0.5);
      vel[i + 1] += pos[i + 1] / l * s + (Math.random() - 0.5);
      vel[i + 2] += pos[i + 2] / l * s + Math.random() * 2;
    }
  });

  const R = 14, R2 = R * R, F = 1.1, K = 0.04, D = 0.88;
  const local = new THREE.Vector3(), inv = new THREE.Matrix4();

  function loop(t) {
    requestAnimationFrame(loop);
    if (!onScreen || !started) { if (!started) renderer.render(scene, camera); return; }
    let pl = null;
    if (mouse.on && !reduce) {
      ray.setFromCamera(mouse, camera);
      group.updateMatrixWorld();
      inv.copy(group.matrixWorld).invert();
      pl = ray.ray.clone().applyMatrix4(inv).intersectPlane(plane, local);
    }
    for (let i = 0; i < n * 3; i += 3) {
      let ax = (home[i] - pos[i]) * K, ay = (home[i + 1] - pos[i + 1]) * K, az = (home[i + 2] - pos[i + 2]) * K;
      if (pl) {
        const dx = pos[i] - pl.x, dy = pos[i + 1] - pl.y, dz = pos[i + 2] - pl.z, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < R2) { const dd = Math.sqrt(d2) || 1, f = (1 - dd / R) * F; ax += dx / dd * f; ay += dy / dd * f; az += dz / dd * f; }
      }
      vel[i] = (vel[i] + ax) * D; vel[i + 1] = (vel[i + 1] + ay) * D; vel[i + 2] = (vel[i + 2] + az) * D;
      pos[i] += vel[i]; pos[i + 1] += vel[i + 1]; pos[i + 2] += vel[i + 2];
    }
    geo.attributes.position.needsUpdate = true;
    const ty = mouse.on ? mouse.x * TURN : (reduce ? 0 : Math.sin(t * 0.0006) * TURN * 0.5);
    const tx = mouse.on ? -mouse.y * TURN * 0.35 : (reduce ? 0 : Math.sin(t * 0.0004) * TURN * 0.1);
    group.rotation.y += (ty - group.rotation.y) * 0.06;
    group.rotation.x += (tx - group.rotation.x) * 0.06;
    if (sparks && !reduce) sparks.rotation.y = t * 0.00003;
    renderer.render(scene, camera);
  }
})();
