/* Etapa 5 — Resultado */
(function (global) {
  const App = (global.App = global.App || {});
  const { h, icon, store, fmt, pct } = App;
  App.views = App.views || {};

  App.views.result = function (ctx) {
    const s = store.state;
    const cIds = s.criteria.map((c) => c.id);
    const aIds = s.candidates.map((c) => c.id);
    const r = AHP.analyze({ criteria: cIds, alternatives: aIds, criteriaJudgments: s.criteriaJudgments, altJudgments: s.altJudgments });
    const cName = (i) => s.criteria[i].name;
    const aName = (i) => s.candidates[i].name;
    const color = (i) => `var(--series-${(i % 6) + 1})`;

    const top = r.ranking[0];
    const tied = r.ranking.filter((x) => Math.abs(x.score - top.score) < 1e-9).length > 1;

    /* --- Destaque --- */
    const winner = h('div', { class: 'winner' },
      h('div', { class: 'trophy' }, icon('trophy')),
      h('div', null,
        h('div', { class: 'pct' }, tied ? 'Empate técnico entre os primeiros' : 'Monitor recomendado'),
        h('div', { class: 'name' }, tied ? r.ranking.filter((x) => Math.abs(x.score - top.score) < 1e-9).map((x) => aName(x.index)).join(' · ') : aName(top.index)),
        h('div', { class: 'pct' }, `${pct(top.score)} de prioridade global`)));

    /* --- Ranking com barras empilhadas por critério --- */
    const ranking = h('ol', { class: 'rank-list' }, r.ranking.map((x, pos) =>
      h('li', { class: 'rank-item' },
        h('span', { class: 'rank-pos' }, pos + 1),
        h('div', null,
          h('div', { class: 'rank-name' }, aName(x.index)),
          h('div', { class: 'stack', role: 'img', 'aria-label': `${aName(x.index)}: ${pct(x.score)}` },
            x.contributions.map((v, c) => h('span', { style: { width: (v / top.score) * 100 + '%', background: color(c) }, title: `${cName(c)}: ${pct(v)}` })))),
        h('span', { class: 'rank-score' }, pct(x.score)))));

    const legend = h('div', { class: 'legend' }, s.criteria.map((c, i) =>
      h('span', null, h('i', { style: { background: color(i) } }), `${c.name} (${pct(r.criteria.weights[i], 0)})`)));

    /* --- Tabela de prioridades locais --- */
    const matrix = h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
      h('thead', null, h('tr', null, h('th', null, 'Candidato'), s.criteria.map((c) => h('th', null, c.name)), h('th', null, 'Total'))),
      h('tbody', null, r.ranking.map((x) => h('tr', null, h('td', null, aName(x.index)),
        s.criteria.map((_, c) => h('td', null, fmt(r.local[c].weights[x.index], 3))), h('td', null, h('strong', null, fmt(x.score, 3)))))),
      h('tfoot', null, h('tr', null, h('td', null, 'Peso do critério'),
        r.criteria.weights.map((w) => h('td', null, fmt(w, 3))), h('td', null, '1,000')))));

    /* --- Consistência --- */
    const badge = (ev) => !ev.applicable ? h('span', { class: 'badge neutral' }, 'n/a (2 itens)')
      : h('span', { class: 'badge ' + (ev.consistent ? 'ok' : 'warn') }, icon(ev.consistent ? 'check' : 'alert'), ev.consistent ? 'Aceitável' : 'Revisar');
    const row = (label, ev) => h('tr', null, h('td', null, label), h('td', null, ev.applicable ? fmt(ev.lambdaMax, 3) : '—'),
      h('td', null, ev.applicable ? fmt(ev.ci, 3) : '—'), h('td', null, ev.applicable ? fmt(ev.cr, 3) : '—'), h('td', null, badge(ev)));
    const consist = h('div', { class: 'table-wrap' }, h('table', { class: 'data' },
      h('thead', null, h('tr', null, ['Matriz', 'λ máx', 'CI', 'CR', 'Situação'].map((t) => h('th', null, t)))),
      h('tbody', null, row('Critérios', r.criteria), s.criteria.map((c, i) => row(`Candidatos · ${c.name}`, r.local[i])))));

    /* --- Ações --- */
    function exportJson() {
      const data = {
        geradoEm: new Date().toISOString(),
        candidatos: s.candidates.map((c) => c.name),
        criterios: s.criteria.map((c, i) => ({ nome: c.name, peso: r.criteria.weights[i], cr: r.criteria.cr })),
        ranking: r.ranking.map((x) => ({ candidato: aName(x.index), pontuacao: x.score })),
        consistenciaCandidatos: s.criteria.map((c, i) => ({ criterio: c.name, cr: r.local[i].cr, aceitavel: r.local[i].consistent })),
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = h('a', { href: url, download: 'resultado-ahp.json' });
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }

    ctx.nav.set({ canNext: false, hideNext: true, onBack: () => { store.update({ altIndex: s.criteria.length - 1 }); ctx.go(3); }, backLabel: 'Ajustar' });

    return h('div', { class: 'card' },
      h('div', { class: 'view-head' },
        h('span', { class: 'eyebrow' }, 'Etapa 5 de 5'),
        h('h2', null, 'Resultado da seleção'),
        h('p', { class: 'muted' }, 'Ranking final do AHP: a pontuação de cada candidato é a soma, ponderada pelo peso de cada critério, do seu desempenho relativo.')),
      !r.allConsistent && h('div', { class: 'consistency warn', style: { marginTop: 0, marginBottom: '20px' } },
        h('div', { class: 'consistency-title' }, icon('alert'), 'Algumas matrizes têm CR acima de 0,10'),
        h('p', null, 'O ranking é válido, mas considere revisar as comparações marcadas como “Revisar” na tabela de consistência.')),
      winner, ranking, legend,
      h('h3', null, 'Prioridades por critério'), matrix,
      h('h3', null, 'Consistência dos julgamentos'), consist,
      h('div', { class: 'actions no-print' },
        h('button', { class: 'btn btn-soft', type: 'button', onClick: exportJson }, icon('download'), 'Exportar JSON'),
        h('button', { class: 'btn btn-soft', type: 'button', onClick: () => window.print() }, icon('print'), 'Imprimir'),
        h('button', { class: 'btn btn-danger-soft', type: 'button', onClick: ctx.restart }, icon('reset'), 'Nova seleção')));
  };
})(window);
