const STORAGE_KEY = 'sadisfatorio.v2';
const SALVAR_APOS_MS = 250;

function estadoInicial() {
  return {
    ahp: {
      passo: 0,
      candidatos: [1, 2, 3].map(() => ({ id: uid(), nome: '' })),
      criterios: [],
      comparacoesCriterios: {},
      comparacoesCandidatos: {},
    },
  };
}

function carregarEstado() {
  try {
    const inicial = estadoInicial();
    const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    return { ...inicial, ...salvo, ahp: { ...inicial.ahp, ...salvo.ahp } };
  } catch (erro) {
    return estadoInicial();
  }
}

let state = carregarEstado();
let timerSalvar;

function gravarEstado() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (erro) {
    return;
  }
}

function save() {
  clearTimeout(timerSalvar);
  timerSalvar = setTimeout(gravarEstado, SALVAR_APOS_MS);
}

window.addEventListener('pagehide', gravarEstado);
