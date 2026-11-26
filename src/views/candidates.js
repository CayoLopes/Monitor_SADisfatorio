/* Etapa 1 — Candidatos */
(function (global) {
  const App = (global.App = global.App || {});
  const { h, icon, store } = App;
  const { minCandidates, maxCandidates } = App.LIMITS;
  App.views = App.views || {};

  App.views.candidates = function (ctx) {
    const list = h('div');
    const addBtn = h('button', { class: 'btn btn-soft', type: 'button', onClick: () => addRow(true) }, icon('plus'), 'Adicionar candidato');
    const counter = h('span', { class: 'counter' });

    const norm = (s) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

    function validate() {
      const cs = store.state.candidates;
      const seen = new Map();
      let ok = cs.length >= minCandidates;
      cs.forEach((c) => {
        const n = norm(c.name);
        seen.set(n, (seen.get(n) || 0) + 1);
        if (!n) ok = false;
      });
      const dup = (c) => norm(c.name) && seen.get(norm(c.name)) > 1;
      if (cs.some(dup)) ok = false;
      return { ok, dup };
    }

    function refresh() {
      const { ok, dup } = validate();
      const cs = store.state.candidates;
      list.querySelectorAll('.field-row').forEach((row, i) => {
        const bad = dup(cs[i]);
        row.querySelector('input').classList.toggle('invalid', bad);
        const err = row.nextElementSibling;
        if (err && err.classList.contains('field-error')) err.hidden = !bad;
      });
      counter.textContent = `${cs.length} candidato${cs.length > 1 ? 's' : ''} (mín. ${minCandidates}, máx. ${maxCandidates})`;
      counter.classList.toggle('ok', ok);
      addBtn.disabled = cs.length >= maxCandidates;
      list.querySelectorAll('.remove-btn').forEach((b) => (b.disabled = cs.length <= minCandidates));
      ctx.nav.set({ canNext: ok, hint: ok ? '' : 'Preencha todos os nomes (sem repetir) para continuar.' });
    }

    function row(c, i) {
      const input = h('input', {
        class: 'input', type: 'text', value: c.name, maxlength: 60, placeholder: `Nome do candidato ${i + 1}`,
        'aria-label': `Nome do candidato ${i + 1}`, autocomplete: 'off',
        onInput: (e) => { c.name = e.target.value; store.update({}); refresh(); },
        onKeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); const next = e.target.closest('.field-row').nextElementSibling?.nextElementSibling?.querySelector('input'); next ? next.focus() : addRow(true); } },
      });
      return [
        h('div', { class: 'field-row' },
          h('span', { class: 'num' }, i + 1), input,
          h('button', { class: 'btn btn-ghost btn-icon remove-btn', type: 'button', 'aria-label': `Remover candidato ${i + 1}`, onClick: () => removeRow(c.id) }, icon('trash'))),
        h('div', { class: 'field-error', hidden: true }, 'Este nome já foi usado.'),
      ];
    }

    function render() {
      App.clear(list);
      store.state.candidates.forEach((c, i) => list.append(...row(c, i)));
      refresh();
    }

    function addRow(focus) {
      if (store.state.candidates.length >= maxCandidates) return;
      store.update((s) => s.candidates.push({ id: store.uid(), name: '' }));
      render();
      if (focus) list.querySelectorAll('input')[store.state.candidates.length - 1].focus();
    }

    function removeRow(id) {
      if (store.state.candidates.length <= minCandidates) return;
      store.update((s) => { s.candidates = s.candidates.filter((c) => c.id !== id); });
      store.prune();
      render();
    }

    ctx.nav.set({ onNext: () => {
      // limpa espaços e normaliza antes de avançar
      store.update((s) => s.candidates.forEach((c) => (c.name = c.name.trim().replace(/\s+/g, ' '))));
      store.prune();
      ctx.go(1);
    } });

    render();
    return h('div', { class: 'card' },
      h('div', { class: 'view-head' },
        h('span', { class: 'eyebrow' }, 'Etapa 1 de 5'),
        h('h2', null, 'Quem são os candidatos à monitoria?'),
        h('p', { class: 'muted' }, 'Este sistema usa o método AHP para transformar comparações simples entre pares em um ranking justo e rastreável. Comece listando os alunos.')),
      h('ul', { class: 'hero' },
        h('li', null, h('b', null, '1 · Candidatos'), 'Informe quem está concorrendo.'),
        h('li', null, h('b', null, '2 · Critérios'), 'Escolha e pese o que mais importa.'),
        h('li', null, h('b', null, '3 · Comparações'), 'Compare os alunos dois a dois.')),
      list,
      h('div', { class: 'actions' }, addBtn, counter));
  };
})(window);
