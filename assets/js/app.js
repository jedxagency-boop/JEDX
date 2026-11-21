/* JEDX — interacciones y animaciones (GSAP + ScrollTrigger + Lenis) */
(function () {
  'use strict';
  var root = document.getElementById('root');
  if (!root) return;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var lenis = null;
  var $ = function (s, el) { return (el || root).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || root).querySelectorAll(s)); };

  /* ---------- menú móvil ---------- */
  var menu = document.getElementById('menu');
  var burger = $('[data-burger]');
  var menuOpen = false;
  function setMenu(open) {
    menuOpen = open;
    menu.style.display = open ? 'flex' : 'none';
    burger.classList.toggle('is-open', open);
    var bl = burger.querySelector('[data-burger-label]'); if (bl) bl.textContent = T(open ? 'Cerrar' : 'Menú');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    syncScrollLock();
  }

  /* ---------- modal de planes ---------- */
  var plans = document.getElementById('plans');
  var plansOpen = false;
  var SERV = ['Branding', 'Logotipos', 'Diseño web', 'Landing pages', 'Startups'];
  function openPlans(i) {
    var all = i === 5;
    $$('[data-plan-group]', plans).forEach(function (g) {
      var k = +g.getAttribute('data-plan-group');
      g.style.display = all || k === i ? 'flex' : 'none';
      var h = g.querySelector('[data-plan-head]');
      if (h) h.style.display = all ? 'flex' : 'none';
    });
    plans.querySelector('[data-kick1]').textContent = all ? T('Todos los servicios') : ('0' + (i + 1) + ' / 05');
    plans.querySelector('[data-kick2]').textContent = all ? T('5 servicios · 15 planes') : T(SERV[i]);
    plans.style.display = 'flex';
    plansOpen = true;
    var panel = plans.querySelector('[data-plans-panel]');
    if (panel) panel.scrollTop = 0;
    syncScrollLock();
  }
  function closePlans() { plans.style.display = 'none'; plansOpen = false; syncScrollLock(); }
  function syncScrollLock() {
    var lock = menuOpen || plansOpen || (typeof pmOpen !== 'undefined' && pmOpen);
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    if (lenis) lock ? lenis.stop() : lenis.start();
  }
  plans.addEventListener('click', function (e) { if (e.target === plans) closePlans(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (peekOn) peekHide(); if (plansOpen) closePlans(); if (menuOpen) setMenu(false); }
  });

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    if (act === 'toggleMenu') setMenu(!menuOpen);
    else if (act === 'closeMenu') setMenu(false);
    else if (act === 'openAllPlans') { setMenu(false); openPlans(5); }
    else if (act === 'openAllPlansMobile') { setMenu(false); openPlans(5); }
    else if (act === 'openPlans') openPlans(+el.getAttribute('data-plan'));
    else if (act === 'closePlans') closePlans();
  });

  window.addEventListener('resize', function () { if (window.innerWidth >= 900 && menuOpen) setMenu(false); });

  /* ---------- vista previa flotante de proyectos ---------- */
  var peek = document.getElementById('peek');
  var pdata = [];
  try { pdata = JSON.parse(document.getElementById('proj-data').textContent); } catch (e) {}
  var pmOpen = false; // compat con syncScrollLock
  var peekCard = peek && peek.querySelector('[data-peek-card]');
  var peekImg = peek && peek.querySelector('[data-peek-img]');
  var peekName = peek && peek.querySelector('[data-peek-name]');
  var hoverMode = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var peekOn = false, peekIdx = -1, peekY = 0, peekRaf = 0, peekWait = 0, peekTouch = false;
  var px = window.innerWidth / 2, py = window.innerHeight / 2, cx = px, cy = py, lastX = px;
  function peekSet(i) {
    if (i === peekIdx) return;
    var d = pdata[i]; if (!d) return;
    peekIdx = i; peekY = 0; peekWait = performance.now() + 700;
    peekImg.style.transform = 'translate3d(0,0,0)';
    peekImg.src = d.src; peekImg.alt = 'Vista previa de la web de ' + d.name;
    peekName.textContent = d.name + ' · en vivo';
  }
  function peekShow(i, touch) {
    if (!peek) return;
    peekTouch = !!touch;
    peek.classList.toggle('is-touch', peekTouch);
    peekSet(i);
    if (peekTouch) { cx = px = window.innerWidth / 2; cy = py = window.innerHeight / 2; }
    else { cx = px; cy = py; }
    if (!peekOn) {
      peekOn = true; peek.style.visibility = 'visible';
      if (gsap) gsap.fromTo(peekCard, { scale: 0.6, opacity: 0, rotate: -12 }, { scale: 1, opacity: 1, rotate: -4, duration: reduce ? 0 : 0.55, ease: 'back.out(1.6)', overwrite: 'auto' });
      cancelAnimationFrame(peekRaf); peekRaf = requestAnimationFrame(peekLoop);
    }
  }
  function peekHide() {
    if (!peekOn) return;
    peekOn = false; peekIdx = -1;
    var done = function () { if (!peekOn) { peek.style.visibility = 'hidden'; cancelAnimationFrame(peekRaf); } };
    if (gsap && !reduce) gsap.to(peekCard, { scale: 0.6, opacity: 0, rotate: -12, duration: 0.3, ease: 'power3.in', overwrite: 'auto', onComplete: done });
    else done();
  }
  function peekLoop(t) {
    peekRaf = requestAnimationFrame(peekLoop);
    // seguir al cursor (escritorio) con suavizado
    cx += (px - cx) * 0.16; cy += (py - cy) * 0.16;
    var w = peekCard.offsetWidth, h = peekCard.offsetHeight;
    var x = Math.min(window.innerWidth - w - 8, Math.max(8, cx - w / 2));
    var y = Math.min(window.innerHeight - h - 8, Math.max(8, cy - h / 2));
    var tilt = peekTouch ? 0 : Math.max(-10, Math.min(10, (px - lastX) * 0.35));
    lastX += (px - lastX) * 0.2;
    peek.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + tilt + 'deg)';
    // desplazar la web hacia abajo
    if (reduce || t < peekWait || !peekImg.complete) return;
    var max = peekImg.offsetHeight - h;
    if (max <= 2) return;
    peekY += Math.max(0.8, h / 300);
    if (peekY >= max) { peekY = max; peekWait = t + 1500; setTimeout(function () { if (peekOn) { peekY = 0; peekImg.style.transition = 'transform .9s cubic-bezier(.16,1,.3,1)'; peekImg.style.transform = 'translate3d(0,0,0)'; setTimeout(function () { peekImg.style.transition = ''; }, 950); peekWait = performance.now() + 1700; } }, 1400); }
    if (!peekImg.style.transition) peekImg.style.transform = 'translate3d(0,' + (-peekY) + 'px,0)';
  }
  window.addEventListener('pointermove', function (e) { if (!peekTouch) { px = e.clientX; py = e.clientY; } }, { passive: true });
  if (hoverMode) {
    root.addEventListener('pointerover', function (e) {
      var card = e.target.closest && e.target.closest('[data-proj]');
      if (card) { px = e.clientX; py = e.clientY; peekShow(+card.getAttribute('data-proj'), false); }
    });
    root.addEventListener('pointerout', function (e) {
      var card = e.target.closest && e.target.closest('[data-proj]');
      if (card && !card.contains(e.relatedTarget)) {
        var next = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[data-proj]');
        if (!next) peekHide();
      }
    });
    window.addEventListener('scroll', function () {
      if (!peekOn) return;
      var el = document.elementFromPoint(px, py);
      var card = el && el.closest && el.closest('[data-proj]');
      if (!card) peekHide(); else peekSet(+card.getAttribute('data-proj'));
    }, { passive: true });
  }
  var downX = 0, downY = 0;
  root.addEventListener('pointerdown', function (e) { downX = e.clientX; downY = e.clientY; }, { passive: true });
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-peek-close]')) { peekHide(); return; }
    var card = e.target.closest('[data-proj]');
    if (!card) { if (peekOn && peekTouch) peekHide(); return; }
    if (Math.abs(e.clientX - downX) > 8 || Math.abs(e.clientY - downY) > 8) return; // fue un arrastre
    var i = +card.getAttribute('data-proj');
    if (hoverMode) { px = e.clientX; py = e.clientY; peekShow(i, false); return; }
    if (peekOn && peekIdx === i) peekHide(); else peekShow(i, true);
  });
  root.addEventListener('keydown', function (e) {
    var card = e.target.closest && e.target.closest('[data-proj]');
    if (card && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      var r = card.getBoundingClientRect(); px = r.left + r.width / 2; py = r.top + r.height / 2;
      peekShow(+card.getAttribute('data-proj'), false);
    }
  });
  function closeProj() { peekHide(); }

  /* ---------- idiomas: textos que cambia el JS ---------- */
  function T(s) { return window.jedxT ? window.jedxT(s) : s; }
  function buildWords(el, text) {
    if (el._wt) { if (el._wt.scrollTrigger) el._wt.scrollTrigger.kill(); el._wt.kill(); }
    var words = text.trim().split(/\s+/);
    el.innerHTML = '';
    words.forEach(function (w, i) { var s = document.createElement('span'); s.textContent = w; el.appendChild(s); if (i < words.length - 1) el.appendChild(document.createTextNode(' ')); });
    if (gsap && ST) el._wt = gsap.fromTo(el.querySelectorAll('span'), { opacity: 0.15 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
  }
  window.jedxRebuildWords = function () {
    $$('[data-words-src]').forEach(function (el) { buildWords(el, T(el.getAttribute('data-words-src'))); });
    if (ST) ST.refresh();
  };

  /* ---------- palabra rotativa del hero ---------- */
  var rot = ['ideas.', 'marcas.', 'historias.', 'experiencias.'];

  function init() {
    if (!gsap || !ST) return;
    gsap.registerPlugin(ST);

    if (!reduce && window.Lenis) {
      lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    // anclas suaves
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var id = a.getAttribute('href'); if (id.length < 2) { e.preventDefault(); return; }
      var el = document.querySelector(id); if (!el) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      if (lenis) { lenis.start(); lenis.scrollTo(el, { duration: 1.4 }); }
      else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: reduce ? 'auto' : 'smooth' });
    });

    // recorrido automático dentro del celular (imagen)
    var rs = $('[data-reel-screen]'), ri = $('[data-reel-img]');
    if (rs && ri && !reduce) {
      var tw = null;
      var build = function () {
        if (tw) tw.kill();
        var dist = ri.offsetHeight - rs.clientHeight;
        if (dist <= 50) return;
        tw = gsap.fromTo(ri, { y: 0 }, { y: -dist, duration: dist / 70, ease: 'none', repeat: -1, repeatDelay: 1.4, yoyo: false, paused: true });
        ST.create({ trigger: rs, start: 'top bottom', end: 'bottom top', onToggle: function (s) { s.isActive ? tw.play() : tw.pause(); } });
      };
      if (ri.complete) build(); else ri.addEventListener('load', build, { once: true });
    }

    // rotación de palabra
    var box = $('[data-rot-box]'), word = $('[data-rot-word]'), rI = 0;
    setInterval(function () {
      rI = (rI + 1) % rot.length;
      if (reduce) { word.textContent = T(rot[rI]); return; }
      var w0 = box.offsetWidth;
      gsap.timeline()
        .to(word, { yPercent: -110, duration: 0.45, ease: 'power3.in' })
        .add(function () {
          word.textContent = T(rot[rI]);
          box.style.width = 'auto';
          var w1 = box.offsetWidth;
          gsap.fromTo(box, { width: w0 }, { width: w1, duration: 0.7, ease: 'expo.out', onComplete: function () { box.style.width = 'auto'; } });
        })
        .fromTo(word, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: 'expo.out' });
    }, 2600);

    // carrusel del post
    var ptrack = $('[data-post-track]'), pdots = $$('[data-post-dots] span'), pi = 0;
    setInterval(function () {
      pi = (pi + 1) % 3;
      gsap.to(ptrack, { xPercent: -100 * pi, duration: reduce ? 0 : 0.9, ease: 'expo.inOut' });
      pdots.forEach(function (d, k) { d.style.background = k === pi ? 'var(--accent)' : 'rgba(13,14,17,0.2)'; });
    }, 3200);

    // header fijo: siempre visible (sombra al bajar)
    var nav = $('[data-nav]');
    if (nav) ST.create({ start: 0, end: 'max', onUpdate: function (s) { nav.classList.toggle('is-scrolled', s.scroll() > 10); } });

    // servicios con scroll fijo
    var svcSec = $('[data-svc-scroll]');
    var texts = $$('[data-svc-text]'), imgs = $$('[data-svc-img]'), dots = $$('[data-svc-dot]');
    var bar = $('[data-svc-bar]'), cur = 0, n = texts.length;
    function show(i) {
      if (i === cur) return;
      var dir = i > cur ? 1 : -1, prev = cur; cur = i;
      dots.forEach(function (d, k) { d.style.height = k === i ? '36px' : '8px'; d.style.background = k === i ? 'var(--accent)' : 'rgba(13,14,17,0.2)'; });
      if (reduce) {
        texts.forEach(function (t, k) { gsap.set(t, { autoAlpha: k === i ? 1 : 0 }); });
        imgs.forEach(function (im, k) { gsap.set(im, { clipPath: k === i ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)' }); });
        return;
      }
      gsap.to(texts[prev], { autoAlpha: 0, y: -40 * dir, duration: 0.45, ease: 'power3.in', overwrite: true });
      gsap.fromTo(texts[i], { autoAlpha: 0, y: 50 * dir }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out', delay: 0.3, overwrite: true });
      imgs.forEach(function (im, k) { gsap.set(im, { zIndex: k === i ? 3 : k === prev ? 2 : 1 }); });
      gsap.fromTo(imgs[i], { clipPath: dir > 0 ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)', scale: 1.15 },
        { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.1, ease: 'expo.inOut', overwrite: true });
    }
    ST.create({ trigger: svcSec, start: 'top top', end: 'bottom bottom', onUpdate: function (s) {
      show(Math.min(n - 1, Math.floor(s.progress * n)));
      gsap.set(bar, { scaleX: ((s.progress * n) % 1) * 0.8 + 0.2 });
    } });

    if (!reduce) {
      // columnas de celulares del hero
      var up = $('[data-col="up"]'), down = $('[data-col="down"]');
      var tUp = gsap.fromTo(up, { yPercent: 0 }, { yPercent: -50, duration: 38, ease: 'none', repeat: -1 });
      var tDown = gsap.fromTo(down, { yPercent: -50 }, { yPercent: 0, duration: 38, ease: 'none', repeat: -1 });
      if (lenis) lenis.on('scroll', function () { var v = Math.min(6, Math.abs(lenis.velocity || 0) * 0.25); tUp.timeScale(1 + v); tDown.timeScale(1 + v); });
      gsap.from($$('[data-phones] > [data-col]'), { y: 120, opacity: 0, duration: 1.6, ease: 'expo.out', stagger: 0.15, delay: 0.2 });

      $$('[data-lines]').forEach(function (g) {
        var lines = g.querySelectorAll('[data-line]');
        if (g.getAttribute('data-lines') === 'load') gsap.from(lines, { yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: 0.1, delay: 0.15 });
        else gsap.from(lines, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: g, start: 'top 88%', toggleActions: 'play none none reverse' } });
      });
      $$('[data-fade]').forEach(function (el) {
        var inHero = el.closest('#inicio');
        gsap.from(el, { y: 36, opacity: 0, duration: 1.1, ease: 'power3.out', delay: inHero ? 0.6 : 0,
          scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
      });
      $$('[data-stagger]').forEach(function (g) {
        Array.prototype.forEach.call(g.children, function (c, k) { gsap.from(c, { y: 48, opacity: 0, duration: 1.1, ease: 'power3.out', delay: (k % 3) * 0.08, scrollTrigger: { trigger: c, start: 'top 92%', toggleActions: 'play none none none' } }); });
      });
      $$('[data-words]').forEach(function (el) {
        var src = el.textContent.replace(/\s+/g, ' ').trim();
        el.setAttribute('data-words-src', src);
        buildWords(el, T(src));
      });

      gsap.to($('[data-proc-line]'), { scaleX: 1, ease: 'none', scrollTrigger: { trigger: $('[data-proc]'), start: 'top 85%', end: 'bottom 60%', scrub: true } });

      var post = $('[data-post]');
      gsap.from($('[data-post-card]'), { y: 80, rotate: -3, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: post, start: 'top 80%', toggleActions: 'play none none reverse' } });
      $$('[data-float]').forEach(function (el, i) {
        gsap.from(el, { scale: 0.6, opacity: 0, duration: 0.9, ease: 'back.out(1.6)', delay: 0.4 + i * 0.1, scrollTrigger: { trigger: post, start: 'top 75%', toggleActions: 'play none none reverse' } });
        gsap.to(el, { y: i % 2 ? 10 : -10, duration: 2.4 + i * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1 });
        gsap.fromTo(el, { yPercent: 30 * (i % 2 ? 1 : -1) }, { yPercent: -30 * (i % 2 ? 1 : -1), ease: 'none', scrollTrigger: { trigger: post, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      var reel = $('[data-reel]');
      gsap.from(reel.firstElementChild, { y: 100, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: reel, start: 'top 80%', toggleActions: 'play none none reverse' } });
      $$('[data-orbit]').forEach(function (el, i) {
        gsap.from(el, { scale: 0, duration: 1, ease: 'back.out(1.7)', delay: 0.3 + i * 0.12, scrollTrigger: { trigger: reel, start: 'top 75%', toggleActions: 'play none none reverse' } });
        gsap.to(el, { y: i % 2 ? 14 : -14, x: i % 3 ? 6 : -6, duration: 2.8 + i * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      });

      var split = $('[data-brand-split]');
      if (split) gsap.from(split.children, { yPercent: 105, duration: 1.4, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: split, start: 'top 95%', toggleActions: 'play none none reverse' } });
    }

    // proyectos: scroll horizontal en escritorio, deslizable en celular
    var mm = gsap.matchMedia();
    var wrap = $('[data-hwrap]'), outer = $('[data-houter]'), track = $('[data-htrack]'), prog = $('[data-hprogress]');
    mm.add('(min-width: 900px)', function () {
      outer.style.overflowX = 'hidden';
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var tween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, onUpdate: function (s) { gsap.set(prog, { scaleX: s.progress }); } } });
      if (!reduce) $$('[data-hpar]').forEach(function (img) {
        gsap.fromTo(img, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: img.closest('[data-hcard]'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
    });
    mm.add('(max-width: 899px)', function () {
      outer.style.overflowX = 'auto';
      var onS = function () { var max = outer.scrollWidth - outer.clientWidth; gsap.set(prog, { scaleX: max > 0 ? outer.scrollLeft / max : 0 }); };
      outer.addEventListener('scroll', onS, { passive: true });
      return function () { outer.removeEventListener('scroll', onS); };
    });

    if (fine && !reduce) {
      $$('[data-magnetic]').forEach(function (el) {
        var mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
        el.addEventListener('mousemove', function (e) { var r = el.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.3); });
        el.addEventListener('mouseleave', function () { mx(0); my(0); });
      });
    }

    ST.sort(); ST.refresh();
    var rt;
    var refresh = function () { clearTimeout(rt); rt = setTimeout(function () { ST.refresh(); }, 200); };
    $$('img').forEach(function (img) { if (!img.complete) img.addEventListener('load', refresh, { once: true }); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
