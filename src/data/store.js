/**
 * Estado da aplicação + persistência (localStorage).
 * Um único objeto versionado substitui as 6 chaves soltas do projeto anterior.
 * Candidatos e critérios têm ids estáveis; os julgamentos são indexados por
 * esses ids — por isso nomes repetidos, com "_" ou "::" não causam colisões.
 */
(function (global) {
  const App = (global.App = global.App || {});
  const KEY = 'ahp-monitor:v2';
  const VERSION = 2;

  const uid = () => 'i' + Math.random().toString(36).slice(2, 9);

  function defaults() {
    return {
      version: VERSION,
      step: 0, // etapa atual
      reached: 0, // maior etapa liberada
      candidates: [1, 2, 3].map(() => ({ id: uid(), name: '' })),
      criteria: [], // [{id, name, desc?, custom?}]
      criteriaJudgments: {}, // {"idA|idB": razão}
      altJudgments: {}, // {criterionId: {"idA|idB": razão}}
      altIndex: 0, // critério em comparação na etapa 4
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      const s = JSON.parse(raw);
      if (s.version !== VERSION) return defaults();
      return { ...defaults(), ...s };
    } catch (e) {
      return defaults();
    }
  }

  let state = load();
  const listeners = new Set();

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* modo privado/cheio: segue em memória */ }
  }

  App.store = {
    uid,
    get state() { return state; },
    /** Aplica mudanças (objeto ou função que muta/retorna) e persiste. */
    update(change) {
      if (typeof change === 'function') change(state);
      else Object.assign(state, change);
      persist();
      listeners.forEach((fn) => fn(state));
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    reset() {
      state = defaults();
      try { localStorage.removeItem(KEY); } catch (e) { /* ignora */ }
      listeners.forEach((fn) => fn(state));
    },
    /** Remove julgamentos de itens que não existem mais. */
    prune() {
      const ids = new Set([...state.candidates.map((c) => c.id), ...state.criteria.map((c) => c.id)]);
      const keep = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => k.split('|').every((id) => ids.has(id))));
      const critIds = new Set(state.criteria.map((c) => c.id));
      state.criteriaJudgments = keep(state.criteriaJudgments);
      state.altJudgments = Object.fromEntries(
        Object.entries(state.altJudgments).filter(([c]) => critIds.has(c)).map(([c, j]) => [c, keep(j)])
      );
      state.altIndex = Math.min(state.altIndex, Math.max(0, state.criteria.length - 1));
      persist();
    },
  };
})(window);
