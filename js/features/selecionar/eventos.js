const textoLimpo = (texto) => texto.trim().replace(/\s+/g, ' ');

// Cada ação recebe o estado do módulo e o botão clicado; devolver `false` cancela o redesenho.
const ACOES = {
  'add-cand'(s) {
    if (s.candidatos.length < LIMITES.maxCandidatos) s.candidatos.push({ id: uid(), nome: '' });
  },

  'rm-cand'(s, botao) {
    s.candidatos = s.candidatos.filter((c) => c.id !== botao.dataset.p);
    podar(s);
  },

  'tog-crit'(s, botao) {
    const id = botao.dataset.c;

    if (s.criterios.some((c) => c.id === id)) {
      s.criterios = s.criterios.filter((c) => c.id !== id);
    } else if (s.criterios.length < LIMITES.maxCriterios) {
      s.criterios.push({ ...CRITERIOS_SUGERIDOS.find((c) => c.id === id) });
    }
    podar(s);
  },

  'rm-crit'(s, botao) {
    s.criterios = s.criterios.filter((c) => c.id !== botao.dataset.c);
    podar(s);
  },

  'add-crit'(s) {
    const campo = document.getElementById('novo-crit');
    const nome = textoLimpo(campo.value);
    const existentes = [...CRITERIOS_SUGERIDOS, ...s.criterios.filter((c) => c.custom)];

    if (!nome) {
      campo.focus();
      return false;
    }
    if (existentes.some((c) => normalizarNome(c.nome) === normalizarNome(nome))) {
      toast('Esse critério já existe');
      return false;
    }
    if (s.criterios.length >= LIMITES.maxCriterios) {
      toast(`Máximo de ${LIMITES.maxCriterios} critérios`);
      return false;
    }
    s.criterios.push({ id: uid(), nome, custom: true });
  },

  voltar(s) {
    s.passo--;
  },

  avancar(s) {
    if (s.passo === 0) {
      s.candidatos.forEach((c) => {
        c.nome = textoLimpo(c.nome);
      });
      errosMontar = validar(s);
      if (errosMontar.length) return;
      podar(s);
    }
    s.passo++;
  },

  sug(s, botao) {
    montarEtapas(s)[s.passo].comparacoes[botao.dataset.k] = Number(botao.dataset.v);
  },

  json() {
    exportarJson();
    return false;
  },

  print() {
    window.print();
    return false;
  },

  nova() {
    document.querySelector('[data-limpar]').click();
    return false;
  },
};

function focarUltimoCandidato() {
  const campos = raiz().querySelectorAll('[data-f="cnome"]');
  campos[campos.length - 1]?.focus();
}

function aoDigitar(evento) {
  const alvo = evento.target;

  if (alvo.dataset.par) {
    atualizarJulgamento(alvo.closest('.duelo'), Number(alvo.value));
  } else if (alvo.dataset.f === 'cnome') {
    state.ahp.candidatos.find((c) => c.id === alvo.dataset.p).nome = alvo.value;
    marcarDuplicados();
    save();
  }
}

function aoPressionarEnter(evento) {
  if (evento.key !== 'Enter') return;

  const alvo = evento.target;
  const r = raiz();

  if (alvo.id === 'novo-crit') {
    evento.preventDefault();
    r.querySelector('[data-act="add-crit"]').click();
  } else if (alvo.dataset.f === 'cnome') {
    evento.preventDefault();
    const campos = [...r.querySelectorAll('[data-f="cnome"]')];
    const proximo = campos[campos.indexOf(alvo) + 1];

    if (proximo) proximo.focus();
    else r.querySelector('[data-act="add-cand"]:not([disabled])')?.click();
  }
}

function aoClicar(evento) {
  const lado = evento.target.closest('[data-lado]');
  if (lado) return atualizarJulgamento(lado.closest('.duelo'), Number(lado.dataset.lado));

  const botao = evento.target.closest('[data-act],[data-go]');
  if (!botao || botao.disabled) return;

  const s = state.ahp;
  const passoAntes = s.passo;
  errosMontar = [];

  if (botao.dataset.go !== undefined) {
    s.passo = Number(botao.dataset.go);
  } else if (ACOES[botao.dataset.act](s, botao) === false) {
    return;
  }

  save();
  renderSelecionar();

  if (botao.dataset.act === 'add-cand') focarUltimoCandidato();
  if (s.passo !== passoAntes) window.scrollTo({ top: 0, behavior: 'smooth' });
}

function ligarEventos() {
  const r = raiz();
  r.addEventListener('input', aoDigitar);
  r.addEventListener('keydown', aoPressionarEnter);
  r.addEventListener('click', aoClicar);
}

ligarEventos();
