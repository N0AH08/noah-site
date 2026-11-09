/* noahx — apertura, elenco, Arco (bersaglio e corsia), viaggi, musica */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');
  root.classList.remove('no-js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var desk = matchMedia('(min-width: 901px)');
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var sm = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  /* ---------- menu ---------- */
  var burger = d.querySelector('.burger'), menu = d.getElementById('menu');
  if (burger && menu) {
    var setOpen = function (o) {
      menu.classList.toggle('open', o);
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      burger.setAttribute('aria-label', o ? 'Chiudi il menu' : 'Apri il menu');
    };
    burger.addEventListener('click', function () { setOpen(!menu.classList.contains('open')); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  }

  /* ---------- comparsa ---------- */
  var els = d.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('in'); });

  /* ---------- elenco che si apre ---------- */
  d.querySelectorAll('[data-acc]').forEach(function (acc) {
    var items = [].slice.call(acc.children);
    items.forEach(function (li) {
      var b = li.querySelector('.acc-h');
      b.addEventListener('click', function () {
        var open = li.classList.contains('on');
        items.forEach(function (x) {
          x.classList.remove('on');
          x.querySelector('.acc-h').setAttribute('aria-expanded', 'false');
        });
        if (!open) { li.classList.add('on'); b.setAttribute('aria-expanded', 'true'); }
      });
    });
  });

  /* ---------- scorrimento ---------- */
  var hero = d.querySelector('[data-hero]');
  var zoom = d.querySelector('[data-zoom]');
  var cor = d.querySelector('[data-corridor]');
  var trip = d.querySelector('[data-trip]');
  var tripTrack = trip && trip.querySelector('.trip-track');
  var header = d.querySelector('.site-header');
  var items2 = cor ? [].slice.call(cor.querySelectorAll('.cz')) : [];
  var distEl = cor && cor.querySelector('[data-dist]');
  var barEl = cor && cor.querySelector('[data-bar]');
  var GAP = 900;
  if (reduce) [hero, zoom, cor, trip].forEach(function (x) { if (x) x.classList.add('static'); });

  var tripTotal = 0;
  function measureTrip() {
    if (!trip || reduce) return;
    if (!desk.matches) { trip.style.removeProperty('--th'); tripTrack.style.transform = ''; return; }
    tripTotal = Math.max(0, tripTrack.scrollWidth - window.innerWidth);
    trip.style.setProperty('--th', (tripTotal + window.innerHeight) + 'px');
  }

  function update() {
    var vh = window.innerHeight, vw = window.innerWidth, y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 10);

    if (hero && !reduce) {
      var r = hero.getBoundingClientRect();
      var p = clamp(-r.top / (r.height - vh), 0, 1);
      var o = clamp(p / 0.8, 0, 1);
      hero.style.setProperty('--o', (o * o * (3 - 2 * o)).toFixed(4));
      hero.style.setProperty('--t', o.toFixed(4));
    }

    if (zoom && !reduce) {
      var z = zoom.getBoundingClientRect();
      var pz = clamp(-z.top / (z.height - vh), 0, 1);
      var q = clamp(pz / 0.86, 0, 1);
      zoom.style.setProperty('--sc', Math.pow(14, q).toFixed(3));
      zoom.style.setProperty('--q', q.toFixed(4));
    }

    if (cor && !reduce) {
      var c = cor.getBoundingClientRect();
      var pc = clamp(-c.top / (c.height - vh), 0, 1);
      var mob = vw < 700;
      var cam = pc * (items2.length - 1) * GAP;
      items2.forEach(function (el, i) {
        var zz = cam - i * GAP - 250;
        var op = sm(-3300, -1700, zz) * (1 - sm(40, 330, zz));
        var x = (parseFloat(el.dataset.x) || 0) * (mob ? 0.45 : 1) * vw / 100;
        var yy = (parseFloat(el.dataset.y) || 0) * vh / 100;
        el.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,' + yy.toFixed(1) + 'px,' + zz.toFixed(1) + 'px)';
        el.style.opacity = op.toFixed(3);
        el.style.visibility = op > 0.01 ? 'visible' : 'hidden';
      });
      if (distEl) distEl.textContent = Math.round(18 * (1 - pc));
      if (barEl) barEl.style.transform = 'scaleX(' + pc.toFixed(4) + ')';
    }

    if (trip && !reduce && desk.matches && tripTotal > 0) {
      var t = trip.getBoundingClientRect();
      var pt = clamp(-t.top / (t.height - vh), 0, 1);
      tripTrack.style.transform = 'translate3d(' + (-pt * tripTotal).toFixed(1) + 'px,0,0)';
    }
  }
  var tick = false;
  function onScroll() { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; update(); }); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', function () { measureTrip(); onScroll(); });
  addEventListener('load', function () { measureTrip(); update(); });
  measureTrip();
  update();

  /* ---------- barra di avanzamento e puntini delle schermate ---------- */
  var scenes = [].slice.call(d.querySelectorAll('[data-scene]'));
  var dotBtns = [];
  if (scenes.length > 1) {
    var dn = d.createElement('nav');
    dn.className = 'dots';
    dn.setAttribute('aria-label', 'Schermate');
    scenes.forEach(function (sc) {
      var b = d.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', sc.getAttribute('data-scene'));
      b.innerHTML = '<span>' + sc.getAttribute('data-scene') + '</span>';
      b.addEventListener('click', function () { sc.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
      dn.appendChild(b);
      dotBtns.push(b);
    });
    d.body.appendChild(dn);
  }
  function updateNav() {
    var vh = window.innerHeight;
    var max = root.scrollHeight - vh;
    root.style.setProperty('--sp', (max > 0 ? clamp(window.scrollY / max, 0, 1) : 0).toFixed(4));
    if (!dotBtns.length) return;
    var cur = 0;
    scenes.forEach(function (sc, i) { if (sc.getBoundingClientRect().top <= vh * 0.5) cur = i; });
    dotBtns.forEach(function (b, i) { b.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
  }
  addEventListener('scroll', updateNav, { passive: true });
  addEventListener('resize', updateNav);
  updateNav();

  /* ---------- anteprima demo (portfolio) ---------- */
  var peek = d.querySelector('.peek');
  if (peek && fine) {
    var ih = peek.querySelector('img.h'), ip = peek.querySelector('img.p');
    var px = 0, py = 0, qx = 0, qy = 0, on = false;
    d.querySelectorAll('[data-peek]').forEach(function (a) {
      a.addEventListener('pointerenter', function () {
        ih.src = a.dataset.peek; ip.src = a.dataset.phone || '';
        ip.style.display = a.dataset.phone ? '' : 'none';
        peek.classList.add('on'); on = true;
      });
      a.addEventListener('pointerleave', function () { peek.classList.remove('on'); on = false; });
    });
    addEventListener('pointermove', function (e) { px = e.clientX + 28; py = e.clientY - 110; }, { passive: true });
    (function loop() {
      qx += (px - qx) * 0.14; qy += (py - qy) * 0.14;
      if (on) {
        var w = peek.offsetWidth;
        var x = Math.min(qx, window.innerWidth - w - 20);
        peek.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + qy.toFixed(1) + 'px,0)';
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- ora a Sardara (contatti) ---------- */
  var clk = d.querySelector('[data-clock]');
  if (clk) {
    var showTime = function () {
      try {
        clk.textContent = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }).format(new Date());
      } catch (e) { clk.textContent = ''; }
    };
    showTime();
    setInterval(showTime, 15000);
  }

  /* ---------- musica in stile Spotify ---------- */
  d.querySelectorAll('[data-sp]').forEach(function (sp) {
    var rows = [].slice.call(sp.querySelectorAll('.sp-row'));
    var npAv = sp.querySelector('[data-np-av]'), npName = sp.querySelector('[data-np-name]');
    var bar = sp.querySelector('[data-bar]'), prog = sp.querySelector('[data-prog]');
    var toggles = [].slice.call(sp.querySelectorAll('[data-play]'));
    var cur = 0, playing = !reduce, p = 0.34, last = 0, visible = true;
    var DUR = 60000;
    var render = function () {
      rows.forEach(function (r, i) {
        r.classList.toggle('on', i === cur);
        r.classList.toggle('playing', i === cur && playing);
        r.setAttribute('aria-current', i === cur ? 'true' : 'false');
      });
      var r = rows[cur];
      npName.textContent = r.dataset.name;
      npAv.textContent = r.dataset.ini;
      npAv.style.setProperty('--a1', r.dataset.a1);
      npAv.style.setProperty('--a2', r.dataset.a2);
      toggles.forEach(function (b) {
        b.classList.toggle('is-playing', playing);
        b.setAttribute('aria-label', playing ? 'Metti in pausa' : 'Riproduci');
      });
      prog.style.setProperty('--p', p.toFixed(4));
    };
    var go = function (i) { cur = (i + rows.length) % rows.length; p = 0; render(); };
    rows.forEach(function (r, i) {
      r.addEventListener('click', function () {
        if (cur === i) playing = !playing; else { cur = i; p = 0; playing = true; }
        render();
      });
    });
    toggles.forEach(function (b) { b.addEventListener('click', function () { playing = !playing; render(); }); });
    var pv = sp.querySelector('[data-prev]'), nx = sp.querySelector('[data-next]');
    if (pv) pv.addEventListener('click', function () { go(cur - 1); });
    if (nx) nx.addEventListener('click', function () { go(cur + 1); });
    bar.addEventListener('click', function (e) {
      var b = bar.getBoundingClientRect();
      p = clamp((e.clientX - b.left) / b.width, 0, 1);
      render();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(sp);
    }
    (function loop(t) {
      if (playing && visible) {
        var dt = last ? Math.min(t - last, 100) : 0;
        p += dt / DUR;
        if (p >= 1) { go(cur + 1); }
        else prog.style.setProperty('--p', p.toFixed(4));
      }
      last = t;
      requestAnimationFrame(loop);
    })(0);
    render();
  });
})();
