// pen3d.js: Neo smartpen M1+ (black) modelled procedurally with Three.js.
// Mounts itself into every element with [data-pen3d]. When the first frame is on
// screen the element gets the class "has-3d" so CSS can hide the fallback <img>.
// If WebGL or the CDN fails, nothing happens and the fallback stays.
//
// Optional attributes on the container:
//   data-tilt="3.5"  resting tilt in degrees (clockwise, top to the right)
//   data-fill="0.8"  fraction of the container height the pen occupies (the
//                    container is taller than the stage to leave room for motion)
//   data-intro="0"   skip the entrance (rise + settle) animation

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;

// Real dimensions in millimetres (Neo smartpen M1+: 149 mm long, 10.4 mm wide).
const LEN = 149;
const R = 5.2;
const TIP_TO_FACE = 12.7;              // refill tip to body front face
const Y_TIP = -LEN / 2;
const Y_FACE = Y_TIP + TIP_TO_FACE;    // body front face
const Y_BACK = LEN / 2;
const BODY_LEN = Y_BACK - Y_FACE;      // 136.3
const FRONT_ROUND = 0.6;
const BACK_ROUND = 1.5;
const CYL_Y0 = Y_FACE + FRONT_ROUND;
const CYL_Y1 = Y_BACK - BACK_ROUND;

// Angles around the long axis: 0 faces the camera, -90 is the left edge (button side).
const A_SEAM = -3 * D2R;
const A_DOTS = 6 * D2R;
const A_BUTTON = -90 * D2R;
const A_WINDOW = 78 * D2R;             // centre of the camera window cut-out in the nib

/* ---------------- helpers ---------------- */

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const angDist = (a, b) => {
  let d = Math.abs(a - b) % TAU;
  return d > Math.PI ? TAU - d : d;
};

// Small studio for reflections: dark room, soft key above, tall strips for the rims.
function studioEnvironment(renderer) {
  const scene = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(12, 12, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 0.32, 0.33), side: THREE.BackSide })
  );
  scene.add(room);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.55, 0.55) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -5.9;
  scene.add(floor);
  const panel = (w, h, k, x, y, z) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide })
    );
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  panel(2.2, 10, 5.0, -5.2, 0.5, 1.6);   // left strip: long rim highlight
  panel(1.4, 10, 3.2, 5.4, 0.5, -0.6);   // right back strip: thin rim
  panel(6, 4, 3.0, -1.0, 5.6, 2.2);      // overhead softbox
  panel(5, 7, 0.9, 1.5, 0.0, 5.6);       // broad frontal fill: soft sheen down the middle
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(scene, 0.035).texture;
  pmrem.dispose();
  scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
  return env;
}

