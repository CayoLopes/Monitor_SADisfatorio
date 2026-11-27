const DESVIO_MINIMO_SUSPEITO = Math.log(1.8);
const MAX_SUSPEITOS = 3;

function explicacaoConsistencia(a) {
  const [primeiro, segundo, terceiro] = a.criterios.map((c) => esc(c.nome));

  return `
    <details class="sec">
      <summary><span>Por que verificamos a consistência?</span></summary>
      <div class="sec-corpo">
        <p>
          Ao comparar itens dois a dois é natural surgirem contradições. Por exemplo: se <b>${primeiro}</b> é mais
          importante que <b>${segundo}</b> e <b>${segundo}</b> é mais importante que <b>${terceiro}</b>, espera-se que
          <b>${primeiro}</b> também seja mais importante que <b>${terceiro}</b>.
        </p>
        <p>
          O AHP mede isso pela <b>Razão de Consistência (CR)</b>. Até <b>0,10</b> é aceitável. Acima disso o app
          destaca qual comparação revisar, e só libera o próximo passo quando a matriz atual (e as anteriores)
          estiverem consistentes.
        </p>
      </div>
    </details>`;
}

function duelo([idA, idB], etapa, nomeDe, verbo) {
  const chave = `${idA}|${idB}`;
  const respondido = chave in etapa.comparacoes;
  const posicao = Number(etapa.comparacoes[chave]) || 0;
  const empate = respondido && posicao === 0;
  const nomeA = nomeDe(idA);
  const nomeB = nomeDe(idB);

  return `
    <div class="duelo ${respondido ? 'feito' : ''}" data-k="${chave}">
      <div class="lados">
        <button class="lado ${posicao < 0 ? 'sel' : ''} ${empate ? 'eq' : ''}" data-lado="-3">${esc(nomeA)}</button>
        <span class="vs">VS</span>
        <button class="lado ${posicao > 0 ? 'sel' : ''} ${empate ? 'eq' : ''}" data-lado="3">${esc(nomeB)}</button>
      </div>

      <input type="range" class="pair-range" min="-8" max="8" step="1" value="${posicao}" style="${estiloBarra(posicao)}"
             data-par="${chave}" aria-label="${esc(nomeA)} contra ${esc(nomeB)}">
      <div class="marcas" aria-hidden="true">${marcasEscala(posicao)}</div>

      <div class="escala">
        <span>← ${esc(nomeA)} ganha</span>
        <button class="igual" data-lado="0">Igual</button>
        <span>${esc(nomeB)} ganha →</span>
      </div>

      <div class="duelo-res">
        ${respondido ? esc(descreverEscolha(posicao, nomeA, nomeB, verbo)) : 'Escolha um lado para comparar'}
      </div>
      <div class="par-flag"></div>
    </div>`;
}

function telaComparar(a, etapa) {
  const nomeDeItem = nomeDe(a);
  const { criterio } = etapa;
  const verbo = criterio ? 'melhor' : 'mais importante';

  const titulo = criterio ? esc(criterio.nome) : 'O que pesa mais na escolha do monitor?';
  const instrucao = criterio
    ? `${criterio.desc ? esc(criterio.desc) + ' ' : ''}Quem é melhor em “${esc(criterio.nome)}”? Toque em um lado ou deslize a barra.`
    : 'Toque no critério mais importante de cada par ou deslize a barra.';

  return `
    <div class="cab-passo">
      <span class="tag">${criterio ? 'Critério' : 'Critérios'}</span>
      <h3>${titulo}</h3>
      <p>${instrucao}</p>
      <small class="dica">Os números da barra dizem quantas vezes um é preferido ao outro: 1 = iguais, 9 = extremamente mais.</small>
    </div>

    ${criterio ? '' : explicacaoConsistencia(a)}
    <div id="cr-badge"></div>

    ${paresDe(etapa.ids)
      .map((par) => duelo(par, etapa, nomeDeItem, verbo))
      .join('')}`;
}

function badgeConsistencia(diagnostico, inconsistente) {
  return `
    <div class="nota ${inconsistente ? 'aviso' : 'ok'}">
      <span>
        <b>Consistência (CR): ${f2(diagnostico.cr)}</b> —
        ${inconsistente ? 'ajuste os julgamentos destacados para poder continuar.' : 'boa, pode seguir.'}
      </span>
    </div>`;
}

function avisoDeSuspeito(par, nomeDeItem, chave) {
  const favoravelA = par.esperado >= 1;
  const vezes = favoravelA ? par.esperado : 1 / par.esperado;

  return `
    <span>
      Destoa dos seus outros julgamentos: eles indicam que <b>${esc(nomeDeItem(par.a))}</b> é
      ${favoravelA ? 'melhor' : 'pior'} que <b>${esc(nomeDeItem(par.b))}</b> (cerca de ${f1(vezes)}×).
    </span>
    <button class="btn soft sm" data-act="sug" data-k="${chave}" data-v="${par.sugestao}">Usar valor sugerido</button>`;
}

function diagnosticarEtapa(a, etapa) {
  const diagnostico = Calc.diagnosticar(etapa.ids, etapa.comparacoes);
  const nomeDeItem = nomeDe(a);
  const inconsistente = !diagnostico.consistente;
  const proximo = document.querySelector('[data-act="avancar"]');
  const badge = document.getElementById('cr-badge');

  const suspeitos = inconsistente
    ? diagnostico.pares.filter((par) => par.desvio >= DESVIO_MINIMO_SUSPEITO).slice(0, MAX_SUSPEITOS)
    : [];

  if (proximo) proximo.disabled = inconsistente;
  if (badge) badge.innerHTML = etapa.ids.length < 3 ? '' : badgeConsistencia(diagnostico, inconsistente);

  document.querySelectorAll('.duelo').forEach((cartao) => {
    const chave = cartao.dataset.k;
    const [idA, idB] = chave.split('|');
    const suspeito = suspeitos.find((par) => par.a === idA && par.b === idB);

    cartao.classList.toggle('suspeito', Boolean(suspeito));
    cartao.querySelector('.par-flag').innerHTML = suspeito ? avisoDeSuspeito(suspeito, nomeDeItem, chave) : '';
  });
}
