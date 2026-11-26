/* Etapa 3 — Importância relativa dos critérios (matriz de critérios) */
(function (global) {
  const App = (global.App = global.App || {});
  const { h, store } = App;
  App.views = App.views || {};

  App.views.weights = function (ctx) {
    const crit = store.state.criteria;
    const nameOf = (id) => (crit.find((c) => c.id === id) || {}).name || '?';
    const [a, b, c] = crit.map((x) => x.name);

    const section = App.components.pairwiseSection({
      ids: crit.map((x) => x.id),
      name: nameOf,
      judgments: store.state.criteriaJudgments,
      phrase: 'criteria',
      strict: true,
      onJudge: (key, ratio) => store.update((s) => { s.criteriaJudgments[key] = ratio; }),
      onStatus: (ev) => ctx.nav.set({
        canNext: ev.consistent,
        hint: ev.consistent ? '' : 'Resolva as contradições para continuar.',
      }),
    });

    ctx.nav.set({ onNext: () => ctx.go(3) });

    return h('div', { class: 'card' },
      h('div', { class: 'view-head' },
        h('span', { class: 'eyebrow' }, 'Etapa 3 de 5'),
        h('h2', null, 'Qual critério pesa mais?'),
        h('p', { class: 'muted' }, 'Compare os critérios dois a dois. Deslize para o lado do critério mais importante — quanto mais longe, maior a diferença.')),
      h('details', { class: 'explain' },
        h('summary', null, 'Por que verificamos a consistência?'),
        h('p', null, 'Quando comparamos itens dois a dois, é natural surgirem contradições. Por exemplo: se ',
          h('em', null, a), ' é mais importante que ', h('em', null, b), ' e ', h('em', null, b), ' é mais importante que ',
          h('em', null, c), ', espera-se que ', h('em', null, a), ' também seja mais importante que ', h('em', null, c), '.'),
        h('p', null, 'O AHP mede isso pela ', h('strong', null, 'Razão de Consistência (CR)'),
          '. Valores até ', h('strong', null, '0,10'), ' são considerados aceitáveis. Acima disso, o painel indica qual comparação revisar.')),
      section.el);
  };
})(window);
