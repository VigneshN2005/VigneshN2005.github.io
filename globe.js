(function () {
  const c = document.getElementById('globe');
  if (!c) return;
  const g = c.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = innerWidth < 760 ? 650 : 1100;
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), t = golden * i;
    pts.push([Math.cos(t) * r, y, Math.sin(t) * r]);
  }
  const rings = [0, 1, 2].map(k => ({ tilt: 0.35 + k * 0.42, rad: 1.25 + k * 0.17, speed: 0.4 + k * 0.25, phase: k * 2 }));
  let W, H, R, dpr, rotY = 0, rotX = -0.25, mx = 0, my = 0, tx = 0, ty = 0, visible = true;

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const b = c.getBoundingClientRect();
    W = b.width; H = b.height; R = Math.min(W, H) * 0.34;
    c.width = W * dpr; c.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', size); size();
  addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - 0.5); ty = (e.clientY / innerHeight - 0.5); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(c);

  function project(x, y, z) {
    const cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
    let X = x * cy - z * sy, Z = x * sy + z * cy;
    let Y = y * cx - Z * sx; Z = y * sx + Z * cx;
    const p = 3 / (3 + Z);
    return [W / 2 + X * R * p, H / 2 + Y * R * p, Z, p];
  }

  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible) return;
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    rotY = (reduce ? 0.6 : t * 0.00012) + mx * 0.9;
    rotX = -0.25 + my * 0.5;
    g.clearRect(0, 0, W, H);

    const halo = g.createRadialGradient(W / 2, H / 2, R * 0.2, W / 2, H / 2, R * 1.5);
    halo.addColorStop(0, 'rgba(125,249,201,0.07)'); halo.addColorStop(1, 'rgba(8,9,13,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(W / 2, H / 2, R * 1.5, 0, 7); g.fill();

    for (const p of pts) {
      const [x, y, z, s] = project(p[0], p[1], p[2]);
      const front = (1 - z) / 2;
      const a = 0.08 + front * 0.75;
      const mix = (p[1] + 1) / 2;
      const r = Math.round(125 + (139 - 125) * mix), gg = Math.round(249 + (124 - 249) * mix), b = Math.round(201 + (255 - 201) * mix);
      g.fillStyle = `rgba(${r},${gg},${b},${a})`;
      const sz = (0.6 + front * 1.4) * s;
      g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }

    rings.forEach((rg, k) => {
      g.beginPath();
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const x = Math.cos(a) * rg.rad, z = Math.sin(a) * rg.rad;
        const y = z * Math.sin(rg.tilt), zz = z * Math.cos(rg.tilt);
        const [X, Y] = project(x, y, zz);
        i ? g.lineTo(X, Y) : g.moveTo(X, Y);
      }
      g.strokeStyle = `rgba(255,255,255,${0.05 + k * 0.015})`; g.lineWidth = 1; g.stroke();
      const a = (reduce ? 1 : t * 0.0004 * rg.speed) + rg.phase;
      const x = Math.cos(a) * rg.rad, z = Math.sin(a) * rg.rad;
      const [X, Y, Z] = project(x, z * Math.sin(rg.tilt), z * Math.cos(rg.tilt));
      const col = k === 1 ? '255,195,107' : k === 2 ? '139,124,255' : '125,249,201';
      const glow = g.createRadialGradient(X, Y, 0, X, Y, 14);
      glow.addColorStop(0, `rgba(${col},${Z < 0 ? 0.9 : 0.35})`); glow.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = glow; g.beginPath(); g.arc(X, Y, 14, 0, 7); g.fill();
      g.fillStyle = `rgba(${col},1)`; g.beginPath(); g.arc(X, Y, 2.4, 0, 7); g.fill();
    });
  }
  requestAnimationFrame(frame);
})();