// Body surface details painted into textures (u = around, v = along the body).
// The cylinder uses thetaStart = PI, so u = 0.5 faces the camera.
function bodyTextures() {
  const W = 512, H = 2048;
  const u = (a) => ((((a - Math.PI) / TAU) % 1) + 1) % 1 * W;
  const v = (y) => (CYL_Y1 - y) / (CYL_Y1 - CYL_Y0) * H;   // canvas top = back end
  const mmU = W / (TAU * R);
  const mmV = H / (CYL_Y1 - CYL_Y0);

  const color = document.createElement('canvas');
  const bump = document.createElement('canvas');
  const rough = document.createElement('canvas');
  for (const c of [color, bump, rough]) { c.width = W; c.height = H; }
  const cc = color.getContext('2d');
  const bc = bump.getContext('2d');
  const rc = rough.getContext('2d');

  cc.fillStyle = '#2a2a2c'; cc.fillRect(0, 0, W, H);
  bc.fillStyle = '#808080'; bc.fillRect(0, 0, W, H);
  rc.fillStyle = 'rgb(140,140,140)'; rc.fillRect(0, 0, W, H);   // * material.roughness

  // very fine soft-touch grain in the roughness only (no shimmer in the colour)
  const img = rc.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = 140 + (Math.random() - 0.5) * 22;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = n;
  }
  rc.putImageData(img, 0, 0);

  const yFront = (mm) => Y_FACE + mm;   // distance from the front face
  const yBack = (mm) => Y_BACK - mm;    // distance from the back end

  const stroke = (ctx, style, width, pts) => {
    ctx.strokeStyle = style; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach(([a, y], i) => (i ? ctx.lineTo(u(a), v(y)) : ctx.moveTo(u(a), v(y))));
    ctx.stroke();
  };
  const groove = (pts, w = 0.32) => {
    stroke(bc, '#5a5a5a', w * 2.2 * mmU, pts);
    stroke(bc, '#262626', w * mmU, pts);
    stroke(cc, '#161618', w * mmU, pts);
  };
  const ring = (y, w = 0.28, faint = false) => {
    const yy = v(y);
    bc.fillStyle = faint ? '#6a6a6a' : '#4a4a4a'; bc.fillRect(0, yy - w * mmV, W, w * 2 * mmV);
    bc.fillStyle = faint ? '#4a4a4a' : '#202020'; bc.fillRect(0, yy - w * mmV * 0.5, W, w * mmV);
    if (!faint) { cc.fillStyle = '#18181a'; cc.fillRect(0, yy - w * mmV * 0.5, W, w * mmV); }
  };

  // Long seam: straight from the back, sweeping round in an S near the button.
  const seam = [];
  const sStart = yBack(5.2), sCurve0 = yFront(52), sCurve1 = yFront(42), sEnd = yFront(3.2);
  seam.push([A_SEAM, sStart]);
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const y = sCurve0 + (sCurve1 - sCurve0) * t;
    seam.push([A_SEAM + (100 * D2R - A_SEAM) * smooth(0, 1, t), y]);
  }
  seam.push([100 * D2R, sEnd]);
  groove(seam);

  ring(yBack(4.4));   // end-cap joint
  ring(yFront(3.2), 0.2, true); // nose joint, faint

  // three small holes (mic / LED) near the front
  for (const mm of [13.2, 20.6, 28.0]) {
    const x = u(A_DOTS), y = v(yFront(mm)), r = 0.55 * mmU;
    bc.fillStyle = '#000'; bc.beginPath(); bc.ellipse(x, y, r, r * mmV / mmU, 0, 0, TAU); bc.fill();
    cc.fillStyle = '#050505'; cc.beginPath(); cc.ellipse(x, y, r, r * mmV / mmU, 0, 0, TAU); cc.fill();
    rc.fillStyle = '#404040'; rc.beginPath(); rc.ellipse(x, y, r * 1.3, r * 1.3 * mmV / mmU, 0, 0, TAU); rc.fill();
    bc.fillStyle = '#b0b0b0'; bc.beginPath(); bc.ellipse(x, y - r * 1.15, r * 0.9, r * 0.3, 0, 0, TAU); bc.fill();
  }

  // NeoLAB octagon emblem and status LED slit near the back, button side
  {
    const cx = u(A_BUTTON), cy = v(yBack(9.2)), rr = 1.75;
    const oct = (ctx, s, fill) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i + 0.5) / 8 * TAU;
        const x = cx + Math.cos(a) * rr * s * mmU, y = cy + Math.sin(a) * rr * s * mmV;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    };
    oct(bc, 1.0, '#6a6a6a'); oct(bc, 0.82, '#808080');
    bc.strokeStyle = '#666'; bc.lineWidth = 0.18 * mmU;
    for (const k of [-0.35, 0, 0.35]) {
      bc.beginPath();
      bc.moveTo(cx - 0.8 * mmU, cy + (k - 0.5) * mmV); bc.lineTo(cx + 0.8 * mmU, cy + (k + 0.5) * mmV); bc.stroke();
    }
    oct(cc, 1.0, null); cc.strokeStyle = '#2a2a2c'; cc.lineWidth = 0.14 * mmU; cc.stroke();
    // LED slit
    const lx = u(A_BUTTON - 16 * D2R), ly0 = v(yBack(11.6)), ly1 = v(yBack(14.4));
    for (const [ctx, st, w] of [[bc, '#202020', 0.5], [cc, '#0a0a0a', 0.42], [rc, '#303030', 0.5]]) {
      ctx.strokeStyle = st; ctx.lineWidth = w * mmU; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(lx, ly0); ctx.lineTo(lx, ly1); ctx.stroke();
    }
  }

  const mk = (c, srgb) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 4;
    t.wrapS = THREE.RepeatWrapping;
    return t;
  };
  return { map: mk(color, true), bumpMap: mk(bump, false), roughnessMap: mk(rough, false) };
}

