function itemRanking(candidato, posicao, a, lider) {
  const segmentos = candidato.contribuicoes
    .map(
      (valor, k) => `
        <span style="width:${(valor / lider.pontuacao) * 100}%;background:${corDoCriterio(k)}"
              title="${esc(a.criterios[k].nome)}: ${pct(valor * 100)}"></span>`
    )
    .join('');

  return `
    <li class="rank-item">
      <span class="rank-pos">${posicao + 1}</span>
      <div>
        <b>${esc(candidato.nome)}</b>
        <div class="stack" role="img" aria-label="${esc(candidato.nome)}: ${pct(candidato.pontuacao * 100)}">${segmentos}</div>
      </div>
      <b class="rank-score">${pct(candidato.pontuacao * 100)}</b>
    </li>`;
}

function tabelaPrioridades(a, resultado) {
  const cabecalho = a.criterios.map((c) => `<th class="num">${esc(c.nome)}</th>`).join('');

  const linhas = resultado.ranking
    .map((candidato, posicao) => {
      const indice = a.candidatos.findIndex((c) => c.id === candidato.id);
      const celulas = resultado.porCriterio.map((p) => `<td class="num">${f3(p.pesos[indice])}</td>`).join('');

      return `
        <tr class="${posicao ? '' : 'top'}">
          <td>${esc(candidato.nome)}</td>${celulas}<td class="num">${f3(candidato.pontuacao)}</td>
        </tr>`;
    })
    .join('');

  const pesosCriterios = resultado.criterios.pesos.map((peso) => `<td class="num">${f3(peso)}</td>`).join('');

  return `
    <div class="rolagem">
      <table class="tabela">
        <thead><tr><th>Candidato</th>${cabecalho}<th class="num">Total</th></tr></thead>
        <tbody>${linhas}</tbody>
        <tfoot><tr><td>Peso do critério</td>${pesosCriterios}<td class="num">1,000</td></tr></tfoot>
      </table>
    </div>`;
}

function tabelaConsistencia(a, resultado) {
  const matrizes = [
    { titulo: 'Critérios', pesos: resultado.criterios },
    ...a.criterios.map((criterio, k) => ({ titulo: `Candidatos · ${criterio.nome}`, pesos: resultado.porCriterio[k] })),
  ];

  const situacao = (p) =>
    p.aplicavel ? '<span class="chip ok">Aceitável</span>' : '<span class="chip">n/a (2 itens)</span>';
  const valor = (p, numero) => (p.aplicavel ? f3(numero) : '—');

  const linhas = matrizes
    .map(
      ({ titulo, pesos }) => `
        <tr>
          <td>${esc(titulo)}</td>
          <td class="num">${valor(pesos, pesos.lambda)}</td>
          <td class="num">${valor(pesos, pesos.ci)}</td>
          <td class="num">${valor(pesos, pesos.cr)}</td>
          <td>${situacao(pesos)}</td>
        </tr>`
    )
    .join('');

  return `
    <div class="rolagem">
      <table class="tabela">
        <thead>
          <tr><th>Matriz</th><th class="num">λ máx</th><th class="num">CI</th><th class="num">CR</th><th>Situação</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

function telaResultado(a) {
  const resultado = Calc.analisar(a);
  const [lider] = resultado.ranking;
  const empatados = resultado.ranking.filter((c) => Math.abs(c.pontuacao - lider.pontuacao) < 1e-9);

  const legenda = a.criterios
    .map((criterio, k) => {
      const peso = Math.round(resultado.criterios.pesos[k] * 100);
      return `<span><i class="dot" style="background:${corDoCriterio(k)}"></i>${esc(criterio.nome)} (${peso}%)</span>`;
    })
    .join('');

  return `
    <div class="nota ok"><span>Todos os julgamentos estão consistentes (CR ≤ 0,10).</span></div>

    <div class="campeao">
      <svg class="ico"><use href="#i-award"/></svg>
      <div>
        <small>${empatados.length > 1 ? 'Empate técnico entre os primeiros' : 'Monitor recomendado'}</small>
        <b>${empatados.map((c) => esc(c.nome)).join(' · ')}</b>
        <small>${pct(lider.pontuacao * 100)} de prioridade global</small>
      </div>
    </div>

    <ol class="rank">${resultado.ranking.map((c, i) => itemRanking(c, i, a, lider)).join('')}</ol>
    <div class="legenda">${legenda}</div>

    <h4 class="card-t sub-titulo">Prioridades por critério</h4>
    ${tabelaPrioridades(a, resultado)}

    <h4 class="card-t sub-titulo">Consistência dos julgamentos</h4>
    ${tabelaConsistencia(a, resultado)}

    <div class="acoes no-print">
      <button class="btn soft" data-act="json"><svg class="ico"><use href="#i-download"/></svg>Exportar JSON</button>
      <button class="btn soft" data-act="print"><svg class="ico"><use href="#i-printer"/></svg>Imprimir</button>
      <button class="btn ghost" data-act="nova"><svg class="ico"><use href="#i-trash"/></svg>Nova seleção</button>
    </div>
    <small class="dica">Pontuação = soma, ponderada pelo peso de cada critério, do desempenho relativo do candidato.</small>`;
}
