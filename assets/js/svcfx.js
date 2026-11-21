/* JEDX — efectos del panel de Servicios (boceto 5 "Mezcla") */
(function () {
  var ctx = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = function () { return window.matchMedia('(max-width: 899px)').matches; };

  window.jedxSvcFx = function (art, main) {
    if (!window.gsap || !window.ScrollTrigger || reduce || !art) return;
    gsap.registerPlugin(ScrollTrigger);
    if (ctx) ctx.revert();
    ctx = gsap.context(function () { build(art, main); }, art);
    requestAnimationFrame(function () { ScrollTrigger.refresh(); });
  };

  function build(art, main) {
    var S = function (trigger, o) { o = o || {}; o.trigger = trigger; o.scroller = main; return o; };
    var q = function (sel) { return art.querySelector(sel); }, qa = function (sel) { return art.querySelectorAll(sel); };

    // [Film Festival] el título deja ver la foto por sus letras; al bajar, la foto llena la pantalla
    var hero = q('.fx-hero');
    gsap.from(q('.sp-num'), { xPercent: -60, opacity: 0, duration: 1.1, ease: 'expo.out' });
    gsap.from(q('.fx-win'), { clipPath: 'inset(48% 0 48% 0)', duration: 1.2, ease: 'expo.out', delay: .1 });
    gsap.timeline({ scrollTrigger: S(hero, { start: 'top top', end: 'bottom bottom', scrub: 1 }) })
      .to(q('.fx-win'), { scale: small() ? 2.2 : 3.2, opacity: 0, ease: 'power2.in' }, 0)
      .to(q('.sp-num'), { xPercent: -120, opacity: 0 }, 0)
      .to(q('.fx-stage .sp-kick'), { opacity: 0 }, 0)
      .to(qa('.fx-pc'), { y: -80, opacity: 0, stagger: .05, ease: 'power2.in' }, 0)
      .to(q('.fx-pbg'), { opacity: 0 }, .2)
      .to(q('.fx-bg'), { opacity: 1, scale: 1 }, .15);
    gsap.from(qa('.fx-pc'), { y: 70, opacity: 0, duration: 1.3, stagger: .12, ease: 'expo.out', delay: .2 });

    // [Film Festival] el texto se enciende de arriba abajo con un borde azul
    qa('.fx-lit').forEach(function (p) {
      gsap.fromTo(p, { '--p': '-20%' }, { '--p': '110%', ease: 'none', scrollTrigger: S(p, { start: 'top 88%', end: 'bottom 50%', scrub: true }) });
    });
    // [Rosita] una línea corre bajo cada dato
    qa('.fx-ln').forEach(function (l) { gsap.to(l, { scaleX: 1, ease: 'none', scrollTrigger: S(l.parentNode, { start: 'top 95%', end: 'top 65%', scrub: true }) }); });

    // [web-3] la foto sube dentro del arco
    var ex = q('.fx-ex');
    gsap.fromTo(q('.fx-arch img'), { yPercent: 0 }, { yPercent: -10, ease: 'none', scrollTrigger: S(ex, { start: 'top bottom', end: 'bottom top', scrub: true }) });
    gsap.from(q('.fx-arch'), { clipPath: 'inset(100% 0 0 0 round 999px 999px 16px 16px)', duration: 1.3, ease: 'expo.out', scrollTrigger: S(ex, { start: 'top 75%' }) });

    // [Rosita] la frase engrosa mientras un brillo sube
    var st = q('.fx-stmt');
    gsap.timeline({ scrollTrigger: S(st, { start: 'top 75%', end: 'bottom 40%', scrub: true }) })
      .to(st.querySelector('.fx-sglow'), { bottom: '120%', ease: 'none' }, 0)
      .to(st.querySelectorAll('p span'), { fontVariationSettings: "'wght' 600", fontWeight: 600, stagger: .25, ease: 'none' }, 0);

    // [Film Festival] títulos en dos mitades que se juntan
    qa('.fx-hv').forEach(function (h) {
      gsap.timeline({ scrollTrigger: S(h, { start: 'top 95%', end: 'top 60%', scrub: 1 }) })
        .from(h.querySelector('.fx-a'), { xPercent: -35, ease: 'none' }, 0)
        .from(h.querySelector('.fx-b'), { xPercent: 35, ease: 'none' }, 0);
    });

    // [web-3] una lámpara azul recorre las tarjetas de "Qué incluye" y las enciende
    var wrap = q('.fx-lampw');
    if (wrap && !small()) {
      var lamp = wrap.querySelector('.fx-lamp'), cards = wrap.querySelectorAll('.sp-inc');
      ScrollTrigger.create(S(wrap, { start: 'top 72%', end: 'bottom 40%', scrub: true,
        onToggle: function (self) { wrap.classList.toggle('fx-on', self.isActive || self.progress > .99); },
        onUpdate: function (s) {
          var tops = Array.prototype.map.call(cards, function (c) { return c.offsetTop; });
          var rows = tops.filter(function (v, i, a) { return a.indexOf(v) === i; });
          var p = s.progress, W = wrap.offsetWidth, n = rows.length, seg = Math.min(n - 1, Math.floor(p * n)), f = p * n - seg;
          var x = seg % 2 ? W * (1 - f) : W * f, rt = rows[seg] || 0;
          lamp.style.left = x + 'px'; lamp.style.top = (rt - 140) + 'px';
          cards.forEach(function (c, i) { c.classList.toggle('lit', p > .98 || (tops[i] === rt && Math.abs(c.offsetLeft + c.offsetWidth / 2 - x) < c.offsetWidth * .8)); });
        } }));
    }

    // [Rosita] el marco redondo se abre en la foto de cada paso
    var imgs = qa('.fx-rf-c img, .fx-rf-c .fx-rf-ph'), num = q('.fx-rf-n'), steps = qa('.fx-rf-l .sp-step');
    function stepOn(i) { steps.forEach(function (x, k) { x.classList.toggle('on', k === i); }); imgs.forEach(function (im, k) { im.classList.toggle('on', k <= i); }); if (num) num.textContent = '0' + (i + 1); }
    stepOn(0);
    steps.forEach(function (s, i) { ScrollTrigger.create(S(s, { start: 'top 60%', end: 'bottom 60%', onToggle: function (self) { if (self.isActive) stepOn(i); } })); });

    // [Film Festival] los talones de precio caen girados y se unen a su entrada
    qa('.fx-stub').forEach(function (s, k) {
      gsap.fromTo(s, { y: 120, rotate: k % 2 ? -6 : 6, opacity: .4 }, { y: 0, rotate: 0, opacity: 1, ease: 'none', scrollTrigger: S(s.parentNode, { start: 'top 88%', end: 'top 40%', scrub: 1 }) });
    });
    // [web-3] un disco azul crece detrás de "¿No sabes qué plan elegir?"
    var help = q('.sp-help');
    if (help) gsap.to(help.querySelector('.fx-disc'), { scale: 12, ease: 'none', scrollTrigger: S(help, { start: 'top 92%', end: 'top 45%', scrub: true }) });
    // [Rosita] "jedx" se condensa saliendo de la niebla
    gsap.to(q('.fx-nm b'), { letterSpacing: '-0.02em', filter: 'blur(0px)', opacity: 1, ease: 'none', scrollTrigger: S(q('.fx-nm'), { start: 'top 100%', end: 'top 55%', scrub: true }) });
  }

  // al cerrar el panel se apagan los efectos
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-svc-close]') && ctx) setTimeout(function () { if (document.getElementById('svc').hidden && ctx) { ctx.revert(); ctx = null; } }, 400);
  }, true);
})();
