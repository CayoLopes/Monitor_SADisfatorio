const raiz = () => document.getElementById('sel-app');
let errosMontar = [];

function renderSelecionar() {
  garantirEstado();

  const a = state.ahp;
  const etapas = montarEtapas(a);
  const ultimo = etapas.length - 1;

  a.passo = Math.max(0, Math.min(a.passo, passoMaximo(a, etapas)));
  const { passo } = a;
  const etapa = etapas[passo];

  let corpo;
  if (passo === 0) corpo = telaMontar(a, errosMontar);
  else if (passo === ultimo) corpo = telaResultado(a);
  else corpo = telaComparar(a, etapa);

  raiz().innerHTML = `
    <div class="passos" id="passos" role="tablist"></div>

    <div class="prog" ${passo === 0 ? 'hidden' : ''}>
      <div class="prog-bar"><i id="prog-fill"></i></div>
      <span id="prog-txt"></span>
    </div>

    ${corpo}

    <div class="nav-passos">
      ${passo > 0 ? '<button class="btn ghost" data-act="voltar">← Voltar</button>' : '<span></span>'}
      ${
        passo < ultimo
          ? `<button class="btn" data-act="avancar">${passo === ultimo - 1 ? 'Ver resultado' : 'Próximo →'}</button>`
          : '<span></span>'
      }
    </div>`;

  desenharPassos(a, etapas);
  if (passo > 0 && passo < ultimo) diagnosticarEtapa(a, etapa);
}

function atualizarJulgamento(cartao, posicao) {
  const a = state.ahp;
  const etapas = montarEtapas(a);
  const etapa = etapas[a.passo];
  const [idA, idB] = cartao.dataset.k.split('|');
  const nomeDeItem = nomeDe(a);

  etapa.comparacoes[cartao.dataset.k] = posicao;

  const barra = cartao.querySelector('.pair-range');
  barra.value = posicao;
  barra.setAttribute('style', estiloBarra(posicao));

  const [ladoA, ladoB] = cartao.querySelectorAll('.lado');
  ladoA.classList.toggle('sel', posicao < 0);
  ladoB.classList.toggle('sel', posicao > 0);
  ladoA.classList.toggle('eq', posicao === 0);
  ladoB.classList.toggle('eq', posicao === 0);

  cartao.classList.add('feito');
  cartao
    .querySelectorAll('.marcas span')
    .forEach((marca, i) => marca.classList.toggle('on', i - Calc.POSICAO_MAX === posicao));
  cartao.querySelector('.duelo-res').textContent = descreverEscolha(
    posicao,
    nomeDeItem(idA),
    nomeDeItem(idB),
    etapa.criterio ? 'melhor' : 'mais importante'
  );

  diagnosticarEtapa(a, etapa);
  desenharPassos(a, etapas);
  save();
}

function marcarDuplicados() {
  const ocorrencias = {};

  state.ahp.candidatos.forEach((candidato) => {
    const nome = normalizarNome(candidato.nome);
    if (nome) ocorrencias[nome] = (ocorrencias[nome] || 0) + 1;
  });

  raiz()
    .querySelectorAll('[data-f="cnome"]')
    .forEach((campo) => {
      const nome = normalizarNome(campo.value);
      campo.classList.toggle('invalido', Boolean(nome) && ocorrencias[nome] > 1);
    });
}

function exportarJson() {
  const a = state.ahp;
  const resultado = Calc.analisar(a);

  const dados = {
    geradoEm: new Date().toISOString(),
    candidatos: a.candidatos.map((c) => c.nome),
    criterios: a.criterios.map((criterio, i) => ({ nome: criterio.nome, peso: resultado.criterios.pesos[i] })),
    consistenciaCriterios: resultado.criterios.cr,
    ranking: resultado.ranking.map((c) => ({ candidato: c.nome, pontuacao: c.pontuacao })),
    consistenciaCandidatos: a.criterios.map((criterio, i) => ({
      criterio: criterio.nome,
      cr: resultado.porCriterio[i].cr,
      aceitavel: resultado.porCriterio[i].consistente,
    })),
  };

  download('resultado-ahp.json', JSON.stringify(dados, null, 2), 'application/json');
}
