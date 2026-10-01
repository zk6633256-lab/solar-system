import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* =========================================================
   Solar System Demo — Three.js
   ========================================================= */

// ---------- Planet data ----------
// Distances/sizes are artistically compressed for visibility.
const BODIES = [
  {
    name: "Sun",
    type: "star",
    radius: 8,
    color: 0xffcc33,
    emissive: 0xffaa00,
    orbit: 0,
    period: 0,
    rotation: 25,
    facts: { Diameter: "1,392,700 km", Type: "G-type star", "Surface temp": "5,505 °C", Age: "4.6 bn years" },
  },
  {
    name: "Mercury",
    radius: 1.1,
    color: 0x9c8e7e,
    orbit: 16,
    period: 88,
    rotation: 58.6,
    moons: 0,
    facts: { Diameter: "4,879 km", "Orbit": "88 days", Moons: "0", Temp: "-173 to 427 °C" },
  },
  {
    name: "Venus",
    radius: 1.7,
    color: 0xe6c98a,
    orbit: 22,
    period: 225,
    rotation: -243,
    moons: 0,
    facts: { Diameter: "12,104 km", "Orbit": "225 days", Moons: "0", Temp: "464 °C" },
  },
  {
    name: "Earth",
    radius: 1.8,
    color: 0x3f7fbf,
    orbit: 30,
    period: 365.25,
    rotation: 1,
    moons: 1,
    facts: { Diameter: "12,742 km", "Orbit": "365.25 days", Moons: "1", Temp: "15 °C avg" },
  },
  {
    name: "Mars",
    radius: 1.3,
    color: 0xc1553b,
    orbit: 38,
    period: 687,
    rotation: 1.03,
    moons: 2,
    facts: { Diameter: "6,779 km", "Orbit": "687 days", Moons: "2", Temp: "-63 °C avg" },
  },
  {
    name: "Jupiter",
    radius: 5.2,
    color: 0xd8a679,
    orbit: 56,
    period: 4331,
    rotation: 0.41,
    moons: 95,
    banded: true,
    facts: { Diameter: "139,820 km", "Orbit": "11.9 years", Moons: "95", Temp: "-110 °C" },
  },
  {
    name: "Saturn",
    radius: 4.4,
    color: 0xe3d3a3,
    orbit: 74,
    period: 10747,
    rotation: 0.44,
    moons: 146,
    banded: true,
    ring: { inner: 1.4, outer: 2.4, color: 0xcbb489 },
    facts: { Diameter: "116,460 km", "Orbit": "29.4 years", Moons: "146", Rings: "Yes" },
  },
  {
    name: "Uranus",
    radius: 3.0,
    color: 0x8fd6e0,
    orbit: 90,
    period: 30687,
    rotation: -0.72,
    moons: 28,
    ring: { inner: 1.5, outer: 1.9, color: 0x9fd8e2 },
    facts: { Diameter: "50,724 km", "Orbit": "84 years", Moons: "28", Temp: "-195 °C" },
  },
  {
    name: "Neptune",
    radius: 2.9,
    color: 0x3f5fd9,
    orbit: 104,
    period: 60190,
    rotation: 0.65,
    moons: 16,
    facts: { Diameter: "49,244 km", "Orbit": "165 years", Moons: "16", Temp: "-200 °C" },
  },
];

// Real relative sizes (Earth = 1) used by the "relative scale" toggle.
const REAL_SIZE = { Sun: 109, Mercury: 0.38, Venus: 0.95, Earth: 1, Mars: 0.53, Jupiter: 11.2, Saturn: 9.4, Uranus: 4.0, Neptune: 3.9 };

// ---------- State ----------
const state = {
  paused: false,
  speed: 1,
  showLabels: true,
  showOrbits: true,
  realScale: false,
  focus: "Sun",
  elapsed: 0, // simulated days
};

