/**
 * Mini-helper para criar elementos DOM.
 * Textos entram sempre como nós de texto (nunca innerHTML) — nomes digitados
 * pelo usuário não podem injetar HTML (o projeto anterior tinha esse problema).
 */
(function (global) {
  const App = (global.App = global.App || {});
  const PROPS = new Set(['value', 'checked', 'disabled', 'selected', 'min', 'max', 'step', 'type']);

  function append(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) kid.forEach((k) => append(el, k));
    else el.appendChild(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }

  App.h = function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (PROPS.has(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    append(el, kids);
    return el;
  };

  App.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  /** Número formatado em pt-BR. */
  App.fmt = (n, d = 3) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  App.pct = (n, d = 1) => App.fmt(n * 100, d) + '%';
})(window);
