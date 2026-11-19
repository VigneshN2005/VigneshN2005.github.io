(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.body.classList.add('loading');

  /* ---------- preloader ---------- */
  const count = $('#loaderCount'), bar = $('#loaderBar');
  let n = 0;
  const imgs = $$('img').filter(i => i.loading !== 'lazy');
  let loaded = 0;
  imgs.forEach(i => (i.complete ? loaded++ : i.addEventListener('load', () => loaded++, { once: true })));
  const tick = setInterval(() => {
    const target = Math.min(100, 40 + (loaded / Math.max(1, imgs.length)) * 60);
    n += Math.max(1, (target - n) * 0.18);
    if (n > 100) n = 100;
    count.textContent = String(Math.floor(n)).padStart(2, '0');
    bar.style.width = n + '%';
    if (n >= 99.5) { clearInterval(tick); finish(); }
  }, reduce ? 5 : 28);
  function finish() {
    count.textContent = '100';
    setTimeout(() => {
      $('#loader').classList.add('done');
      document.body.classList.remove('loading');
      document.body.classList.add('ready');
    }, reduce ? 0 : 250);
  }

  /* ---------- split headings into words ---------- */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(ch => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) {
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.style.setProperty('--i', i++);
          ch.replaceWith(w); s.appendChild(ch); w.appendChild(s);
        }
      });
    };
    walk(el);
  });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      e.target.querySelectorAll('[data-count]').forEach(countUp);
      if (e.target.matches('[data-count]')) countUp(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal],[data-split]').forEach(el => io.observe(el));
  // stagger siblings in grids
  $$('.stats,.skills,.extras').forEach(g => [...g.children].forEach((c, i) => c.style.setProperty('--rd', i * 0.08 + 's')));

  function countUp(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, suf = el.dataset.suffix || '';
    const t0 = performance.now(), dur = reduce ? 1 : 1600;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = (end * e).toFixed(dec) + (p === 1 ? suf : '');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- rotating words ---------- */
  const rot = $$('#rotator span');
  let ri = 0;
  if (rot.length) {
    rot[0].classList.add('on');
    setInterval(() => {
      const cur = rot[ri]; cur.classList.remove('on'); cur.classList.add('out');
      setTimeout(() => cur.classList.remove('out'), 700);
      ri = (ri + 1) % rot.length; rot[ri].classList.add('on');
    }, 2200);
  }

  /* ---------- nav: progress, hide on scroll, active link ---------- */
  const nav = $('#nav'), prog = $('#progress');
  let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h ? y / h : 0})`;
    nav.classList.toggle('hide', y > lastY && y > 300 && !nav.classList.contains('open'));
    lastY = y;
  }, { passive: true });
  const secs = $$('section[id]');
  const navIo = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('[data-nav]').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => navIo.observe(s));
  $('#burger').addEventListener('click', () => nav.classList.toggle('open'));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  /* ---------- cursor ---------- */
  if (fine && !reduce) {
    document.body.classList.add('has-cursor');
    const dot = $('#cursor'), ring = $('#cursorRing');
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; dot.style.transform = `translate(${x}px,${y}px)`; });
    (function loop() { rx += (x - rx) * 0.16; ry += (y - ry) * 0.16; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
    $$('a,button,.slide').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.25}px,${(e.clientY - b.top - b.height / 2) * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- tilt cards + spotlight ---------- */
  if (fine && !reduce) $$('.tilt').forEach(el => {
    el.style.transition = 'transform .6s cubic-bezier(.22,1,.36,1), border-color .5s, box-shadow .5s';
    el.addEventListener('pointermove', e => {
      const b = el.getBoundingClientRect(), px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
      el.style.transform = `perspective(900px) rotateY(${(px - 0.5) * 10}deg) rotateX(${(0.5 - py) * 10}deg) translateZ(0)`;
      el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- sliders ---------- */
  $$('[data-slider]').forEach(sl => {
    const track = $('.slider__track', sl), slides = $$('.slide', sl), dots = $('.slider__dots', sl), vp = $('.slider__viewport', sl);
    let i = 0, timer, startX = null, dx = 0;
    slides.forEach((_, k) => {
      const b = document.createElement('button'); b.setAttribute('aria-label', 'Slide ' + (k + 1));
      b.addEventListener('click', () => go(k)); dots.appendChild(b);
    });
    function go(k) {
      i = (k + slides.length) % slides.length;
      track.style.transform = `translateX(${-i * 100}%)`;
      slides.forEach((s, j) => s.classList.toggle('active', j === i));
      [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
    }
    const auto = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 4800); };
    $('[data-prev]', sl).addEventListener('click', () => { go(i - 1); auto(); });
    $('[data-next]', sl).addEventListener('click', () => { go(i + 1); auto(); });
    sl.addEventListener('mouseenter', () => clearInterval(timer));
    sl.addEventListener('mouseleave', auto);
    vp.addEventListener('pointerdown', e => { startX = e.clientX; dx = 0; track.style.transition = 'none'; });
    addEventListener('pointermove', e => {
      if (startX === null) return;
      dx = e.clientX - startX;
      track.style.transform = `translateX(calc(${-i * 100}% + ${dx}px))`;
    });
    addEventListener('pointerup', () => {
      if (startX === null) return;
      track.style.transition = '';
      if (Math.abs(dx) > 60) go(i + (dx < 0 ? 1 : -1)); else go(i);
      if (Math.abs(dx) < 6) {
        const s = slides[i]; openLightbox($('img', s).src, $('figcaption', s).textContent);
      }
      startX = null; auto();
    });
    go(0);
    new IntersectionObserver(([e]) => (e.isIntersecting ? auto() : clearInterval(timer))).observe(sl);
  });

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox');
  function openLightbox(src, cap) {
    $('img', lb).src = src; $('p', lb).textContent = cap || '';
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
  }
  const closeLb = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); };
  lb.addEventListener('click', e => { if (e.target === lb || e.target.closest('.lightbox__close')) closeLb(); });
  addEventListener('keydown', e => e.key === 'Escape' && closeLb());

  /* ---------- parallax on hero ---------- */
  const globe = $('#globe');
  addEventListener('scroll', () => {
    if (scrollY < innerHeight * 1.2) globe.style.transform = `translateY(calc(-50% + ${scrollY * 0.25}px))`;
  }, { passive: true });

  /* ---------- IST clock ---------- */
  const clock = $('#clock');
  const setClock = () => { clock.textContent = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }); };
  setClock(); setInterval(setClock, 20000);
})();