// ---------- Renderer / scene ----------
const canvas = document.getElementById("scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060f);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, 70, 160);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 12;
controls.maxDistance = 900;

// ---------- Lights ----------
scene.add(new THREE.AmbientLight(0x404060, 0.55));

const sunLight = new THREE.PointLight(0xfff2cc, 3.2, 0, 1.6);
scene.add(sunLight);

const fill = new THREE.DirectionalLight(0x8899ff, 0.18);
fill.position.set(-1, 0.5, -1);
scene.add(fill);

// ---------- Procedural textures ----------
function makeTexture(draw, w = 256, h = 256) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function noiseTexture(base, spots, spotColor, count = 900) {
  return makeTexture((ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * spots;
      ctx.globalAlpha = Math.random() * 0.5 + 0.15;
      ctx.fillStyle = spotColor;
      ctx.beginPath();
      ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });
}

function bandedTexture(colors) {
  return makeTexture((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    const step = 1 / (colors.length - 1);
    colors.forEach((c, i) => g.addColorStop(i * step, c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // subtle turbulence
    for (let i = 0; i < 1400; i++) {
      ctx.globalAlpha = Math.random() * 0.14;
      ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
      const y = Math.random() * h;
      ctx.fillRect(0, y, w, Math.random() * 4 + 1);
    }
    ctx.globalAlpha = 1;
  }, 256, 512);
}

function earthTexture() {
  return makeTexture((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#123a6b");
    g.addColorStop(0.5, "#1e5fa8");
    g.addColorStop(1, "#123a6b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // continents
    ctx.fillStyle = "#2e7d3f";
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const s = Math.random() * 34 + 10;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.ellipse(x, y, s, s * (Math.random() * 0.7 + 0.4), Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // clouds
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 260; i++) {
      ctx.globalAlpha = Math.random() * 0.35;
      ctx.beginPath();
      ctx.ellipse(Math.random() * w, Math.random() * h, Math.random() * 26 + 4, Math.random() * 8 + 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // polar caps
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "#eef6ff";
    ctx.fillRect(0, 0, w, 14);
    ctx.fillRect(0, h - 14, w, 14);
    ctx.globalAlpha = 1;
  }, 512, 256);
}

function sunTexture() {
  return makeTexture((ctx, w, h) => {
    ctx.fillStyle = "#ff9500";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2400; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 9 + 2;
      const t = Math.random();
      ctx.globalAlpha = 0.16 + Math.random() * 0.3;
      ctx.fillStyle = t > 0.6 ? "#ffe27a" : t > 0.3 ? "#ff6a00" : "#ffd24d";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, 512, 256);
}

const TEXTURES = {
  Sun: sunTexture(),
  Earth: earthTexture(),
  Mercury: noiseTexture("#8c8073", 4, "#5b5348", 1500),
  Venus: bandedTexture(["#e8cf9a", "#d9b877", "#f0dda9", "#c9a565", "#e8cf9a"]),
  Mars: noiseTexture("#b04a30", 6, "#7c2f1e", 1100),
  Jupiter: bandedTexture(["#c99b6c", "#e8d3b3", "#a9743f", "#f2e3cd", "#d5a878", "#8c5a34"]),
  Saturn: bandedTexture(["#e5d5a8", "#f3ead0", "#d4bd85", "#efe2c0", "#e5d5a8"]),
  Uranus: bandedTexture(["#8fd6e0", "#a7e2ea", "#7cc6d2", "#a7e2ea"]),
  Neptune: bandedTexture(["#3f5fd9", "#5577e8", "#2f4bc0", "#6b8bf0"]),
};

// ---------- Starfield ----------
function createStars() {
  const count = 6000;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = 900 + Math.random() * 1400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi);
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    c.setHSL(0.55 + Math.random() * 0.12, 0.5, 0.6 + Math.random() * 0.4);
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9 });
  return new THREE.Points(geo, mat);
}
scene.add(createStars());

// ---------- Galaxy-ish background haze ----------
const haze = new THREE.Mesh(
  new THREE.SphereGeometry(2400, 24, 24),
  new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    color: 0x0a0f26,
    transparent: true,
    opacity: 0.6,
  })
);
scene.add(haze);

// ---------- Build bodies ----------
const sunGroup = new THREE.Group();
scene.add(sunGroup);

const bodies = []; // { def, pivot, mesh, spin, orbitLine, angle }
const labelLayer = document.getElementById("labels");
const labelEls = new Map();

function buildBody(def) {
  const pivot = new THREE.Group(); // rotates around Y => orbital motion
  (def.type === "star" ? sunGroup : scene).add(pivot);

  const geo = new THREE.SphereGeometry(def.radius, 48, 32);
  let mat;
  if (def.type === "star") {
    mat = new THREE.MeshBasicMaterial({ map: TEXTURES.Sun, color: 0xffffff });
  } else {
    mat = new THREE.MeshStandardMaterial({
      map: TEXTURES[def.name] || null,
      color: def.color,
      roughness: 0.85,
      metalness: 0.05,
    });
  }
  const mesh = new THREE.Mesh(geo, mat);

  // Position on orbit
  mesh.position.x = def.orbit;
  pivot.add(mesh);

  // Axial tilt
  mesh.rotation.z = THREE.MathUtils.degToRad(def.name === "Uranus" ? 98 : def.name === "Saturn" ? 27 : 10);

  // Sun glow sprite
  if (def.type === "star") {
    const glowTex = makeTexture((ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,220,120,0.95)");
      g.addColorStop(0.35, "rgba(255,160,40,0.45)");
      g.addColorStop(1, "rgba(255,120,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }, 256, 256);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    glow.scale.setScalar(def.radius * 6);
    mesh.add(glow);
  }

  // Rings
  if (def.ring) {
    const ringGeo = new THREE.RingGeometry(def.radius * def.ring.inner, def.radius * def.ring.outer, 96);
    // fix UVs so texture maps radially
    const p = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    const v3 = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v3.fromBufferAttribute(p, i);
      const t = (v3.length() - def.radius * def.ring.inner) / (def.radius * (def.ring.outer - def.ring.inner));
      uv.setXY(i, t, 0.5);
    }
    const ringTex = makeTexture((ctx, w, h) => {
      for (let x = 0; x < w; x++) {
        const a = Math.sin(x * 0.35) * 0.25 + 0.6 + Math.random() * 0.15;
        ctx.fillStyle = `rgba(210,190,150,${a})`;
        ctx.fillRect(x, 0, 1, h);
      }
      // Cassini-like gap
      ctx.clearRect(w * 0.62, 0, 8, h);
    }, 256, 8);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      color: def.ring.color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    mesh.add(ring);
  }

  // Moons
  const moons = [];
  const moonCount = Math.min(def.moons || 0, def.name === "Earth" ? 1 : def.name === "Mars" ? 2 : def.name === "Jupiter" ? 4 : def.name === "Saturn" ? 3 : 0);
  for (let i = 0; i < moonCount; i++) {
    const moonPivot = new THREE.Group();
    mesh.add(moonPivot);
    const moonGeo = new THREE.SphereGeometry(def.radius * (0.14 + Math.random() * 0.12), 20, 14);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xbdbdbd, roughness: 1 });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    const dist = def.radius * (1.9 + i * 0.75);
    moon.position.x = dist;
    moonPivot.add(moon);
    moons.push({ pivot: moonPivot, speed: 1.2 - i * 0.22, angle: Math.random() * Math.PI * 2 });
  }

  // Orbit line
  let orbitLine = null;
  if (def.orbit > 0) {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * def.orbit, 0, Math.sin(a) * def.orbit));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    orbitLine = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0x5b8cff, transparent: true, opacity: 0.25 }));
    scene.add(orbitLine);
  }

  // Label
  const el = document.createElement("div");
  el.className = "label";
  el.textContent = def.name;
  labelLayer.appendChild(el);
  labelEls.set(def.name, el);

  return {
    def,
    pivot,
    mesh,
    moons,
    orbitLine,
    angle: Math.random() * Math.PI * 2,
    spin: 0,
  };
}

