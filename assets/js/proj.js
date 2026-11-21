/* JEDX — galería de proyectos a pantalla completa */
(function () {
  var pg = document.getElementById('pg');
  if (!pg) return;
  var slides = Array.prototype.slice.call(pg.querySelectorAll('[data-pg-slide]'));
  var thumbs = Array.prototype.slice.call(pg.querySelectorAll('[data-pg-go]'));
  var cur = -1, isOpen = false, lastFocus = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function runPhone(slide) {
    var img = slide.querySelector('[data-pg-rec]');
    if (!img) return;
    if (!img.getAttribute('src')) img.setAttribute('src', img.getAttribute('data-src'));
    img.classList.remove('pg-run');
    function go() {
      var screen = img.parentElement;
      var frame = screen.clientHeight - 20, dist = img.offsetHeight - frame;
      if (dist <= 0 || reduce) return;
      img.style.setProperty('--d', (-dist) + 'px');
      img.style.setProperty('--t', Math.max(8, dist / 70) + 's');
      void img.offsetWidth;
      img.classList.add('pg-run');
    }
    if (img.complete && img.naturalWidth) go(); else img.addEventListener('load', go, { once: true });
  }
  function show(i) {
    var n = slides.length;
    i = (i + n) % n;
    slides.forEach(function (s, k) { var on = k === i; s.classList.toggle('is-on', on); s.setAttribute('aria-hidden', on ? 'false' : 'true'); });
    thumbs.forEach(function (t, k) { var on = k === i; t.classList.toggle('is-on', on); if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
    var th = thumbs[i]; if (th && th.scrollIntoView) th.scrollIntoView({ block: 'nearest', inline: 'center' });
    cur = i;
    runPhone(slides[i]);
    slides.forEach(function (s, k) { var v = s.querySelector('.pg-vid'); if (v && k !== i) v.pause(); });
    var v = slides[i].querySelector('.pg-vid');
    if (v) { setSrc(v, v.getAttribute('data-src'), function () { slides[i].classList.add('vid-fail'); }); if (!reduce && !slides[i].classList.contains('is-paused')) playSafe(v, slides[i]); else slides[i].classList.add('is-paused'); }
  }
  // carga robusta: si el visor bloquea el video incrustado (data:), reintenta como blob; si igual falla, avisa
  function b64Blob(uri) {
    var i = uri.indexOf(','), mime = uri.slice(5, uri.indexOf(';')), bin = atob(uri.slice(i + 1)), n = bin.length, u = new Uint8Array(n);
    for (var k = 0; k < n; k++) u[k] = bin.charCodeAt(k);
    return URL.createObjectURL(new Blob([u], { type: mime }));
  }
  function setSrc(v, src, onFail) {
    if (v.getAttribute('data-cur') === src && !v.classList.contains('v-fail')) return;
    v.setAttribute('data-cur', src); v.classList.remove('v-fail');
    var tried = false;
    v.onerror = function () {
      if (!tried && /^data:/.test(src)) { tried = true; try { v.src = b64Blob(src); v.load(); var p = v.play(); if (p && p.catch) p.catch(function () {}); return; } catch (e) {} }
      v.classList.add('v-fail'); if (onFail) onFail();
    };
    v.src = src;
  }
  function playSafe(v, box) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () { box.classList.add('is-paused'); sync(box); }); }
  function fmt(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
  // controles (galería y panel) — m = video o rodillo de imagen con la misma interfaz
  function sync(box, m) {
    m = m || box.querySelector('.pg-vid');
    if (!m) return;
    var paused = m.paused, d = m.duration || 0, c = m.currentTime || 0, pct = d ? (c / d * 100) : 0;
    box.classList.toggle('is-paused', paused);
    box.classList.toggle('is-muted', !!m.muted);
    var vc = box.querySelector('.vc') || box;
    var f = vc.querySelector('.vc-fill'), k = vc.querySelector('.vc-knob'), t = vc.querySelector('.vc-time'), b = vc.querySelector('.vc-play'), sn = vc.querySelector('.vc-snd');
    if (f) f.style.width = pct + '%'; if (k) k.style.left = pct + '%';
    if (t) t.textContent = fmt(c) + ' / ' + fmt(d);
    var T = window.jedxT || function (x) { return x; };
    if (b) b.setAttribute('aria-label', T(paused ? 'Reproducir video' : 'Pausar video'));
    if (sn) sn.setAttribute('aria-label', T(m.muted ? 'Activar sonido' : 'Silenciar'));
  }
  slides.forEach(function (s) {
    var v = s.querySelector('.pg-vid'); if (!v) return;
    ['timeupdate', 'play', 'pause', 'loadedmetadata', 'volumechange'].forEach(function (ev) { v.addEventListener(ev, function () { sync(s); }); });
  });
  function control(box, m, act, e) {
    if (act === 'play') { if (m.paused) { box.classList.remove('is-paused'); var pr = m.play(); if (pr && pr.catch) pr.catch(function () {}); } else { m.pause(); box.classList.add('is-paused'); } }
    else if (act === 'snd') { m.muted = !m.muted; if (!m.muted && m.paused) m.play(); }
    else if (act === 'seek' && m.duration) { var r = e.target.closest('.vc-bar').getBoundingClientRect(); m.currentTime = Math.min(.999, Math.max(0, (e.clientX - r.left) / r.width)) * m.duration; }
    else if (act === 'fs') { var el = m.el || m; var w = el.closest('.pv-pc, .pv-m') || el; if (document.fullscreenElement) document.exitFullscreen(); else if (w.requestFullscreen) w.requestFullscreen(); else if (m.webkitEnterFullscreen) m.webkitEnterFullscreen(); }
    sync(box, m);
  }
  function open(i) {
    if (!isOpen) {
      lastFocus = document.activeElement;
      pg.hidden = false; pg.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('pg-open');
      document.documentElement.style.overflow = 'hidden';
      requestAnimationFrame(function () { pg.classList.add('is-on'); });
      isOpen = true;
    }
    show(i);
    setTimeout(function () { var c = pg.querySelector('.pg-close'); if (c) c.focus({ preventScroll: true }); }, 60);
  }
  function close(then) {
    if (!isOpen) return;
    if (pvOpen) closePV();
    isOpen = false;
    pg.classList.remove('is-on');
    document.documentElement.classList.remove('pg-open');
    document.documentElement.style.overflow = '';
    setTimeout(function () {
      pg.hidden = true; pg.setAttribute('aria-hidden', 'true');
      pg.querySelectorAll('.pg-run').forEach(function (im) { im.classList.remove('pg-run'); });
      pg.querySelectorAll('.pg-vid').forEach(function (v) { v.pause(); });
      if (then) then(); else if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, 360);
  }
  // ---- panel "Ver en la página": video de la web completa (computadora / celular)
  var pv = document.getElementById('pv'), PVD = [];
  try { PVD = JSON.parse(document.getElementById('pv-data').textContent); } catch (err) {}
  var pvOpen = false, pvIdx = 0, mode = 'pc', media = null, introWas = null;
  var vPc = pv && pv.querySelector('.pv-pc video'), still = pv && pv.querySelector('.pv-still');
  var vM = pv && pv.querySelector('.pv-m video'), roll = pv && pv.querySelector('.pv-roll');
  // rodillo: imagen larga que baja sola, con la misma interfaz que un video
  var R = { el: roll, paused: true, muted: true, currentTime: 0, duration: 0, _raf: 0, _t0: 0,
    _dist: function () { return Math.max(0, roll.offsetHeight - roll.parentElement.clientHeight); },
    _draw: function () { var p = R.duration ? R.currentTime / R.duration : 0; var e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; roll.style.transform = 'translateY(' + (-R._dist() * e) + 'px)'; sync(pv, R); },
    _tick: function (ts) { if (R.paused) return; if (!R._t0) R._t0 = ts - R.currentTime * 1000; R.currentTime = (ts - R._t0) / 1000; if (R.currentTime >= R.duration) { R.currentTime = 0; R._t0 = ts; } R._draw(); R._raf = requestAnimationFrame(R._tick); },
    play: function () { if (!R.duration) R.duration = Math.max(10, R._dist() / 60); R.paused = false; R._t0 = 0; cancelAnimationFrame(R._raf); R._raf = requestAnimationFrame(R._tick); sync(pv, R); },
    pause: function () { R.paused = true; cancelAnimationFrame(R._raf); sync(pv, R); } };
  Object.defineProperty(R, 'ct', { get: function () { return R.currentTime; } });
  [vPc, vM].forEach(function (v) { if (!v) return; ['timeupdate', 'play', 'pause', 'loadedmetadata', 'volumechange'].forEach(function (ev) { v.addEventListener(ev, function () { if (media === v) sync(pv, v); }); }); });
  function stopAll() { if (vPc) vPc.pause(); if (vM) vM.pause(); R.pause(); }
  function setMode(m, user) {
    var d = PVD[pvIdx]; if (!d) return;
    mode = m; pv.setAttribute('data-mode', m);
    pv.querySelectorAll('[data-pv-mode]').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-pv-mode') === m ? 'true' : 'false'); });
    stopAll();
    var src = m === 'pc' ? d.pc : d.m, v = m === 'pc' ? vPc : vM;
    if (m === 'pc') { vPc.style.display = src ? '' : 'none'; still.style.display = src ? 'none' : ''; if (!src) still.src = d.img; }
    else { vM.style.display = src ? '' : 'none'; roll.style.display = src ? 'none' : ''; }
    if (src) {
      v.muted = true;
      setSrc(v, src, function () { if (media !== v) return; if (m === 'pc') { v.style.display = 'none'; still.src = d.img; still.style.display = ''; media = null; pv.classList.add('no-media'); } else { v.style.display = 'none'; roll.style.display = ''; media = R; R.currentTime = 0; R.duration = 0; roll.onload = function () { if (media === R && pvOpen) R.play(); }; if (roll.getAttribute('src') !== d.rec) roll.src = d.rec; else R.play(); pv.classList.add('no-snd'); } });
      media = v; pv.classList.remove('no-media');
    } else if (m === 'm') {
      media = R; R.currentTime = 0; R.duration = 0;
      if (roll.getAttribute('src') !== d.rec) { roll.onload = function () { if (media === R && pvOpen) { R.duration = 0; R.play(); } }; roll.src = d.rec; }
    } else media = null;
    pv.classList.toggle('no-media', !media);
    pv.classList.toggle('no-snd', media === R || !(m === 'pc' ? d.pcSnd : d.mSnd));
    if (media) { pv.classList.remove('is-paused'); var pr = media.play(); if (pr && pr.catch) pr.catch(function () { pv.classList.add('is-paused'); sync(pv, media); }); sync(pv, media); }
  }
  function openPV(i) {
    var d = PVD[i]; if (!pv || !d) return;
    pvIdx = i; pvOpen = true;
    pv.querySelector('#pv-name').textContent = d.name;
    var sl = slides[cur], iv = sl && sl.querySelector('.pg-vid');
    introWas = iv && !iv.paused ? iv : null; if (iv) iv.pause();
    pv.hidden = false; pv.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('pv-open');
    requestAnimationFrame(function () { pv.classList.add('is-on'); });
    var small = window.matchMedia && window.matchMedia('(max-width: 699px)').matches;
    setMode(small && (d.m || d.rec) ? 'm' : 'pc');
    setTimeout(function () { var c = pv.querySelector('.pv-close'); if (c) c.focus({ preventScroll: true }); }, 60);
  }
  function closePV() {
    if (!pvOpen) return;
    pvOpen = false; stopAll(); media = null;
    if (document.fullscreenElement) document.exitFullscreen();
    pv.classList.remove('is-on');
    document.documentElement.classList.remove('pv-open');
    setTimeout(function () {
      pv.hidden = true; pv.setAttribute('aria-hidden', 'true');
      if (introWas && isOpen) { var p = introWas.play(); if (p && p.catch) p.catch(function () {}); }
      var b = pv && slides[cur] && slides[cur].querySelector('[data-pv-open]'); if (b && isOpen) b.focus({ preventScroll: true });
    }, 320);
  }
  window.jedxOpenPV = openPV; window.jedxClosePV = closePV;

  window.jedxOpenProj = open;
  window.jedxCloseProj = function () { close(); };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act="openProj"]');
    if (t) {
      e.preventDefault();
      if (window.jedxCloseSvc) window.jedxCloseSvc();
      if (window.jedxCloseNos) window.jedxCloseNos();
      open(+t.getAttribute('data-proj-open'));
      return;
    }
    if (pvOpen) {
      var pc = e.target.closest('[data-pv-close]'); if (pc || e.target === pv) { e.preventDefault(); closePV(); return; }
      var md = e.target.closest('[data-pv-mode]'); if (md) { setMode(md.getAttribute('data-pv-mode'), true); return; }
      var pa = e.target.closest('[data-vc]'); if (pa && pv.contains(pa) && media) { control(pv, media, pa.getAttribute('data-vc'), e); return; }
      return;
    }
    if (!isOpen) return;
    var po = e.target.closest('[data-pv-open]'); if (po) { e.preventDefault(); openPV(+po.getAttribute('data-pv-open')); return; }
    var vc = e.target.closest('[data-vc]');
    if (vc) { var sl = vc.closest('[data-pg-slide]'), vv = sl && sl.querySelector('.pg-vid'); if (vv) control(sl, vv, vc.getAttribute('data-vc'), e); return; }
    var g = e.target.closest('[data-pg-go]');
    if (g) { show(+g.getAttribute('data-pg-go')); return; }
    var st = e.target.closest('[data-pg-step]');
    if (st) { show(cur + (+st.getAttribute('data-pg-step'))); return; }
    var cl = e.target.closest('[data-pg-close]');
    if (cl) {
      var href = cl.getAttribute('href');
      if (href && href.charAt(0) === '#') {
        e.preventDefault(); e.stopPropagation();
        close(function () { var a = document.querySelector('header a[href="' + href + '"]'); if (a) a.click(); });
      } else close();
      return;
    }
    if (e.target.closest('header a[href^="#"]')) close();
  }, true);

  document.addEventListener('keydown', function (e) {
    if (pvOpen) {
      if (e.key === 'Escape') { if (!document.fullscreenElement) closePV(); }
      else if (e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); if (media) control(pv, media, 'play'); }
      return;
    }
    if (!isOpen) return;
    if (e.key === 'Escape' && !document.querySelector('.jn-dd.is-open, .jn-lang.is-open')) close();
    else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === 'ArrowLeft') show(cur - 1);
  });

  // deslizar con el dedo en celular
  var x0 = null;
  pg.addEventListener('touchstart', function (e) { if (!e.target.closest('.pg-thumbs, .vc')) x0 = e.touches[0].clientX; }, { passive: true });
  pg.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 60) show(cur + (dx < 0 ? 1 : -1));
  });
})();
