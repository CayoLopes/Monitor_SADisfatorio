/** Componentes de UI reutilizáveis. */
(function (global) {
  const App = (global.App = global.App || {});
  const { h, icon, fmt } = App;
  const C = (App.components = {});

  const INTENSITY = {
    1: 'Igual', 2: 'Entre igual e moderada', 3: 'Moderada', 4: 'Entre moderada e forte', 5: 'Forte',
    6: 'Entre forte e muito forte', 7: 'Muito forte', 8: 'Entre muito forte e extrema', 9: 'Extrema',
  };

  /* ---------- Confirmação (usa <dialog>) ---------- */
  C.confirm = function (message, { okLabel = 'Confirmar', danger = false } = {}) {
    return new Promise((resolve) => {
      if (typeof HTMLDialogElement === 'undefined') return resolve(window.confirm(message));
      const dlg = h('dialog', null,
        h('h3', null, 'Tem certeza?'),
        h('p', { class: 'muted' }, message),
        h('div', { class: 'actions' },
          h('button', { class: 'btn btn-ghost', type: 'button', onClick: () => dlg.close('no') }, 'Cancelar'),
          h('button', { class: 'btn ' + (danger ? 'btn-danger-soft' : 'btn-primary'), type: 'button', onClick: () => dlg.close('yes') }, okLabel)));
      dlg.addEventListener('close', () => { resolve(dlg.returnValue === 'yes'); dlg.remove(); });
      document.body.appendChild(dlg);
      dlg.showModal();
    });
  };

  /* ---------- Legenda da escala ---------- */
  C.scaleLegend = () => h('ul', { class: 'scale-legend', 'aria-label': 'Escala de importância' },
    [[1, 'igual'], [3, 'moderada'], [5, 'forte'], [7, 'muito forte'], [9, 'extrema']].map(([n, t]) =>
      h('li', null, h('b', null, n), ' = ', t)));

  /* ---------- Cartão de comparação (slider) ---------- */
  /**
   * @param {{left:string, right:string, pos:number, phrase:'criteria'|'alt', onChange:(pos:number)=>void}} o
   */
  C.pairCard = function (o) {
    const MAX = AHP.MAX_PAIR_POS;
    const leftSide = h('span', { class: 'side left', title: o.left }, o.left);
    const rightSide = h('span', { class: 'side right', title: o.right }, o.right);
    const text = h('div', { class: 'pair-text', 'aria-live': 'polite' });
    const slider = h('input', { class: 'slider', type: 'range', min: -MAX, max: MAX, step: 1, value: o.pos, 'aria-label': `Comparar ${o.left} com ${o.right}` });

    const ticks = h('div', { class: 'ticks', 'aria-hidden': 'true' });
    [-8, -6, -4, -2, 0, 2, 4, 6, 8].forEach((p) =>
      ticks.appendChild(h('span', { style: { left: ((p + MAX) / (2 * MAX)) * 100 + '%' } }, Math.abs(p) + 1)));

    const reset = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onClick: () => { slider.value = 0; paint(); o.onChange(0); } }, 'Igual importância');
    const resetWrap = h('div', { class: 'pair-reset' }, reset);

    function paint() {
      const pos = Number(slider.value);
      const pctPos = ((pos + MAX) / (2 * MAX)) * 100;
      slider.style.setProperty('--a', Math.min(50, pctPos) + '%');
      slider.style.setProperty('--b', Math.max(50, pctPos) + '%');
      slider.style.setProperty('--fill', pos < 0 ? 'var(--blue-400)' : 'var(--purple-400)');
      slider.style.setProperty('--thumb', pos < 0 ? 'var(--blue-500)' : pos > 0 ? 'var(--purple-500)' : 'var(--ink-faint)');
      leftSide.classList.toggle('win', pos < 0);
      rightSide.classList.toggle('win', pos > 0);
      reset.disabled = pos === 0;

      const k = Math.abs(pos) + 1;
      App.clear(text);
      if (pos === 0) {
        text.append(h('strong', null, o.left), ' e ', h('strong', null, o.right),
          o.phrase === 'criteria' ? ' têm a mesma importância.' : ' estão equivalentes neste critério.');
      } else {
        const [w, l] = pos < 0 ? [o.left, o.right] : [o.right, o.left];
        text.append(h('strong', null, w),
          o.phrase === 'criteria' ? ' é mais importante que ' : ' se destaca mais que ',
          h('strong', null, l), ' ',
          h('span', { class: 'tag' }, `— ${INTENSITY[k]} (${k}×)`));
      }
    }
    slider.addEventListener('input', () => { paint(); o.onChange(Number(slider.value)); });
    paint();

    const el = h('div', { class: 'pair' },
      h('div', { class: 'pair-sides' }, leftSide, h('span', { class: 'vs' }, 'VS'), rightSide),
      h('div', { class: 'slider-wrap' }, slider, ticks),
      text, resetWrap);
    return {
      el,
      setSuggested(on) { el.classList.toggle('is-suggested', on); },
    };
  };

  /* ---------- Painel de consistência ---------- */
  C.consistencyPanel = function () {
    const el = h('section', { class: 'consistency neutral', 'aria-live': 'polite' });
    return {
      el,
      /** @param {object} ev resultado de AHP.evaluate  @param {(id)=>string} name  @param {{strict:boolean}} opts */
      update(ev, name, opts = {}) {
        App.clear(el);
        if (!ev.applicable) {
          el.className = 'consistency neutral';
          el.append(
            h('div', { class: 'consistency-title' }, icon('info'), 'Consistência não se aplica'),
            h('p', null, 'Com apenas dois itens não há como haver contradição — pode seguir.'));
          return;
        }
        const ok = ev.consistent;
        el.className = 'consistency ' + (ok ? 'ok' : 'warn');
        const meterPct = Math.min(100, (ev.cr / 0.3) * 100);
        el.append(
          h('div', { class: 'consistency-head' },
            h('div', { class: 'consistency-title' }, icon(ok ? 'check' : 'alert'),
              ok ? 'Julgamentos consistentes' : 'Há contradições nos julgamentos'),
            h('div', null, 'CR ', h('span', { class: 'cr-value' }, fmt(ev.cr, 3)), h('span', { class: 'muted' }, ' (limite 0,100)'))),
          h('div', { class: 'meter', role: 'img', 'aria-label': `Razão de consistência ${fmt(ev.cr, 3)}` },
            h('div', { class: 'bar', style: { width: meterPct + '%' } }), h('div', { class: 'limit' })),
          h('div', { class: 'meter-legend' }, h('span', null, '0'), h('span', null, '0,3+')));

        if (ok) {
          el.append(h('p', null, 'As comparações seguem uma lógica coerente. Você pode continuar.'));
        } else {
          const s = ev.suggestion;
          const hint = s && h('span', null, ' Comece revisando ', h('strong', null, name(s.a)), ' × ', h('strong', null, name(s.b)),
            ' (destacado acima): os seus outros julgamentos indicam ',
            s.suggestedPos === 0 ? 'importância igual.' :
              h('span', null, h('strong', null, `≈ ${Math.abs(s.suggestedPos) + 1}×`), ' a favor de ', h('strong', null, name(s.suggestedPos < 0 ? s.a : s.b)), '.'));
          el.append(h('p', null,
            opts.strict ? 'Ajuste as comparações para continuar.' : 'Você pode continuar, mas o resultado ficará menos confiável.', hint));
        }
      },
    };
  };

  /* ---------- Seção completa de comparação par a par ---------- */
  /**
   * Reutilizada para critérios × critérios e candidatos × candidatos (por critério).
   * @param {{ids:string[], name:(id)=>string, judgments:object, phrase:'criteria'|'alt',
   *          strict:boolean, onJudge:(key,ratio)=>void, onStatus:(ev)=>void}} o
   */
  C.pairwiseSection = function (o) {
    const cards = new Map();
    const panel = C.consistencyPanel();
    const list = h('div', { class: 'pair-list' });

    function refresh() {
      const ev = AHP.evaluate(o.ids, o.judgments);
      panel.update(ev, o.name, { strict: o.strict });
      cards.forEach((card, key) => card.setSuggested(false));
      if (ev.suggestion) {
        const card = cards.get(AHP.pairKey(ev.suggestion.a, ev.suggestion.b));
        if (card) card.setSuggested(true);
      }
      o.onStatus(ev);
      return ev;
    }

    AHP.pairs(o.ids).forEach(([a, b]) => {
      const key = AHP.pairKey(a, b);
      const card = C.pairCard({
        left: o.name(a), right: o.name(b), phrase: o.phrase,
        pos: AHP.posFromRatio(o.judgments[key] || 1),
        onChange(pos) { o.onJudge(key, AHP.ratioFromPos(pos)); refresh(); },
      });
      cards.set(key, card);
      list.appendChild(card.el);
    });

    const el = h('div', null, C.scaleLegend(), list, panel.el);
    refresh();
    return { el, refresh };
  };
})(window);
