/* JEDX — panel "Nosotros": índice lateral que se oculta, saltos por sección y animaciones al aparecer */
(function () {
  var np = document.getElementById('nos');
  if (!np) return;
  var main = np.querySelector('[data-np-main]');
  var secs = Array.prototype.slice.call(np.querySelectorAll('[data-np-sec]'));
  var isOpen = false, lastFocus = null, io = null;
  var T = function (s) { return window.jedxT ? window.jedxT(s) : s; };

  function setCollapsed(c) {
    np.classList.toggle('is-collapsed', c);
    var b = np.querySelector('[data-np-toggle]');
    if (b) { b.setAttribute('aria-expanded', c ? 'false' : 'true'); b.setAttribute('aria-label', T(c ? 'Mostrar índice' : 'Ocultar índice')); }
    try { localStorage.setItem('jedx-nos-side', c ? '0' : '1'); } catch (e) {}
  }
  try { if (localStorage.getItem('jedx-nos-side') === '0') setCollapsed(true); } catch (e) {}

  function mark(key) {
    np.querySelectorAll('[data-np-go]').forEach(function (b) {
      var on = b.getAttribute('data-np-go') === key;
      b.classList.toggle('is-on', on);
      if (on) { b.setAttribute('aria-current', 'true'); if (window.matchMedia('(max-width: 899px)').matches && b.scrollIntoView) b.scrollIntoView({ block: 'nearest', inline: 'center' }); }
      else b.removeAttribute('aria-current');
    });
  }
  function go(key, instant) {
    var s = np.querySelector('[data-np-sec="' + key + '"]');
    if (!s) return;
    var top = key === 'quienes' ? 0 : s.offsetTop - 24;
    if (instant) { main.style.scrollBehavior = 'auto'; main.scrollTop = top; main.style.scrollBehavior = ''; }
    else main.scrollTo({ top: top, behavior: 'smooth' });
    mark(key);
  }
  function reveal() {
    var els = np.querySelectorAll('[data-rv]');
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } });
    }, { root: main, threshold: 0.12 });
    els.forEach(function (el) { if (!el.classList.contains('is-in')) io.observe(el); });
  }
  function open(key) {
    if (window.jedxCloseSvc) window.jedxCloseSvc();
    if (window.jedxCloseProj) window.jedxCloseProj();
    if (!isOpen) {
      lastFocus = document.activeElement;
      np.hidden = false; np.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('np-open');
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(function () { np.classList.add('is-on'); });
      isOpen = true;
      reveal();
      go(key || 'quienes', true);
      setTimeout(function () { var c = np.querySelector('.np-close'); if (c) c.focus({ preventScroll: true }); }, 60);
      if (key && key !== 'quienes') setTimeout(function () { go(key, true); }, 30);
    } else go(key || 'quienes');
  }
  function close(then) {
    if (!isOpen) return;
    isOpen = false;
    np.classList.remove('is-on');
    document.documentElement.classList.remove('np-open');
    document.documentElement.style.overflow = '';
    setTimeout(function () {
      np.hidden = true; np.setAttribute('aria-hidden', 'true');
      if (then) then(); else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, 360);
  }
  window.jedxOpenNos = open;
  window.jedxCloseNos = function () { close(); };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act="openNos"]');
    if (t) { e.preventDefault(); var dd = t.closest('.jn-dd'); if (dd) dd.classList.remove('is-open'); open(t.getAttribute('data-nos')); return; }
    if (!isOpen) return;
    if (e.target.closest('[data-np-toggle]')) { setCollapsed(!np.classList.contains('is-collapsed')); return; }
    var g = e.target.closest('[data-np-go]');
    if (g) { go(g.getAttribute('data-np-go')); return; }
    if (e.target.closest('[data-np-close]')) { close(); return; }
    if (e.target.closest('header a[href^="#"]')) close();
  }, true);
  document.addEventListener('keydown', function (e) {
    if (isOpen && e.key === 'Escape' && !document.querySelector('.jn-dd.is-open, .jn-lang.is-open')) close();
  });

  // marca en el índice la parte que estás leyendo
  var tick = false;
  main.addEventListener('scroll', function () {
    if (tick) return; tick = true;
    requestAnimationFrame(function () {
      tick = false;
      var y = main.scrollTop + main.clientHeight * 0.35, act = 'quienes';
      secs.forEach(function (s) { if (s.offsetTop <= y) act = s.getAttribute('data-np-sec'); });
      if (main.scrollTop + main.clientHeight >= main.scrollHeight - 4) act = secs[secs.length - 1].getAttribute('data-np-sec');
      mark(act);
    });
  });
})();
