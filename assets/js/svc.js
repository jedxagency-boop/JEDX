/* JEDX — panel de servicios con menú lateral que se cierra y se abre */
(function () {
  var sp = document.getElementById('svc');
  if (!sp) return;
  var main = sp.querySelector('[data-sp-main]');
  var arts = Array.prototype.slice.call(sp.querySelectorAll('[data-svc-art]'));
  var cur = -1, isOpen = false, lastFocus = null;

  function setCollapsed(c) {
    sp.classList.toggle('is-collapsed', c);
    sp.querySelectorAll('[data-sp-toggle]').forEach(function (b) { b.setAttribute('aria-expanded', c ? 'false' : 'true'); });
    try { localStorage.setItem('jedx-svc-side', c ? '0' : '1'); } catch (e) {}
  }
  try { if (localStorage.getItem('jedx-svc-side') === '0') setCollapsed(true); } catch (e) {}

  function mark(i) {
    sp.querySelectorAll('[data-act="openSvc"]').forEach(function (b) {
      var on = +b.getAttribute('data-svc') === i && (b.classList.contains('sp-s') || b.classList.contains('sp-r') || b.classList.contains('sp-tab'));
      b.classList.toggle('is-on', on);
      if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    var tab = sp.querySelector('.sp-tab.is-on');
    if (tab && tab.scrollIntoView) tab.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function show(i) {
    if (i < 0 || i >= arts.length) return;
    arts.forEach(function (a, k) { a.hidden = k !== i; a.classList.remove('is-in'); });
    void arts[i].offsetWidth;
    arts[i].classList.add('is-in');
    cur = i;
    sp.setAttribute('data-cur', i);
    mark(i);
    main.scrollTop = 0;
    spy();
    if (window.jedxSvcFx) window.jedxSvcFx(arts[i], main);
  }
  function open(i) {
    if (!isOpen) {
      lastFocus = document.activeElement;
      sp.hidden = false;
      sp.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('sp-open');
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(function () { sp.classList.add('is-on'); });
      isOpen = true;
    }
    show(i);
    setTimeout(function () { var c = sp.querySelector('.sp-close'); if (c) c.focus({ preventScroll: true }); }, 60);
  }
  function close(then) {
    if (!isOpen) return;
    isOpen = false;
    sp.classList.remove('is-on');
    document.documentElement.classList.remove('sp-open');
    document.documentElement.style.overflow = '';
    setTimeout(function () {
      sp.hidden = true; sp.setAttribute('aria-hidden', 'true');
      if (then) then(); else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, 260);
  }
  window.jedxOpenSvc = open;
  window.jedxCloseSvc = function () { close(); };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act="openSvc"]');
    if (t) { e.preventDefault(); if (window.jedxCloseProj) window.jedxCloseProj(); if (window.jedxCloseNos) window.jedxCloseNos(); open(+t.getAttribute('data-svc')); return; }
    if (e.target.closest('[data-sp-toggle]')) { setCollapsed(!sp.classList.contains('is-collapsed')); return; }
    var go = e.target.closest('[data-sp-go]');
    if (go && arts[cur]) {
      var sec = arts[cur].querySelector('[data-sp-sec="' + go.getAttribute('data-sp-go') + '"]');
      if (sec) main.scrollTo({ top: sec.offsetTop - 64, behavior: 'smooth' });
      return;
    }
    var cl = e.target.closest('[data-svc-close]');
    if (cl) {
      var href = cl.getAttribute('href');
      if (href && href.charAt(0) === '#') {
        e.preventDefault(); e.stopPropagation();
        close(function () { var a = document.querySelector('a[href="' + href + '"]:not([data-svc-close])'); if (a) a.click(); else { var el = document.querySelector(href); if (el) el.scrollIntoView({ behavior: 'smooth' }); } });
      } else close();
      return;
    }
    // un enlace del menú principal cierra el panel antes de moverse
    if (isOpen && e.target.closest('header a[href^="#"]')) close();
  }, true);

  document.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'Escape' && !document.querySelector('.jn-dd.is-open, .jn-lang.is-open')) close();
    if (e.key === 'ArrowRight' && e.altKey) open(Math.min(cur + 1, arts.length - 1));
    if (e.key === 'ArrowLeft' && e.altKey) open(Math.max(cur - 1, 0));
  });

  // índice "En este servicio": marca la sección visible
  function spy() {
    if (!arts[cur]) return;
    var y = main.scrollTop + 140, active = 'que';
    arts[cur].querySelectorAll('[data-sp-sec]').forEach(function (s) { if (s.offsetTop <= y) active = s.getAttribute('data-sp-sec'); });
    sp.querySelectorAll('[data-sp-go]').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-sp-go') === active); });
  }
  var tick = false;
  main.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; spy(); }); } });
})();