// Arc helper for lathe profiles (points [r, y]).
function arc(cx, cy, rad, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push(new THREE.Vector2(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad));
  }
  return out;
}

// The nib: a tapering shell whose window side is scooped away (camera window).
function nibShellGeometry() {
  const Ln = 8.0, Lmin = 0.6, R0 = 4.6, R1 = 1.3, TH = 0.4;
  const NU = 192, NS = 40;
  const radius = (d) => {
    const t = Math.max(0, (d / Ln - 0.45) / 0.55);
    return R1 + (R0 - R1) * (1 - Math.pow(t, 1.4));
  };
  const len = (a) => {
    const d = angDist(a, A_WINDOW);
    return Lmin + (Ln - Lmin) * smooth(78 * D2R, 112 * D2R, d);
  };
  const pos = [];
  const index = [];
  const grid = (inner) => {
    const base = pos.length / 3;
    for (let j = 0; j <= NS; j++) {
      for (let i = 0; i <= NU; i++) {
        const a = (i / NU) * TAU;
        const d = (j / NS) * len(a);
        const r = radius(d) - (inner ? TH * (1 - 0.45 * d / Ln) : 0);
        pos.push(Math.sin(a) * r, -d, Math.cos(a) * r);
      }
    }
    for (let j = 0; j < NS; j++) {
      for (let i = 0; i < NU; i++) {
        const p = base + j * (NU + 1) + i, q = p + NU + 1;
        if (inner) index.push(p, p + 1, q, p + 1, q + 1, q);
        else index.push(p, q, p + 1, p + 1, q, q + 1);
      }
    }
    return base;
  };
  const o = grid(false);
  const outerCount = index.length;
  const n = grid(true);
  // rim along the cut edge
  const last = NS * (NU + 1);
  for (let i = 0; i < NU; i++) {
    const a = o + last + i, b = n + last + i;
    index.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(index);
  g.addGroup(0, outerCount, 0);                       // outside
  g.addGroup(outerCount, index.length - outerCount, 1); // inside + rim
  g.computeVertexNormals();
  return { geometry: g, Ln, Lmin, R0, R1, TH };
}

function buildPen() {
  const pen = new THREE.Group();
  const tex = bodyTextures();

  const body = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: tex.map,
    roughness: 0.62,
    roughnessMap: tex.roughnessMap,
    bumpMap: tex.bumpMap,
    bumpScale: 1.6,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.55,
    sheen: 0.25,
    sheenRoughness: 0.85,
    sheenColor: new THREE.Color(0x2a2a2e),
    envMapIntensity: 1.0,
  });
  const plain = new THREE.MeshPhysicalMaterial({
    color: 0x2a2a2c, roughness: 0.58, clearcoat: 0.12, clearcoatRoughness: 0.55,
    sheen: 0.25, sheenRoughness: 0.85, sheenColor: new THREE.Color(0x2a2a2e),
  });
  const nibMat = new THREE.MeshPhysicalMaterial({
    color: 0x232325, roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.25, side: THREE.DoubleSide,
  });
  const nibInner = new THREE.MeshPhysicalMaterial({
    color: 0x1e1e20, roughness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.1, side: THREE.DoubleSide,
  });
  const cavity = new THREE.MeshPhysicalMaterial({ color: 0x060607, roughness: 0.7, side: THREE.DoubleSide });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x030304, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05,
  });
  const metal = new THREE.MeshPhysicalMaterial({
    color: 0xdcdcdc, metalness: 1, roughness: 0.26, side: THREE.DoubleSide,
  });
  const darkMetal = new THREE.MeshPhysicalMaterial({ color: 0x8a8a8a, metalness: 1, roughness: 0.35 });

  const SEG = 160;

  // main cylinder
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, CYL_Y1 - CYL_Y0, SEG, 1, true, Math.PI, TAU),
    body
  );
  cyl.position.y = (CYL_Y0 + CYL_Y1) / 2;
  pen.add(cyl);

  // back end: rounded edge into an almost flat cap
  {
    const pts = [new THREE.Vector2(0, Y_BACK + 0.05), new THREE.Vector2(R - BACK_ROUND - 0.6, Y_BACK + 0.02)];
    pts.push(...arc(R - BACK_ROUND, CYL_Y1, BACK_ROUND, Math.PI / 2, 0, 14));
    pts.push(new THREE.Vector2(R, CYL_Y1 - 0.01));
    const g = new THREE.LatheGeometry(pts.reverse(), SEG);
    pen.add(new THREE.Mesh(g, plain));
  }

  // front face: small round-over, then the annulus the nib grows out of
  const nib = nibShellGeometry();
  {
    const pts = [new THREE.Vector2(R, CYL_Y0 + 0.01)];
    pts.push(...arc(R - FRONT_ROUND, CYL_Y0, FRONT_ROUND, 0, -Math.PI / 2, 10));
    pts.push(new THREE.Vector2(nib.R0 + 0.15, Y_FACE));
    pts.push(new THREE.Vector2(nib.R0 - 0.02, Y_FACE));
    const g = new THREE.LatheGeometry(pts, SEG);
    pen.add(new THREE.Mesh(g, plain));
  }

  // nib group (y = 0 at the front face, pointing down)
  const ng = new THREE.Group();
  ng.position.y = Y_FACE;
  pen.add(ng);
  ng.add(new THREE.Mesh(nib.geometry, [nibMat, nibInner]));

  // dark cavity behind the window + camera lens
  {
    const rIn = nib.R0 - nib.TH - 0.02;
    const depth = nib.Lmin * 0.85;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(rIn, rIn, depth, 96, 1, true), cavity);
    wall.position.y = -depth / 2;
    ng.add(wall);
    const floorDisc = new THREE.Mesh(new THREE.CircleGeometry(rIn, 96), glass);
    floorDisc.rotation.x = Math.PI / 2;
    floorDisc.position.y = -depth;
    ng.add(floorDisc);
    // lens with a thin metal ring, set towards the window
    const lx = Math.sin(A_WINDOW) * 1.7, lz = Math.cos(A_WINDOW) * 1.7;
    const lensRing = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.86, 48), darkMetal);
    lensRing.rotation.x = Math.PI / 2;
    lensRing.position.set(lx, -depth - 0.01, lz);
    ng.add(lensRing);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), new THREE.MeshPhysicalMaterial({
      color: 0x0b0d14, roughness: 0.02, clearcoat: 1, metalness: 0.2,
    }));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(lx, -depth - 0.015, lz);
    ng.add(lens);
    // refill sleeve running through the cavity
    const sleeveLen = nib.Ln - depth;
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, sleeveLen, 40), nibMat);
    sleeve.position.y = -depth - sleeveLen / 2;
    ng.add(sleeve);
  }

  // collar holding the refill
  {
    const y0 = -nib.Ln + 0.35, y1 = -nib.Ln - 1.05;
    const pts = [
      new THREE.Vector2(0.78, y1 + 0.02),
      new THREE.Vector2(1.0, y1),
      ...arc(1.12, y1 + 0.22, 0.22, -Math.PI / 2, 0, 5),
      new THREE.Vector2(nib.R1 + 0.02, y0),
    ];
    // simple straight wall from the rounded front up to the shell
    pts.splice(pts.length - 1, 0, new THREE.Vector2(1.18, y1 + 0.5));
    ng.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 64), nibMat));
  }

  // silver refill tip
  {
    const t = -TIP_TO_FACE;
    const pts = [
      new THREE.Vector2(0.0, t),
      new THREE.Vector2(0.14, t + 0.03),
      new THREE.Vector2(0.24, t + 0.12),
      new THREE.Vector2(0.29, t + 0.26),
      new THREE.Vector2(0.33, t + 0.42),
      new THREE.Vector2(0.62, t + 2.05),
      new THREE.Vector2(0.69, t + 2.3),
      new THREE.Vector2(0.72, t + 2.5),
      new THREE.Vector2(0.72, -nib.Ln - 0.4),
    ];
    ng.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 48), metal));
  }

  // side button (rounded slab with a darker inset), on the left edge
  {
    const rr = (w, h, r) => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2 + r, -h / 2);
      s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
      s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
      s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
      s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
      return s;
    };
    const btn = new THREE.Group();
    const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(2.5, 6.3, 1.0), {
      depth: 0.38, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.22, bevelSegments: 4, curveSegments: 10,
    }), new THREE.MeshPhysicalMaterial({
      color: 0x1d1d1f, roughness: 0.48, clearcoat: 0.2, clearcoatRoughness: 0.4,
    }));
    btn.add(slab);
    const inset = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(1.3, 3.0, 0.5), {
      depth: 0.08, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 8,
    }), new THREE.MeshPhysicalMaterial({ color: 0x0e0e0f, roughness: 0.35, clearcoat: 0.5 }));
    inset.position.z = 0.52;
    btn.add(inset);
    const a = A_BUTTON;
    btn.position.set(Math.sin(a) * (R - 0.32), Y_BACK - 68.2, Math.cos(a) * (R - 0.32));
    btn.rotation.y = a;
    pen.add(btn);
  }

  return pen;
}

