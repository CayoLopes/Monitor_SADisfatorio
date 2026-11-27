const STORAGE_KEY = 'sadisfatorio.v1';

// ahp.jc / ahp.jp guardam a posição da barrinha de cada par ('idA|idB' -> -8..8).
// Os ids são opacos, então nomes repetidos nunca colidem.
function estadoInicial() {
  return {
    ahp: {
      passo: 0,
      candidatos: [1, 2, 3].map(() => ({ id: uid(), nome: '' })),
      criterios: [],
      jc: {},
      jp: {},
    },
  };
}

let state;
try {
  const inicial = estadoInicial();
  const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  state = { ...inicial, ...salvo, ahp: { ...inicial.ahp, ...salvo.ahp } };
} catch (e) {
  state = estadoInicial();
}

let _t;
function save() {
  clearTimeout(_t);
  _t = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* armazenamento indisponível: segue sem salvar */
    }
  }, 250);
}
