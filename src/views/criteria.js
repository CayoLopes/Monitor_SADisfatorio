/* Etapa 2 — Escolha dos critérios */
(function (global) {
  const App = (global.App = global.App || {});
  const { h, icon, store } = App;
  const { minCriteria, maxCriteria } = App.LIMITS;
  App.views = App.views || {};

  App.views.criteria = function (ctx) {
    const grid = h('div', { class: 'choice-grid' });
    const counter = h('span', { class: 'counter' });
    const customInput = h('input', { class: 'input', type: 'text', maxlength: 50, placeholder: 'Ex.: Pontualidade', 'aria-label': 'Novo critério' });
    const customErr = h('div', { class: 'field-error', hidden: true, style: { marginLeft: 0 } });

    const selected = () => store.state.criteria;
    const isSel = (id) => selected().some((c) => c.id === id);
    const norm = (s) => s.trim().toLocaleLowerCase('pt-BR');

    function toggle(item) {
      store.update((s) => {
        if (isSel(item.id)) s.criteria = s.criteria.filter((c) => c.id !== item.id);
        else if (s.criteria.length < maxCriteria) s.criteria.push(item);
      });
      store.prune();
      render();
    }

    function addCustom() {
      const name = customInput.value.trim().replace(/\s+/g, ' ');
      customErr.hidden = true;
      const all = [...App.CRITERIA_CATALOG, ...selected().filter((c) => c.custom)];
      if (!name) return;
      if (all.some((c) => norm(c.name) === norm(name))) { customErr.textContent = 'Esse critério já existe.'; customErr.hidden = false; return; }
      if (selected().length >= maxCriteria) { customErr.textContent = `Máximo de ${maxCriteria} critérios.`; customErr.hidden = false; return; }
      store.update((s) => s.criteria.push({ id: store.uid(), name, custom: true }));
      customInput.value = '';
      render();
    }

    function card(item) {
      const checked = isSel(item.id);
      const full = !checked && selected().length >= maxCriteria;
      const input = h('input', { type: 'checkbox', checked, disabled: full, onChange: () => toggle(item) });
      return h('label', { class: 'choice' + (checked ? ' checked' : '') + (full ? ' disabled' : '') },
        input, h('span', { class: 'box' }, icon('check')),
        h('div', { class: 'choice-title' }, item.name),
        item.desc && h('div', { class: 'choice-desc' }, item.desc));
    }

    function render() {
      // critérios personalizados só existem enquanto estão selecionados
      App.clear(grid);
      const customs = selected().filter((c) => c.custom);
      [...App.CRITERIA_CATALOG, ...customs].forEach((item) => {
        const c = card(item);
        if (item.custom) {
          c.appendChild(h('button', { class: 'btn btn-ghost btn-icon btn-sm remove', type: 'button', 'aria-label': `Remover ${item.name}`,
            onClick: (e) => { e.preventDefault(); toggle(item); } }, icon('trash')));
        }
        grid.appendChild(c);
      });
      const n = selected().length;
      const ok = n >= minCriteria;
      counter.textContent = `${n} selecionado${n === 1 ? '' : 's'} (mín. ${minCriteria}, máx. ${maxCriteria})`;
      counter.classList.toggle('ok', ok);
      ctx.nav.set({ canNext: ok, hint: ok ? '' : `Escolha pelo menos ${minCriteria} critérios.` });
    }

    ctx.nav.set({ onNext: () => ctx.go(2) });
    render();

    return h('div', { class: 'card' },
      h('div', { class: 'view-head' },
        h('span', { class: 'eyebrow' }, 'Etapa 2 de 5'),
        h('h2', null, 'O que você vai levar em conta?'),
        h('p', { class: 'muted' }, `Selecione de ${minCriteria} a ${maxCriteria} critérios para avaliar os candidatos. Você também pode criar o seu.`)),
      grid,
      h('div', { class: 'field-row', style: { marginTop: '4px' } },
        customInput,
        h('button', { class: 'btn btn-soft', type: 'button', onClick: addCustom }, icon('plus'), 'Criar')),
      customErr,
      h('div', { style: { marginTop: '12px' } }, counter));
  };
})(window);
