/* Noah Melis — comportamento della pagina
   GSAP + ScrollTrigger + Lenis (in vendor/). Solo transform e opacity.
   Con "riduci movimento" o senza librerie la pagina resta statica e leggibile. */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasLibs = !!(window.gsap && window.ScrollTrigger);
  const animate = hasLibs && !reduce;

  /* ---------- Menu: stato della barra, scroll-spy, menu mobile ---------- */
  const header = $('.site-header');
  const links = $$('.menu a');
  const burger = $('.burger');
  const menu = $('#menu');
  let lenis = null;

  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Quale capitolo è in vista (Fuori dal lavoro conta come Arco)
  const spyMap = { 'chi-sono': '#chi-sono', mockly: '#mockly', arco: '#arco', fuori: '#arco', contatti: '#contatti' };
  const setCurrent = (href) => links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === href)));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setCurrent(spyMap[e.target.id]); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(spyMap).forEach((id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
    new IntersectionObserver((e) => { if (e[0].isIntersecting) setCurrent(''); }, { rootMargin: '-45% 0px -50% 0px' }).observe($('#top'));
  }

  const setMenu = (open) => {
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    if (lenis) open ? lenis.stop() : lenis.start();
    root.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- Contatori (anche senza animazione mostrano il valore finale) ---------- */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const end = +el.dataset.count;
    const from = +(el.dataset.from || 0);
    const o = { v: from };
    el.textContent = from;
    gsap.to(o, { v: end, duration: 1.6, ease: 'power3.out', snap: { v: 1 }, onUpdate: () => { el.textContent = o.v; } });
  };

  if (!animate) {
    root.classList.remove('js-anim');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  root.dataset.ready = '1';

  /* ---------- Smooth scroll (Lenis) collegato a ScrollTrigger ---------- */
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const target = id.length > 1 ? $(id) : null;
    if (id === '#top') { e.preventDefault(); lenis.scrollTo(0); return; }
    if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: -70 }); }
  }));

  /* ---------- Testo a righe: divide in righe e le fa salire da una maschera ---------- */
  const split = (el) => {
    if (!el._orig) el._orig = el.innerHTML;
    else el.innerHTML = el._orig;
    const label = el.textContent.replace(/\s+/g, ' ').trim();
    const nodes = [...el.childNodes];
    el.textContent = '';
    const vis = document.createElement('span');
    vis.setAttribute('aria-hidden', 'true');
    const words = [];
    nodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/\s+/).filter(Boolean).forEach((w) => {
          const s = document.createElement('span');
          s.textContent = w + ' ';
          vis.appendChild(s); words.push(s);
        });
      } else if (n.nodeName === 'BR') {
        vis.appendChild(document.createElement('br')); words.push('br');
      }
    });
    const sr = document.createElement('span');
    sr.className = 'sr';
    sr.textContent = label;
    el.append(sr, vis);
    // raggruppa per riga in base alla posizione verticale
    const lines = [[]];
    let top = null;
    words.forEach((w) => {
      if (w === 'br') { lines.push([]); top = null; return; }
      const y = w.getClientRects()[0].top;
      if (top !== null && Math.abs(y - top) > 4) lines.push([]);
      top = y;
      lines[lines.length - 1].push(w);
    });
    vis.textContent = '';
    return lines.filter((l) => l.length).map((l) => {
      const ln = document.createElement('span');
      ln.className = 'ln';
      const inner = document.createElement('span');
      l.forEach((w) => inner.append(document.createTextNode(w.textContent)));
      ln.appendChild(inner);
      vis.appendChild(ln);
      return inner;
    });
  };

  const splitTargets = $$('[data-split], .sec-head h2');
  const setupSplit = (el, instant) => {
    if (el._st) el._st.kill();
    const lines = split(el);
    el.style.visibility = 'visible';
    if (instant) { gsap.set(lines, { yPercent: 0 }); return; }
    gsap.set(lines, { yPercent: 110 });
    const tl = gsap.to(lines, {
      yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true, onEnter: () => { el._done = true; } }
    });
    el._st = tl.scrollTrigger;
  };
  const initSplit = () => splitTargets.forEach((el) => setupSplit(el, false));
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
    initSplit();
    ScrollTrigger.refresh();
  });
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { splitTargets.forEach((el) => setupSplit(el, !!el._done)); ScrollTrigger.refresh(); }, 250);
  });

  /* ---------- Ingresso della hero ---------- */
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro
    .to('.target circle', { strokeDashoffset: 0, duration: 1.6, stagger: 0.12, ease: 'power2.inOut' }, 0)
    .to('.hero-photo', { opacity: 1, duration: 1.2 }, 0.1)
    .fromTo('.hero-photo img', { scale: 1.18 }, { scale: 1, duration: 1.8 }, 0.1)
    .to('.hero-name .ln>span', { yPercent: 0, duration: 1.2, stagger: 0.12 }, 0.25)
    .to('.hero-line', { opacity: 1, y: 0, duration: 1 }, 0.7)
    .to('.cue', { opacity: 1, duration: 1 }, 1.1);
  gsap.set('.hero-name .ln>span', { y: 0, yPercent: 105 }); // y:0 azzera il valore letto dal CSS
  gsap.set('.hero-line', { y: 18 });
  // il bersaglio della hero cresce piano mentre si scorre
  gsap.to('.target', { scale: 1.14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Reveal di blocchi: sale e compare ---------- */
  const revealSel = '.facts>div, .stats li, .chi-photo figcaption, .mk-roles, .work, .demos li, .note, .mk-cta, .arco-note, .ph figcaption, .fuori-text dl>div, .fuori-photos li, .cta-lead, .clinks li';
  ScrollTrigger.batch(revealSel, {
    start: 'top 90%', once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.09, overwrite: true })
  });

  /* ---------- Titoli di sezione: numero e linea ---------- */
  $$('.sec-head').forEach((h) => {
    gsap.to($('.sec-no', h), { opacity: 1, duration: 0.8, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    gsap.to($('.sec-rule', h), { opacity: 1, scaleX: 1, duration: 1.4, ease: 'power3.inOut', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });

  /* ---------- Parallax leggero sulle foto ---------- */
  $$('[data-parallax]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -7, scale: 1.16 }, {
      yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- Numeri che contano ---------- */
  counters.forEach((el) => ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => runCounter(el) }));

  /* ---------- Bersagli: si disegnano quando arrivano in vista ---------- */
  const drawRings = (svg, extra) => {
    const circles = $$('circle:not(.dot)', svg);
    const tl = gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 85%', once: true } });
    tl.to(circles, { strokeDashoffset: 0, duration: 1.6, stagger: 0.14, ease: 'power2.inOut' });
    const dot = $('.dot', svg);
    if (dot) { gsap.set(dot, { scale: 0, transformOrigin: '50% 50%' }); tl.to(dot, { scale: 1, duration: 0.7, ease: 'back.out(2)' }, '-=0.6'); }
    if (extra) extra(tl);
  };
  $$('.sep-target, .cta-target').forEach((svg) => drawRings(svg));
  $$('.sep-line').forEach((l) => gsap.to(l, { scaleX: 1, duration: 1.4, ease: 'power3.inOut', scrollTrigger: { trigger: l, start: 'top 92%', once: true } }));
  // il bersaglio finale scorre un po' più piano del resto
  gsap.fromTo('.cta-target', { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.contatti', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Hover magnetico sulle card dei lavori ---------- */
  if (fine) {
    $$('.work').forEach((card) => {
      const shot = $('.shot', card);
      const phone = $('.phone', card);
      const sx = gsap.quickTo(shot, 'x', { duration: 0.7, ease: 'power3' });
      const sy = gsap.quickTo(shot, 'y', { duration: 0.7, ease: 'power3' });
      const px = gsap.quickTo(phone, 'x', { duration: 0.7, ease: 'power3' });
      const py = gsap.quickTo(phone, 'y', { duration: 0.7, ease: 'power3' });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        sx(nx * 14); sy(ny * 10); px(nx * 30); py(ny * 22);
      });
      card.addEventListener('pointerleave', () => { sx(0); sy(0); px(0); py(0); });
    });

    /* ---------- Cursore custom: anello + punto ---------- */
    const cur = document.createElement('div');
    cur.className = 'cursor';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<i></i><b></b>';
    document.body.appendChild(cur);
    root.classList.add('has-cursor');
    const ring = $('i', cur), dotEl = $('b', cur);
    gsap.set([ring, dotEl], { xPercent: -50, yPercent: -50 });
    const rx = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
    const dx = gsap.quickTo(dotEl, 'x', { duration: 0.08 });
    const dy = gsap.quickTo(dotEl, 'y', { duration: 0.08 });
    let shown = false;
    addEventListener('pointermove', (e) => {
      if (!shown) { shown = true; gsap.set([ring, dotEl], { x: e.clientX, y: e.clientY }); cur.classList.add('on'); }
      rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
      cur.classList.toggle('big', !!(e.target.closest && e.target.closest('a, button, .work, [data-cursor]')));
    }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('on'));
    document.addEventListener('pointerenter', () => { if (shown) cur.classList.add('on'); });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
