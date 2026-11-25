/* global MathJax */
/*
 * Laufzeit des Formel-Renderers (läuft in der WebView).
 *
 * Protokoll mit React Native (src/math/MathView.tsx):
 *   RN → WebView:  window.UM.render({ html, vars, lang })
 *   WebView → RN:  { type: 'ready' }
 *                  { type: 'rendered', mathErrors, ms }
 *                  { type: 'height', value }
 *                  { type: 'error', message }
 *
 * Außerhalb einer RN-WebView (z. B. beim Testen im Browser) gehen die Nachrichten an
 * window.parent bzw. an console.log.
 */
(function () {
  'use strict';

  let root = document.getElementById('root');
  let lastHeight = -1;
  let renderSeq = 0;

  function post(message) {
    let data = JSON.stringify(message);
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(data);
    } else if (window.parent && window.parent !== window) {
      window.parent.postMessage(data, '*');
    } else if (window.console) {
      console.log('[UM]', data);
    }
  }

  function postHeight() {
    let height = Math.ceil(root.getBoundingClientRect().height);
    if (Math.abs(height - lastHeight) > 0.5) {
      lastHeight = height;
      post({ type: 'height', value: height });
    }
  }

  function applyVars(vars) {
    if (!vars) return;
    let style = document.documentElement.style;
    Object.keys(vars).forEach(function (key) {
      style.setProperty('--' + key, String(vars[key]));
    });
  }

  /* Formelkasten (LessonFormulaView): bis 78 % verkleinern, sonst eigener Scrollbalken. */
  function fitFormulaCards() {
    root.querySelectorAll('.formula-card').forEach(function (card) {
      let scroller = card.querySelector('.fx-scroll');
      let inner = card.querySelector('.fx-inner');
      let track = card.querySelector('.fx-track');
      let thumb = card.querySelector('.fx-thumb');
      if (!scroller || !inner) return;
      inner.style.fontSize = '';
      let natural = inner.scrollWidth;
      let available = scroller.clientWidth;
      if (natural > available + 2 && available > 0) {
        let factor = Math.max(0.78, (available - 4) / natural);
        inner.style.fontSize = (factor * 100).toFixed(1) + '%';
      }
      function update() {
        let overflow = scroller.scrollWidth - scroller.clientWidth;
        let visible = overflow > 3;
        card.classList.toggle('overflowing', visible);
        if (visible && track && thumb) {
          let trackWidth = track.clientWidth;
          let thumbWidth = Math.max(28, (trackWidth * scroller.clientWidth) / scroller.scrollWidth);
          thumb.style.width = thumbWidth + 'px';
          thumb.style.left = ((trackWidth - thumbWidth) * scroller.scrollLeft) / overflow + 'px';
        }
      }
      if (!scroller.__umBound) {
        scroller.addEventListener('scroll', update, { passive: true });
        scroller.__umBound = true;
      }
      update();
    });
  }

  /* Abgesetzte und zu breite Inline-Formeln außerhalb der Formelkästen (LaTeXView.swift: fitBlocks). */
  function fitBlocks() {
    root.querySelectorAll('mjx-container[display="true"], .math-block').forEach(function (el) {
      if (el.closest('.formula-card')) return;
      if (el.classList.contains('math-block') && el.querySelector('mjx-container[display="true"]')) return;
      el.style.fontSize = '';
      let available = el.clientWidth;
      let natural = el.scrollWidth;
      if (available <= 0 || natural <= available + 2) return;
      el.style.fontSize = (Math.max(0.7, (available - 4) / natural) * 100).toFixed(1) + '%';
    });
    root.querySelectorAll('mjx-container:not([display="true"])').forEach(function (el) {
      if (el.closest('.formula-card')) return;
      // Verfügbare Breite = Inhaltsbreite des umgebenden Blocks (Karte, Lösungsschritt …), nicht des ganzen Dokuments
      const box = el.parentElement ? el.parentElement.closest('div') || root : root;
      const cs = getComputedStyle(box);
      const maxWidth = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (maxWidth <= 0) return;
      ['fontSize', 'display', 'maxWidth', 'overflowX', 'overflowY', 'verticalAlign'].forEach(function (p) {
        el.style[p] = '';
      });
      let natural = el.getBoundingClientRect().width;
      if (natural <= maxWidth + 2) return;
      el.style.fontSize = (Math.max(0.7, (maxWidth - 4) / natural) * 100).toFixed(1) + '%';
      el.style.display = 'inline-block';
      el.style.maxWidth = '100%';
      el.style.overflowX = 'auto';
      el.style.overflowY = 'hidden';
      el.style.verticalAlign = 'middle';
    });
  }

  function layout() {
    fitFormulaCards();
    fitBlocks();
    postHeight();
  }

  function render(payload) {
    let seq = ++renderSeq;
    let started = performance.now();
    applyVars(payload.vars);
    if (payload.lang) document.documentElement.lang = payload.lang;
    MathJax.startup.promise
      .then(function () {
        if (seq !== renderSeq) return;
        MathJax.typesetClear([root]);
        root.innerHTML = payload.html || '';
        return MathJax.typesetPromise([root]);
      })
      .then(function () {
        if (seq !== renderSeq) return;
        layout();
        post({
          type: 'rendered',
          mathErrors: root.querySelectorAll('[data-mml-node="merror"]').length,
          ms: Math.round(performance.now() - started),
        });
      })
      .catch(function (error) {
        post({ type: 'error', message: String((error && error.message) || error) });
      });
  }

  window.UM = { render: render, layout: layout };

  /* Tippbare Elemente: <… data-action="…"> meldet { type: 'action', value } an React Native. */
  root.addEventListener('click', function (event) {
    const target = event.target.closest('[data-action]');
    if (target && root.contains(target)) post({ type: 'action', value: target.getAttribute('data-action') });
  });

  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(postHeight).observe(root);
  window.addEventListener('resize', layout);

  MathJax.startup.promise.then(function () {
    post({ type: 'ready' });
  });
})();
