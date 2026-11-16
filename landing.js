(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // stars, placed once
  $$('[data-stars]').forEach((box) => {
    const n = +box.dataset.stars;
    let seed = n * 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.style.left = rnd() * 100 + '%';
      s.style.top = rnd() * 100 + '%';
      s.style.setProperty('--d', 3 + rnd() * 4 + 's');
      s.style.setProperty('--t', -rnd() * 6 + 's');
      if (rnd() > 0.85) s.style.width = s.style.height = '3px';
      box.appendChild(s);
    }
  });

  // hero: the horizon draws (CSS), the arc follows, then the sun rises along it to where it sits in the logo
  const hero = $('#hero');
  const arc = $('#heroArc');
  const sun = $('#heroSun');
  const glow = $('#heroGlow');
  const art = $('.sunart');
  const LOGO_AT = 0.806; // the logo's sun sits 80.6% of the way along its arc
  const arcLen = arc.getTotalLength();
  let introDone = reduce;
  const placeSun = (t, scale = 1) => {
    const pt = arc.getPointAtLength(arcLen * t);
    sun.setAttribute('cx', pt.x);
    sun.setAttribute('cy', pt.y);
    glow.setAttribute('cx', pt.x);
    glow.setAttribute('cy', pt.y);
    glow.setAttribute('r', 210 * scale);
  };
  if (reduce) {
    placeSun(LOGO_AT);
    hero.style.setProperty('--rise', 1);
  } else {
    arc.style.strokeDasharray = arcLen;
    arc.style.strokeDashoffset = arcLen;
    placeSun(0, 0.3);
    sun.style.opacity = 0;
    glow.style.opacity = 0;
    const t0 = performance.now();
    const intro = (now) => {
      const e = now - t0;
      arc.style.strokeDashoffset = arcLen * (1 - easeOut(clamp((e - 450) / 1300)));
      const k = easeOut(clamp((e - 900) / 2100));
      sun.style.opacity = clamp((e - 900) / 250);
      glow.style.opacity = k;
      placeSun(LOGO_AT * k, 0.3 + k * 0.7);
      hero.style.setProperty('--rise', k);
      if (e < 3100) requestAnimationFrame(intro);
      else introDone = true;
    };
    requestAnimationFrame(intro);
  }

  // nav hides while scrolling down, comes back on the way up
  const nav = $('#nav');
  let lastY = scrollY;

  // a day: clock, screens, sky and sun follow the scroll
  const day = $('#day');
  const beats = $$('.beat', day);
  const shots = $$('.screen img', day);
  const dots = $$('.dots i', day);
  const clock = $('#clock');
  const sky = $('.day-sky', day);
  const dayPath = $('#dayPath');
  const daySun = $('#daySun');
  const dayLen = dayPath.getTotalLength();
  let active = -1;
  const setBeat = (i) => {
    if (i === active) return;
    active = i;
    beats.forEach((b, k) => b.classList.toggle('on', k === i));
    // the new screen wipes up over the one it replaces
    shots.forEach((s, k) => {
      const was = s.classList.contains('on') && k !== i;
      s.classList.toggle('was', was);
      s.classList.toggle('on', k === i);
    });
    dots.forEach((d, k) => d.classList.toggle('on', k <= i));
    const b = beats[i].dataset;
    clock.replaceChildren(...[...b.time].map((c, n) => {
      const d = document.createElement('span');
      d.textContent = c;
      d.style.animationDelay = n * 40 + 'ms';
      return d;
    }));
    if (!reduce) {
      clock.classList.remove('roll');
      void clock.offsetWidth;
      clock.classList.add('roll');
    }
    sky.style.setProperty('--g1', b.g1);
    sky.style.setProperty('--g2', b.g2);
    sky.style.setProperty('--gx', b.gx);
    sky.style.setProperty('--gy', b.gy);
  };

  // privacy: the manifesto lights line by line
  const lines = $$('.manifesto span');

  // finale: the sun finishes its arc and sets
  const finale = $('#get');
  const setArc = $('#setArc');
  const setSun = $('#setSun');
  const setGlow = $('#setGlow');
  // where the sun's lower edge meets the horizon (radius 34 on a 236 arc ending at y 600)
  const REST_AT = 1 - Math.asin(36 / 236) / Math.PI;
  const setLen = setArc.getTotalLength();

  const onScroll = () => {
    const y = scrollY;
    const vh = innerHeight;
    nav.classList.toggle('hide', y > lastY && y > vh * 0.6);
    if (introDone && !reduce) {
      const h = clamp(y / vh);
      art.style.setProperty('--lift', (h * 60).toFixed(1));
      placeSun(LOGO_AT + (1 - LOGO_AT) * h * 0.6, 1 + h * 0.4);
    }
    lastY = y;

    const top = day.offsetTop;
    const p = clamp((y - top) / (day.offsetHeight - vh));
    day.style.setProperty('--p', reduce ? 0 : p.toFixed(3));
    setBeat(Math.min(beats.length - 1, Math.floor(p * beats.length * 0.999)));
    const pt = dayPath.getPointAtLength(dayLen * (0.06 + p * 0.9));
    daySun.setAttribute('cx', pt.x);
    daySun.setAttribute('cy', pt.y);

    lines.forEach((l) => l.classList.toggle('lit', l.getBoundingClientRect().top < vh * 0.72));

    const fr = finale.getBoundingClientRect();
    const s = clamp((vh - fr.top) / (vh + fr.height * 0.3));
    finale.style.setProperty('--set', s.toFixed(3));
    // the sun stays on its arc: from where it sits in the logo down to the arc's foot, resting just on the horizon
    const sp = setArc.getPointAtLength(setLen * (LOGO_AT + (REST_AT - LOGO_AT) * easeOut(clamp(s * 1.25))));
    setSun.setAttribute('cx', sp.x);
    setSun.setAttribute('cy', sp.y);
    setGlow.setAttribute('cx', sp.x);
    setGlow.setAttribute('cy', sp.y);
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  // reveals and one-time builds
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in', 'on');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$('.rv').forEach((el) => io.observe(el));
  $$('.bento .tile, .locks .lock').forEach((el, n) => el.style.setProperty('--rd', (n % 3) * 0.09 + 's'));

  // twelve weeks: planned, done, rest
  const heat = $('#heat');
  for (let i = 0; i < 84; i++) {
    const c = document.createElement('i');
    const dow = i % 7;
    const v = (Math.sin(i * 12.9898) * 43758.5453) % 1;
    const r = Math.abs(v);
    c.className = dow === 6 && r < 0.6 ? 'rest' : r > 0.25 ? (r > 0.55 ? 'l3' : 'l2') : r > 0.1 ? 'l1' : '';
    c.style.transitionDelay = (reduce ? 0 : Math.floor(i / 7) * 45 + dow * 12) + 'ms';
    heat.appendChild(c);
  }
  io.observe(heat);

  // the checklist demo
  $$('.pill').forEach((b) => b.addEventListener('click', () => b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true')));

  // log in words
  const typed = $('#typed');
  const match = $('#match');
  const phrases = [
    ['drank 2 glasses', 'Water · +500 ml'],
    ['20 min yoga', 'Yoga · 20 min'],
    ['took vitamin d', 'Morning meds · Vitamin D3 ✓'],
    ['skincare done', 'Evening skincare · done'],
  ];
  if (reduce) {
    typed.textContent = phrases[0][0];
    match.textContent = phrases[0][1];
    match.classList.add('on');
  } else {
    let k = 0;
    const run = async () => {
      const [say, found] = phrases[k++ % phrases.length];
      match.classList.remove('on');
      typed.textContent = '';
      for (const ch of say) { typed.textContent += ch; await new Promise((r) => setTimeout(r, 55 + Math.random() * 50)); }
      await new Promise((r) => setTimeout(r, 350));
      match.textContent = found;
      match.classList.add('on');
      setTimeout(run, 2400);
    };
    run();
  }

  // the zero line cycles what never leaves
  const zw = $('#zeroWord');
  const words = ['routines', 'photos', 'medicines', 'diary', 'mood', 'location', 'routines'];
  if (!reduce) {
    let w = 0;
    setInterval(() => { zw.textContent = words[++w % words.length]; }, 1600);
  }

  // tiles lean toward the pointer (mouse only)
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    $$('.tile').forEach((t) => {
      t.addEventListener('pointermove', (e) => {
        const r = t.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const yy = (e.clientY - r.top) / r.height;
        t.style.setProperty('--ry', (x - 0.5) * 6 + 'deg');
        t.style.setProperty('--rx', (0.5 - yy) * 6 + 'deg');
        t.style.setProperty('--mx', x * 100 + '%');
        t.style.setProperty('--my', yy * 100 + '%');
      });
      t.addEventListener('pointerleave', () => { t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg'); });
    });
  }

  // the film loads only when it's near the screen
  const film = $('#film');
  new IntersectionObserver((entries, o) => {
    if (!entries[0].isIntersecting) return;
    film.src = film.dataset.src;
    if (reduce) film.controls = true;
    else film.play().catch(() => { film.controls = true; });
    o.disconnect();
  }, { rootMargin: '200px' }).observe(film);
})();
