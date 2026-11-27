const ICONE_X = '<svg class="ico"><use href="#i-x"/></svg>';
const FORCA = ['um pouco', 'um pouco', 'bem', 'bem', 'muito', 'muito', 'extremamente', 'extremamente'];

function descreverEscolha(posicao, nomeA, nomeB, verbo) {
  if (posicao === 0) return 'Os dois são iguais';

  const preferido = posicao < 0 ? nomeA : nomeB;
  const intensidade = Math.abs(posicao);
  return `${preferido} é ${FORCA[intensidade - 1]} ${verbo} (${intensidade + 1}×)`;
}

function estiloBarra(posicao) {
  const centro = 50 + (posicao * 50) / Calc.POSICAO_MAX;
  return `--a:${Math.min(50, centro)}%;--b:${Math.max(50, centro)}%`;
}

function marcasEscala(posicaoAtual) {
  let html = '';
  for (let posicao = -Calc.POSICAO_MAX; posicao <= Calc.POSICAO_MAX; posicao++) {
    const ativa = posicao === posicaoAtual ? 'on' : '';
    html += `<span class="${ativa}" style="--i:${posicao + Calc.POSICAO_MAX}">${Math.abs(posicao) + 1}</span>`;
  }
  return html;
}

const corDoCriterio = (indice) => `var(--s${(indice % 6) + 1})`;