BODIES.forEach((d) => bodies.push(buildBody(d)));

// ---------- Asteroid belt ----------
const belt = (() => {
  const count = 1800;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 45 + Math.random() * 7;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
    pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0x9a8f7d, size: 0.35, transparent: true, opacity: 0.85 });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return pts;
})();

// ---------- Focus / camera targeting ----------
const focusTarget = new THREE.Vector3();
const camDesired = new THREE.Vector3();

function getBody(name) {
  return bodies.find((b) => b.def.name === name);
}

function focusOn(name) {
  state.focus = name;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c.dataset.name === name));
  updateInfo(name);
}

function updateInfo(name) {
  const b = getBody(name);
  document.getElementById("info-name").textContent = b.def.name;
  const dl = document.getElementById("info-stats");
  dl.innerHTML = "";
  const facts = b.def.facts || {};
  Object.entries(facts).forEach(([k, v]) => {
    const dt = document.createElement("dt");
    dt.textContent = k;
    const dd = document.createElement("dd");
    dd.textContent = v;
    dl.append(dt, dd);
  });
}

// Build focus chips
const focusList = document.getElementById("focus-list");
BODIES.forEach((d) => {
  const chip = document.createElement("button");
  chip.className = "chip";
  chip.dataset.name = d.name;
  chip.textContent = d.name;
  chip.addEventListener("click", () => focusOn(d.name));
  focusList.appendChild(chip);
});

// Click to select a body
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downPos = null;
canvas.addEventListener("pointerdown", (e) => (downPos = { x: e.clientX, y: e.clientY }));
canvas.addEventListener("pointerup", (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
  downPos = null;
  if (moved > 6) return; // it was a drag
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const meshes = bodies.map((b) => b.mesh);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length) {
    const hit = bodies.find((b) => b.mesh === hits[0].object);
    if (hit) focusOn(hit.def.name);
  }
});

// ---------- Scale handling ----------
function applyScale() {
  bodies.forEach((b) => {
    const base = b.def.radius;
    const r = state.realScale ? Math.max(0.55, base * (REAL_SIZE[b.def.name] / 10)) : base;
    const ratio = r / base;
    b.mesh.scale.setScalar(ratio);
    // keep orbit radius the same, but compensate mesh position offset visually unchanged
  });
}

// ---------- UI wiring ----------
const $ = (id) => document.getElementById(id);

$("speed").addEventListener("input", (e) => {
  state.speed = parseFloat(e.target.value);
  $("speed-val").textContent = state.speed.toFixed(1) + "×";
});