/* ---------------- mounting ---------------- */

function mount(el) {
  if (el.__pen3d) return;
  el.__pen3d = true;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const baseTilt = parseFloat(el.dataset.tilt ?? '3.5') * D2R;
  const fill = parseFloat(el.dataset.fill ?? '0.8');
  // entrance only if we arrive with the page; a late load just fades in
  const introMs = el.dataset.intro === '0' || performance.now() > 2500 ? 0 : 1400;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    return; // no WebGL: fallback image stays
  }
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;';
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.appendChild(canvas);

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);

  // a soft key from the upper left for a calm specular streak
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(-120, 160, 220);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(16, 1, 50, 3000);

  const tilt = new THREE.Group();    // in-plane tilt + pointer lean
  const spin = new THREE.Group();    // rotation about the long axis
  const pen = buildPen();
  spin.add(pen);
  tilt.add(spin);
  scene.add(tilt);

  // fit
  let mmPerPx = 0.2;
  const fit = () => {
    const w = Math.max(1, el.clientWidth), h = Math.max(1, el.clientHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const visible = LEN / fill;                  // mm visible vertically
    camera.position.set(0, 0, (visible / 2) / Math.tan((camera.fov * D2R) / 2));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    mmPerPx = visible / h;
  };
  fit();

  // state
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  // arrastre del usuario: horizontal gira sobre su eje, vertical lo inclina hacia delante/atrás
  const drag = { on: false, id: null, x: 0, y: 0, vSpin: 0, spin: 0, pitch: 0, roll: 0, moved: 0 };
  let scrollT = 0, scrollC = 0;
  const readScroll = () => { scrollT = Math.min(window.scrollY || 0, 900); };
  readScroll();
  scrollC = scrollT;

  const pose = (time, intro) => {
    const t = time / 1000;
    // intro: rises and settles from a steeper tilt, like the old CSS entrance
    const k = intro;
    const e = 1 - Math.pow(1 - k, 3);
    // vuelta completa lenta sobre su eje (~16 s) + empuje del scroll y del ratón
    const turn = reduce ? 0 : t * 0.4;
    // la silueta pasa de / a \ y vuelve (~16 s por ciclo); en móvil, menos recorrido
    const amp = innerWidth < 600 ? 0.6 : 1;
    const swing = reduce ? 1 : Math.cos(t * 0.39);
    const bob = reduce ? 0 : Math.sin(t * 0.7) * 0.9;
    spin.rotation.y = -0.12 + turn + drag.spin + scrollC * 0.004 + pointer.x * 0.5 + (1 - e) * -1.2;
    const scrollTilt = scrollC * 0.012 * 0.7 * D2R;
    tilt.rotation.z = -(baseTilt * amp * swing + (1 - e) * 10 * D2R) + drag.roll + scrollTilt + pointer.x * -0.05;
    tilt.rotation.x = 0.05 + drag.pitch + pointer.y * 0.07;
    tilt.position.y = bob + scrollC * 0.08 * mmPerPx * 0.7 - (1 - e) * 50 * mmPerPx;
    tilt.position.x = pointer.x * 1.2;
  };

  let shown = false;
  // posición en pantalla de la ventana de la cámara (cerca de la punta), para la anotación
  const stage = el.parentElement;
  const camPt = new THREE.Vector3();
  let offX = 0, offY = 0;
  const measure = () => {
    const a = el.getBoundingClientRect(), b = stage.getBoundingClientRect();
    offX = a.left - b.left; offY = a.top - b.top;
  };
  measure();
  new ResizeObserver(measure).observe(stage);
  const trackTip = () => {
    camPt.set(0, Y_TIP + 6, 0);
    tilt.updateMatrixWorld(true);
    pen.localToWorld(camPt);
    camPt.project(camera);
    const x = offX + (camPt.x + 1) / 2 * el.clientWidth;
    const y = offY + (1 - camPt.y) / 2 * el.clientHeight;
    stage.style.setProperty('--tip-x', x.toFixed(1) + 'px');
    stage.style.setProperty('--tip-y', y.toFixed(1) + 'px');
  };

  const render = (time) => {
    renderer.render(scene, camera);
    trackTip();
    if (!shown) {
      shown = true;
      requestAnimationFrame(() => el.classList.add('has-3d'));
    }
  };

  // static path: one calm frame, re-rendered on resize only
  if (reduce) {
    pose(0, 1);
    render(0);
    new ResizeObserver(() => { fit(); pose(0, 1); render(0); }).observe(el);
    return;
  }

  let start = null;
  let visible = true;
  let raf = 0;
  let last = performance.now();
  const loop = (now) => {
    raf = 0;
    if (!visible || document.hidden) return;
    if (start === null) start = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const damp = 1 - Math.exp(-dt * 3.2);
    pointer.x += (pointer.tx - pointer.x) * damp;
    pointer.y += (pointer.ty - pointer.y) * damp;
    scrollC += (scrollT - scrollC) * (1 - Math.exp(-dt * 6));
    if (!drag.on) {
      drag.spin += drag.vSpin * dt;                       // sigue girando con la inercia
      drag.vSpin *= Math.exp(-dt * 2.2);
      const back = 1 - Math.exp(-dt * 4);                 // vuelve a su postura con un muelle suave
      drag.pitch -= drag.pitch * back;
      drag.roll -= drag.roll * back;
    }
    pose(now, introMs ? Math.min(1, (now - start) / introMs) : 1);
    render(now);
    raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(loop); } };

  new IntersectionObserver((entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    kick();
  }, { rootMargin: '80px' }).observe(el);
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(() => { fit(); kick(); }).observe(el);
  addEventListener('scroll', readScroll, { passive: true });
  // clic y arrastrar
  el.style.pointerEvents = 'auto';
  el.style.cursor = 'grab';
  el.style.touchAction = 'pan-y';                         // en móvil, el scroll vertical sigue funcionando
  el.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    drag.on = true; drag.id = ev.pointerId; drag.x = ev.clientX; drag.y = ev.clientY; drag.vSpin = 0; drag.moved = 0;
    el.setPointerCapture(ev.pointerId);
    el.style.cursor = 'grabbing';
    kick();
  });
  el.addEventListener('pointermove', (ev) => {
    if (!drag.on || ev.pointerId !== drag.id) return;
    const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
    drag.x = ev.clientX; drag.y = ev.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.spin += dx * 0.014;
    drag.vSpin = dx * 0.014 * 60;                         // rad/s aproximado para la inercia
    drag.roll = Math.max(-0.6, Math.min(0.6, drag.roll - dx * 0.004));
    drag.pitch = Math.max(-0.7, Math.min(0.7, drag.pitch + dy * 0.006));
  });
  const release = (ev) => {
    if (!drag.on || ev.pointerId !== drag.id) return;
    drag.on = false;
    el.style.cursor = 'grab';
  };
  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  // un clic sin arrastrar le da un giro rápido
  el.addEventListener('click', () => { if (drag.moved < 5) { drag.vSpin = 9; kick(); } });

  if (finePointer) {
    addEventListener('pointermove', (ev) => {
      pointer.tx = (ev.clientX / innerWidth) * 2 - 1;
      pointer.ty = (ev.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }
  canvas.addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault();
    el.classList.remove('has-3d');
  });
  canvas.addEventListener('webglcontextrestored', () => { shown = false; kick(); });
  kick();
}

export { buildPen, studioEnvironment };

export function mountPen3D(el) {
  try { mount(el); } catch (e) { console.warn('pen3d:', e); }
}

// data-lazy: no se monta hasta que el contenedor se acerca a la pantalla
// (así el boli del final no compite con el de la portada al cargar).
const lazy = 'IntersectionObserver' in window && new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    lazy.unobserve(e.target);
    mountPen3D(e.target);
  }
}, { rootMargin: '900px 0px' });
const auto = () => document.querySelectorAll('[data-pen3d]').forEach((el) => {
  if (lazy && el.hasAttribute('data-lazy')) lazy.observe(el);
  else mountPen3D(el);
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
else auto();
