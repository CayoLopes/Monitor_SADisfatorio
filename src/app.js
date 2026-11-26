/**
 * Orquestrador: stepper, navegação, rodapé e troca de telas.
 * As telas (src/views/*) só renderizam e dizem ao app, via ctx.nav, se
 * podem avançar — o app é o único dono da navegação.
 */
(function (global) {
  const App = (global.App = global.App || {});
  const { h, icon, store, clear } = App;

  const STEPS = [
    { id: 'candidates', label: 'Candidatos' },
    { id: 'criteria', label: 'Critérios' },
    { id: 'weights', label: 'Importância' },
    { id: 'compare', label: 'Comparação' },
    { id: 'result', label: 'Resultado' },
  ];
  const VIEW_KEYS = ['candidates', 'criteria', 'weights', 'compare', 'result'];

  const els = {
    stepper: document.getElementById('stepper'),
    main: document.getElementById('view'),
    navBack: document.getElementById('navBack'),
    navNext: document.getElementById('navNext'),
    navHint: document.getElementById('navHint'),
    restart: document.getElementById('btnRestart'),
  };

  let nav = {};

  const ctx = {
    nav: {
      set(patch) { Object.assign(nav, patch); paintNav(); },
    },
    go(step) {
      store.update((s) => { s.step = step; s.reached = Math.max(s.reached, step); });
      render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    rerender() { render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    async restart() {
      const ok = await App.components.confirm('Todos os candidatos, critérios e comparações serão apagados.', { okLabel: 'Apagar e recomeçar', danger: true });
      if (ok) { store.reset(); render(); window.scrollTo({ top: 0 }); }
    },
  };

  function paintStepper() {
    const { step, reached } = store.state;
    clear(els.stepper);
    els.stepper.append(
      h('ol', null, STEPS.map((st, i) => h('li', { class: 'step' + (i === step ? ' current' : i < step ? ' done' : '') },
        h('button', { type: 'button', disabled: i > reached || i === step, 'aria-current': i === step ? 'step' : null,
          onClick: () => ctx.go(i) },
          h('span', { class: 'dot' }, i < step ? icon('check') : i + 1),
          h('span', { class: 'label' }, st.label))))),
      h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': STEPS.length, 'aria-valuenow': step + 1 },
        h('span', { style: { width: ((step + 1) / STEPS.length) * 100 + '%' } })));
  }

  function paintNav() {
    const { step } = store.state;
    els.navBack.hidden = false;
    els.navBack.disabled = step === 0 && !nav.onBack;
    els.navBack.replaceChildren(icon('left'), nav.backLabel || 'Voltar');
    els.navNext.hidden = !!nav.hideNext;
    els.navNext.disabled = !nav.canNext;
    els.navNext.replaceChildren(nav.nextLabel || 'Continuar', icon('right'));
    els.navHint.textContent = nav.hint || '';
  }

  function render() {
    const { step } = store.state;
    nav = { canNext: false, onNext: () => ctx.go(step + 1), onBack: step > 0 ? () => ctx.go(step - 1) : null };
    // guarda de segurança: dados incompletos → volta à etapa válida mais próxima
    const s = store.state;
    let safe = step;
    if (safe >= 1 && s.candidates.some((c) => !c.name.trim())) safe = 0;
    else if (safe >= 2 && s.criteria.length < App.LIMITS.minCriteria) safe = 1;
    if (safe !== step) { store.update({ step: safe }); return render(); }

    clear(els.main);
    paintStepper();
    els.main.appendChild(App.views[VIEW_KEYS[step]](ctx));
    paintNav();
    els.main.focus({ preventScroll: true });
  }

  els.navNext.addEventListener('click', () => nav.onNext && nav.canNext && nav.onNext());
  els.navBack.addEventListener('click', () => nav.onBack && nav.onBack());
  els.restart.addEventListener('click', () => ctx.restart());

  render();
})(window);