$("zoom").addEventListener("input", (e) => {
  const pct = parseInt(e.target.value, 10);
  $("zoom-val").textContent = pct + "%";
  const dist = THREE.MathUtils.mapLinear(pct, 20, 300, 60, 420);
  const dir = camera.position.clone().sub(controls.target).normalize();
  camera.position.copy(controls.target).add(dir.multiplyScalar(dist));
});

$("chk-real-scale").addEventListener("change", (e) => {
  state.realScale = e.target.checked;
  applyScale();
});

function togglePause() {
  state.paused = !state.paused;
  const label = state.paused ? "▶ Play" : "⏸ Pause";
  $("btn-pause").textContent = label;
  $("btn-pause").classList.toggle("active", state.paused);
}
function toggleLabels() {
  state.showLabels = !state.showLabels;
  labelLayer.classList.toggle("hidden", !state.showLabels);
  $("btn-labels").classList.toggle("active", !state.showLabels);
}
function toggleOrbits() {
  state.showOrbits = !state.showOrbits;
  bodies.forEach((b) => b.orbitLine && (b.orbitLine.visible = state.showOrbits));
  $("btn-orbits").classList.toggle("active", !state.showOrbits);
}
function toggleTheme() {
  document.body.classList.toggle("light");
  const light = document.body.classList.contains("light");
  scene.background.set(light ? 0x0b1024 : 0x05060f);
  $("btn-theme").textContent = light ? "☀️" : "🌙";
}
function togglePanel() {
  $("panel").classList.toggle("collapsed");
}

$("btn-pause").addEventListener("click", togglePause);
$("btn-labels").addEventListener("click", toggleLabels);
$("btn-orbits").addEventListener("click", toggleOrbits);
$("btn-theme").addEventListener("click", toggleTheme);
$("btn-panel-toggle").addEventListener("click", togglePanel);

$("m-pause").addEventListener("click", togglePause);
$("m-labels").addEventListener("click", toggleLabels);
$("m-orbits").addEventListener("click", toggleOrbits);
$("m-panel").addEventListener("click", togglePanel);

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    togglePause();
  }
  if (e.key.toLowerCase() === "l") toggleLabels();
  if (e.key.toLowerCase() === "o") toggleOrbits();
});

// ---------- Resize ----------
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Label positioning ----------
const proj = new THREE.Vector3();
function updateLabels() {
  if (!state.showLabels) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  bodies.forEach((b) => {
    const el = labelEls.get(b.def.name);
    b.mesh.getWorldPosition(proj);
    proj.project(camera);
    const visible = proj.z < 1;
    if (!visible) {
      el.style.opacity = "0";
      return;
    }
    const x = (proj.x * 0.5 + 0.5) * w;
    const y = (-proj.y * 0.5 + 0.5) * h - 18;
    // distance-based fade
    const dist = camera.position.distanceTo(b.mesh.getWorldPosition(new THREE.Vector3()));
    const fade = THREE.MathUtils.clamp(1 - (dist - 40) / 400, 0.15, 1);
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.style.opacity = String(fade);
    el.style.fontWeight = state.focus === b.def.name ? "700" : "400";
    el.style.borderColor = state.focus === b.def.name ? "var(--accent-2)" : "rgba(255,255,255,0.2)";
  });
}

// ---------- Animation loop ----------
const clock = new THREE.Clock();
const tmpVec = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (!state.paused) {
    // 1 real second = 10 simulated days at 1× speed
    state.elapsed += dt * 10 * state.speed;

    bodies.forEach((b) => {
      const def = b.def;
      if (def.orbit > 0 && def.period) {
        const angularSpeed = (Math.PI * 2) / def.period; // radians per day
        b.angle += angularSpeed * dt * 10 * state.speed;
        b.pivot.rotation.y = b.angle;
      }
      // axial spin
      if (def.rotation) {
        b.spin += (dt * 10 * state.speed) / Math.abs(def.rotation) * Math.sign(def.rotation) * 0.35;
        b.mesh.rotation.y = b.spin;
      }
      // moons
      b.moons.forEach((m) => {
        m.angle += m.speed * dt * state.speed;
        m.pivot.rotation.y = m.angle;
      });
    });

    belt.rotation.y += dt * 0.02 * state.speed;
  }

  // Focus camera
  const targetBody = getBody(state.focus);
  if (targetBody) {
    targetBody.mesh.getWorldPosition(focusTarget);
    controls.target.lerp(focusTarget, 0.06);
  }

  controls.update();
  updateLabels();
  renderer.render(scene, camera);
}

// ---------- Boot ----------
focusOn("Sun");
applyScale();
animate();

// Hide loader once first frames rendered
setTimeout(() => document.getElementById("loader").classList.add("hidden"), 600);
