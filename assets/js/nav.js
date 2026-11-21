/* JEDX — menú principal (submenú de servicios, idiomas, menú móvil) y traducción de la página */
(function () {
  var D = window.JEDX_I18N || {};
  var cur = 'es';
  var LABEL = { es: 'ES', en: 'EN', 'en-CA': 'EN-CA', fr: 'FR', de: 'DE', zh: '中文' };
  var HTML_LANG = { es: 'es', en: 'en', 'en-CA': 'en-CA', fr: 'fr', de: 'de', zh: 'zh-Hans' };
  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  window.jedxT = function (s) {
    if (cur === 'es' || !s) return s;
    var t = D[cur] && D[cur][norm(s)];
    return t || s;
  };

  /* ---------- textos de la página ---------- */
  var nodes = [], attrs = [], ready = false;
  var ATTRS = ['aria-label', 'alt', 'title'];
  function collect() {
    var skip = 'script,style,svg,[data-no-i18n],[data-words],[data-words-src],[data-brand-split]';
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!/\S/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (!p || p.closest(skip)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = w.nextNode())) {
      var v = n.nodeValue, m = v.match(/^(\s*)([\s\S]*?)(\s*)$/);
      nodes.push({ n: n, a: m[1], s: m[2], z: m[3] });
    }
    document.querySelectorAll('[aria-label],[alt],[title]').forEach(function (el) {
      if (el.closest('[data-no-i18n]')) return;
      ATTRS.forEach(function (k) { var v = el.getAttribute(k); if (v && /[a-záéíóúñ]/i.test(v)) attrs.push({ el: el, k: k, s: v }); });
    });
    ready = true;
  }
  function apply(lang) {
    if (!D[lang] && lang !== 'es') lang = 'es';
    cur = lang;
    if (!ready) collect();
    nodes.forEach(function (o) { if (o.n.isConnected) o.n.nodeValue = o.a + window.jedxT(o.s) + o.z; });
    attrs.forEach(function (o) { o.el.setAttribute(o.k, window.jedxT(o.s)); });
    document.documentElement.lang = HTML_LANG[lang] || lang;
    document.querySelectorAll('[data-lang-label]').forEach(function (el) { el.textContent = LABEL[lang] || lang; });
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.setAttribute(b.hasAttribute('aria-pressed') ? 'aria-pressed' : 'aria-checked', on ? 'true' : 'false');
    });
    var burger = document.querySelector('[data-burger]');
    if (burger) burger.setAttribute('aria-label', window.jedxT(burger.classList.contains('is-open') ? 'Cerrar' : 'Abrir menú'));
    if (window.jedxRebuildWords) window.jedxRebuildWords();
    try { localStorage.setItem('jedx-lang', lang); } catch (e) {}
  }
  window.jedxSetLang = apply;

  /* ---------- abrir y cerrar: submenús (Servicios y Proyectos), idioma y menú móvil ---------- */
  var dds = Array.prototype.slice.call(document.querySelectorAll('[data-dd]'));
  var lbox = document.querySelector('[data-lang-box]');
  var lBtn = lbox && lbox.querySelector('[data-lang-toggle]');
  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function setDD(dd, open) {
    if (!dd) return;
    dd.classList.toggle('is-open', open);
    var b = dd.querySelector('[data-dd-btn]');
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { dds.forEach(function (o) { if (o !== dd) setDD(o, false); }); setLang(false); }
  }
  function closeAllDD() { dds.forEach(function (d) { setDD(d, false); }); }
  function setLang(open) {
    if (!lbox) return;
    lbox.classList.toggle('is-open', open);
    lBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) closeAllDD();
  }
  dds.forEach(function (dd) {
    var btn = dd.querySelector('[data-dd-btn]');
    var isLink = btn.hasAttribute('data-dd-link');
    var timer = null;
    btn.addEventListener('click', function (e) {
      if (isLink) { setDD(dd, false); return; }   // "Proyectos" lleva a la sección
      e.stopPropagation(); setDD(dd, !dd.classList.contains('is-open'));
    });
    if (canHover) {
      dd.addEventListener('mouseenter', function () { clearTimeout(timer); setDD(dd, true); });
      dd.addEventListener('mouseleave', function () { clearTimeout(timer); timer = setTimeout(function () { setDD(dd, false); }, 160); });
    }
    dd.addEventListener('click', function (e) { if (e.target.closest('.jn-panel [data-act], .jn-panel a')) setDD(dd, false); });
    dd.addEventListener('keydown', function (e) {
      var items = Array.prototype.slice.call(dd.querySelectorAll('.jn-panel button, .jn-panel a'));
      var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); if (!dd.classList.contains('is-open')) setDD(dd, true); (items[i + 1] || items[0]).focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); (items[i - 1] || items[items.length - 1]).focus(); }
      else if (e.key === 'Escape') { setDD(dd, false); btn.focus(); }
    });
  });
  if (lbox) {
    lBtn.addEventListener('click', function (e) { e.stopPropagation(); setLang(!lbox.classList.contains('is-open')); });
    lbox.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setLang(false); lBtn.focus(); } });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lang]');
    if (b) { apply(b.getAttribute('data-lang')); setLang(false); return; }
    dds.forEach(function (dd) { if (!dd.contains(e.target)) setDD(dd, false); });
    if (lbox && !e.target.closest('[data-lang-box]')) setLang(false);
  });

  /* ---------- menú móvil: acordeones ---------- */
  document.querySelectorAll('[data-acc]').forEach(function (acc) {
    var ab = acc.querySelector('[data-acc-btn]');
    ab.addEventListener('click', function () {
      var open = !acc.classList.contains('is-open');
      acc.classList.toggle('is-open', open);
      ab.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
  // un servicio o proyecto del menú móvil abre su panel: primero se cierra el menú
  document.addEventListener('click', function (e) {
    if (e.target.closest('.jn-svc-m, .jn-pj-m, .jn-msub [data-act="openNos"]')) {
      var burger = document.querySelector('[data-burger]');
      if (burger && burger.classList.contains('is-open')) burger.click();
    }
  }, true);

  /* ---------- idioma inicial ---------- */
  function start() {
    var saved = null;
    try { saved = localStorage.getItem('jedx-lang'); } catch (e) {}
    collect();
    if (saved && saved !== 'es') setTimeout(function () { apply(saved); }, 400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  // Contacto: copiar correo o teléfono
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-copy]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var v = b.getAttribute('data-copy');
    var done = function () { b.classList.add('is-done'); setTimeout(function () { b.classList.remove('is-done'); }, 1400); };
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(done, done); else throw 0; }
    catch (err) { var t = document.createElement('textarea'); t.value = v; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e2) {} t.remove(); done(); }
  }, true);
})();
