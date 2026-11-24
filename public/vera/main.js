document.documentElement.classList.add('js');

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Entradas escalonadas por sección, una sola vez.
const reveal = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('seen');
    reveal.unobserve(e.target);
  }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('section').forEach((sec) => {
  sec.querySelectorAll('.rv').forEach((el, i) => el.style.setProperty('--d', Math.min(i, 6)));
});
document.querySelectorAll('.rv').forEach((el) => reveal.observe(el));

// Así funciona: el boli va trazando un camino de tinta entre los pasos según bajas.
const trail = document.querySelector('.trail');
if (trail) {
  const svg = trail.querySelector('.trail-svg');
  const ink = trail.querySelector('.trail-ink');
  const capTip = trail.querySelector('.trail-tip');
  const penImg = trail.querySelector('.trail-pen');
  const nums = [...trail.querySelectorAll('.num')];
  let segs = [], samples = [], marks = [], stops = [], anchors = [], anchorPts = [], total = 0, raf = 0;

  const build = () => {
    const box = trail.getBoundingClientRect();
    const rel = (el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top, top: r.top - box.top, bottom: r.bottom - box.top };
    };
    const pts = nums.map(rel);
    const photos = [...trail.querySelectorAll('.tstep figure')].map(rel);
    const narrow = innerWidth <= 900;
    // Ruido fijo (siempre el mismo trazo) para que la línea tiemble como hecha a mano.
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
    const wp = [];                              // puntos de paso; la curva los une con Catmull-Rom
    const add = (x, y, j = 0) => wp.push({ x: x + rnd() * j, y: y + rnd() * j * 0.5 });
    anchors = [];
    if (narrow) {
      // En móvil, una sola línea por el margen con un arco suave entre números:
      // nada de eses cortas, que en poco espacio parecen un trazo doble.
      add(pts[0].x, pts[0].y - 96);
      pts.forEach((p, i) => {
        anchors.push(wp.length); add(p.x, p.y);
        const next = pts[i + 1];
        if (next) add(p.x + (i % 2 ? -7 : 7), (p.y + next.y) / 2);
      });
      add(pts[pts.length - 1].x, pts[pts.length - 1].y + 80);
    } else {
      // Como un trazo largo de rotulador: curvas amplias que se abren hacia el hueco bajo cada texto,
      // cruzan por el espacio entre pasos y caen sobre el número siguiente.
      const texts = [...trail.querySelectorAll('.tstep .ttext')].map(rel);
      add(pts[0].x - 8, -30); add(pts[0].x + 6, pts[0].y * 0.45);
      pts.forEach((a, i) => {
        anchors.push(wp.length); add(a.x, a.y);
        const ph = photos[i], b = pts[i + 1];
        if (!b) { add(a.x + 18, (a.y + ph.bottom) / 2); add(a.x - 6, ph.bottom + 40); return; }
        const s = Math.sign(b.x - a.x);
        const gapTop = ph.bottom, gapBot = photos[i + 1].top, yc = (gapTop + gapBot) / 2;
        const bulge = i === 0 ? 74 : 26;                       // el primer tramo se abre más, como en el boceto
        const by = Math.min(gapTop + (gapBot - gapTop) * 0.15, Math.max(texts[i].bottom + 40, (a.y + gapTop) / 2 + 40));
        add(a.x - s * bulge, by);
        add(a.x - s * bulge * 0.35, yc - 6);
        add(b.x + s * (i === 0 ? 96 : 40), yc + 6);
        add(b.x + s * (i === 0 ? 118 : 30), Math.min(b.y - 60, gapBot + 60));
      });
    }
    let d = `M${wp[0].x} ${wp[0].y}`;
    for (let i = 0; i < wp.length - 1; i++) {
      const p0 = wp[i - 1] || wp[i], p1 = wp[i], p2 = wp[i + 1], p3 = wp[i + 2] || p2;
      d += ` C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
    }
    anchorPts = anchors.map((k) => wp[k]);
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    ink.setAttribute('d', d);
    // La tinta se interrumpe alrededor de cada número con extremos redondos (no tapada por un círculo blanco).
    const holes = nums.map((n, i) => ({ ...pts[i], r: n.offsetWidth / 2 - 4 }));
    const full = ink.getTotalLength();
    // Cada tramo es su propio trazo: el discontinuo se reinicia en cada subtrayecto, así que no pueden compartir uno.
    const parts = [];
    let cur = null, last = null, acc = 0;
    for (let l = 0; l <= full + 1.5; l += 1.5) {
      const q = ink.getPointAtLength(Math.min(l, full));
      if (holes.some((h) => Math.hypot(q.x - h.x, q.y - h.y) < h.r)) { cur = null; continue; }
      if (!cur) { cur = { d: `M${q.x.toFixed(1)} ${q.y.toFixed(1)}`, start: acc, len: 0 }; parts.push(cur); }
      else { const step = Math.hypot(q.x - last.x, q.y - last.y); cur.d += `L${q.x.toFixed(1)} ${q.y.toFixed(1)}`; cur.len += step; acc += step; }
      last = q;
    }
    ink.setAttribute('d', parts.map((p) => p.d).join(''));   // geometría continua para colocar el boli (invisible)
    segs.forEach((s) => s.el.remove());
    segs = parts.map((p) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('class', 'trail-seg');
      el.setAttribute('d', p.d);
      svg.insertBefore(el, ink);
      return { el, start: p.start, len: p.len };
    });
    total = ink.getTotalLength();
    samples = [];
    for (let l = 0; l <= total; l += 3) samples.push({ l, ...(({ x, y }) => ({ x, y }))(ink.getPointAtLength(l)) });
    const nearest = (p) => samples.reduce((best, s) => (Math.hypot(s.x - p.x, s.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? s : best));
    marks = anchorPts.map((p) => nearest(p).l);
    // tramos de scroll → longitud: así el boli avanza a ritmo constante, también dentro del rizo
    stops = [{ y: samples[0].y, l: 0 }, ...anchorPts.map((p, i) => ({ y: p.y, l: marks[i] })), { y: samples[samples.length - 1].y, l: total }];
    draw();
  };

  const draw = () => {
    raf = 0;
    if (!samples.length) return;
    let len = total;
    if (!reduce) {
      const target = innerHeight * 0.62 - trail.getBoundingClientRect().top;   // la punta va al 62 % de la pantalla
      len = 0;
      for (let i = 0; i < stops.length - 1; i++) {
        const A = stops[i], B = stops[i + 1];
        if (target >= B.y) { len = B.l; continue; }
        if (target > A.y) len = A.l + (B.l - A.l) * (target - A.y) / Math.max(1, B.y - A.y);
        break;
      }
    }
    segs.forEach((s) => {
      const shown = Math.max(0, Math.min(s.len, len - s.start));
      s.el.style.strokeDasharray = `${shown} ${s.len + 20}`;
      s.el.style.visibility = shown > 0.5 ? 'visible' : 'hidden';   // un trazo de largo 0 pintaría un punto
    });
    const p = ink.getPointAtLength(len);
    // punta redonda a mano: algunos navegadores cortan en recto el final del trazo discontinuo
    capTip.setAttribute('cx', p.x); capTip.setAttribute('cy', p.y);
    capTip.style.visibility = len > 0.5 && len < total - 0.5 ? 'visible' : 'hidden';
    const ahead = ink.getPointAtLength(Math.min(total, len + 6));
    const lean = Math.max(-12, Math.min(12, (ahead.x - p.x) * 1.5));      // se inclina un poco hacia donde va
    const h = penImg.offsetHeight, w = penImg.offsetWidth;
    penImg.style.transform = `translate(${p.x - w / 2}px, ${p.y - h}px) rotate(${22 + lean}deg)`;
    nums.forEach((n, i) => n.classList.toggle('on', len >= marks[i] - 4));
    trail.classList.toggle('ready', len > 2 && len < total - 2);
  };

  const queue = () => { if (!raf) raf = requestAnimationFrame(draw); };
  addEventListener('scroll', queue, { passive: true });
  new ResizeObserver(() => build()).observe(trail);
  addEventListener('load', build);
  document.fonts?.ready.then(build);
  build();
}

// Portada: la conversación aparece burbuja a burbuja junto al boli.
const bubbles = [...document.querySelectorAll('.bubble')];
bubbles.forEach((b, i) => setTimeout(() => b.classList.add('on'), reduce ? 0 : 900 + i * 900));

// El boli se inclina un poco al hacer scroll.
const pen = document.querySelector('.pen');
if (!reduce && pen) {
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = Math.min(scrollY, 900);
      pen.style.animation = 'none';
      pen.style.opacity = 1;
      pen.style.transform = `translateX(-50%) translateY(${y * -0.08}px) rotate(${18 - y * 0.012}deg)`;
      ticking = false;
    });
  }, { passive: true });
}

// Frase fija que se va llenando de tinta, palabra a palabra, según bajas.
const fill = document.querySelector('.fill');
if (fill) {
  const text = fill.querySelector('.fill-text');
  const words = [];
  const split = (node) => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.textContent = part;
          words.push(w);
          frag.append(w);
        });
        n.replaceWith(frag);
      } else split(n);
    }
  };
  split(text);
  let raf = 0;
  const paint = () => {
    raf = 0;
    const r = fill.getBoundingClientRect();
    const run = Math.max(1, r.height - innerHeight);
    // margen al principio y al final para que la frase entre vacía y se quede llena un rato
    const p = reduce ? 1 : Math.min(1, Math.max(0, (-r.top / run - 0.08) / 0.78));
    const at = p * words.length;
    words.forEach((w, i) => w.style.setProperty('--f', `${Math.min(1, Math.max(0, at - i)) * 100}%`));
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paint); }, { passive: true });
  addEventListener('resize', paint);
  paint();
}

// Aviso de cookies: el mismo texto y la misma clave que el resto de weshearn.com,
// así lo que elijas aquí vale para toda la web (y al revés).
const consent = (() => { try { return localStorage.getItem('cookie-consent'); } catch { return null; } })();
if (consent === null) {
  const box = document.createElement('div');
  box.className = 'cookies';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Aviso de cookies');
  box.innerHTML = '<p>Solo usamos almacenamiento técnico necesario para que la web funcione. No usamos cookies de analítica ni de publicidad.</p>'
    + '<div><button class="btn btn-sm btn-light" value="rejected">Rechazar</button><button class="btn btn-sm" value="accepted">Aceptar</button></div>';
  box.addEventListener('click', (ev) => {
    const choice = ev.target.closest('button')?.value;
    if (!choice) return;
    try { localStorage.setItem('cookie-consent', choice); } catch { /* vuelve a salir en la próxima visita */ }
    box.remove();
  });
  document.body.append(box);
}
