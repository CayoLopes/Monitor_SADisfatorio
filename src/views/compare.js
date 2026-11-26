/* Etapa 4 — Comparação dos candidatos, um critério por vez */
(function (global) {
  const App = (global.App = global.App || {});
  const { h, icon, store } = App;
  App.views = App.views || {};

  App.views.compare = function (ctx) {
    const s = store.state;
    const crit = s.criteria;
    const idx = Math.min(s.altIndex, crit.length - 1);
    const current = crit[idx];
    const last = idx === crit.length - 1;
    const nameOf = (id) => (s.candidates.find((c) => c.id === id) || {}).name || '?';

    if (!s.altJudgments[current.id]) store.update((st) => { st.altJudgments[current.id] = {}; });
    const judgments = store.state.altJudgments[current.id];

    const goIdx = (i) => { store.update({ altIndex: i }); ctx.rerender(); };

    const section = App.components.pairwiseSection({
      ids: s.candidates.map((c) => c.id),
      name: nameOf,
      judgments,
      phrase: 'alt',
      strict: false, // para candidatos só avisa: muitas comparações dificultam CR ≤ 0,10
      onJudge: (key, ratio) => store.update((st) => { st.altJudgments[current.id][key] = ratio; }),
      onStatus: (ev) => ctx.nav.set({
        canNext: true,
        nextLabel: last ? 'Ver resultado' : 'Próximo critério',
        hint: ev.consistent ? '' : 'Atenção: há inconsistências neste critério.',
      }),
    });

    ctx.nav.set({
      onNext: () => (last ? ctx.go(4) : goIdx(idx + 1)),
      onBack: () => (idx > 0 ? goIdx(idx - 1) : ctx.go(2)),
    });

    const chips = h('div', { class: 'subsets', role: 'tablist', 'aria-label': 'Critérios' },
      crit.map((c, i) => h('button', {
        class: 'chip' + (i === idx ? ' current' : i < idx ? ' done' : ''), type: 'button', role: 'tab',
        'aria-selected': i === idx ? 'true' : 'false', disabled: i > idx,
        onClick: () => goIdx(i),
      }, i < idx && icon('check'), c.name)));

    return h('div', { class: 'card' },
      h('div', { class: 'view-head' },
        h('span', { class: 'eyebrow' }, `Etapa 4 de 5 · critério ${idx + 1} de ${crit.length}`),
        h('h2', null, current.name),
        h('p', { class: 'muted' }, current.desc ? current.desc + ' ' : '', 'Compare os candidatos dois a dois apenas neste critério.')),
      chips, section.el);
  };
})(window);
