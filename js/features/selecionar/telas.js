// Telas do assistente. Cada função devolve HTML; todo texto digitado passa por esc().

const ICONE_X = '<svg class="ico"><use href="#i-x"/></svg>';
const FORCA = ['um pouco', 'um pouco', 'bem', 'bem', 'muito', 'muito', 'extremamente', 'extremamente'];

// "Ana é bem melhor (4×)"
function texto(x, A, B, verbo) {
  if (x === 0) return 'Os dois são iguais';
  return `${x < 0 ? A : B} é ${FORCA[Math.abs(x) - 1]} ${verbo} (${Math.abs(x) + 1}×)`;
}

// Variáveis CSS que pintam o trecho preenchido da barrinha
function barra(x) {
  const posicao = 50 + (x * 50) / 8;
  return `--a:${Math.min(50, posicao)}%;--b:${Math.max(50, posicao)}%`;
}

// Números da escala de Saaty sob a barrinha: 9 8 7 ... 2 1 2 ... 8 9 (17 posições, de -8 a +8)
function marcasEscala(x) {
  let html = '';
  for (let v = -8; v <= 8; v++) {
    html += `<span class="${v === x ? 'on' : ''}" style="--i:${v + 8}">${Math.abs(v) + 1}</span>`;
  }
  return html;
}

// Barra de etapas no topo + progresso. Etapas além da primeira matriz inconsistente ficam bloqueadas.
function desenharPassos(a, et) {
  const caixa = document.getElementById('passos');
  if (!caixa) return;

  const max = passoMax(a, et);

  caixa.innerHTML = et
    .map((s, i) => {
      const total = totalPares(s);
      const completo = total > 0 && feitos(s) === total;
      const ruim = s.ids && s.ids.length > 2 && !consistente(s);
      const bloqueado = i > max;

      return `
        <button class="passo ${i === a.passo ? 'on' : ''} ${completo ? 'ok' : ''} ${ruim ? 'ruim' : ''}"
                data-go="${i}"
                ${bloqueado ? 'disabled title="Conclua os passos anteriores com consistência"' : ''}>
          <span class="pn">${ruim ? '!' : completo ? '✓' : i + 1}</span>${esc(s.t)}
        </button>`;
    })
    .join('');

  const comparacoes = et.slice(1, -1);
  const total = comparacoes.reduce((soma, e) => soma + totalPares(e), 0);
  const feitas = comparacoes.reduce((soma, e) => soma + feitos(e), 0);

  document.getElementById('prog-txt').textContent = `${feitas} de ${total} comparações feitas`;
  document.getElementById('prog-fill').style.width = (total ? (feitas / total) * 100 : 0) + '%';
}

/* ---------- Etapa 0: montar candidatos e critérios ---------- */

function linhaCandidato(c, i, a) {
  return `
    <div class="linha-item">
      <input data-f="cnome" data-p="${c.id}" value="${esc(c.nome)}" maxlength="60" autocomplete="off"
             placeholder="Nome do candidato ${i + 1}" aria-label="Nome do candidato ${i + 1}">
      <button class="ib perigo" data-act="rm-cand" data-p="${c.id}" aria-label="Remover candidato ${i + 1}"
              ${a.candidatos.length <= LIMITES.minCand ? 'disabled' : ''}>${ICONE_X}</button>
    </div>`;
}

function opcaoCriterio(c, a) {
  const marcado = a.criterios.some((x) => x.id === c.id);
  const travado = !marcado && a.criterios.length >= LIMITES.maxCrit;

  return `
    <label class="opcao ${marcado ? 'on' : ''} ${travado ? 'lock' : ''}">
      <input type="checkbox" data-act="tog-crit" data-c="${c.id}" ${marcado ? 'checked' : ''} ${travado ? 'disabled' : ''}>
      <span><b>${esc(c.nome)}</b><small>${esc(c.desc)}</small></span>
    </label>`;
}

function criterioProprio(c) {
  return `
    <div class="opcao on custom">
      <span><b>${esc(c.nome)}</b><small>Criado por você</small></span>
      <button class="ib perigo" data-act="rm-crit" data-c="${c.id}" aria-label="Remover critério ${esc(c.nome)}">${ICONE_X}</button>
    </div>`;
}

function telaSetup(a, erros) {
  const { minCand, maxCand, minCrit, maxCrit } = LIMITES;

  return `
    <div class="intro">
      <div><b>1</b>Liste os candidatos</div>
      <div><b>2</b>Escolha os critérios</div>
      <div><b>3</b>Compare dois a dois</div>
    </div>

    <div class="setup-grid">
      <section class="card">
        <div class="card-cab">
          <h3 class="card-t">Candidatos</h3>
          <span class="chip ${a.candidatos.length >= minCand ? 'ok' : ''}">${a.candidatos.length}/${maxCand}</span>
        </div>
        ${a.candidatos.map((c, i) => linhaCandidato(c, i, a)).join('')}
        <button class="btn ghost sm" data-act="add-cand" ${a.candidatos.length >= maxCand ? 'disabled' : ''}>
          <svg class="ico"><use href="#i-plus"/></svg>Adicionar candidato
        </button>
      </section>

      <section class="card">
        <div class="card-cab">
          <h3 class="card-t">Critérios</h3>
          <span class="chip ${a.criterios.length >= minCrit ? 'ok' : ''}">${a.criterios.length}/${maxCrit}</span>
        </div>
        <small class="dica">Escolha de ${minCrit} a ${maxCrit} critérios para avaliar os candidatos. Você também pode criar o seu.</small>
        <div class="opcoes">
          ${CRITERIOS_SUGERIDOS.map((c) => opcaoCriterio(c, a)).join('')}
          ${a.criterios.filter((c) => c.custom).map(criterioProprio).join('')}
        </div>
        <div class="novo-crit">
          <input id="novo-crit" maxlength="50" placeholder="Ex.: Pontualidade" aria-label="Novo critério">
          <button class="btn soft sm" data-act="add-crit"><svg class="ico"><use href="#i-plus"/></svg>Criar</button>
        </div>
      </section>
    </div>

    ${erros.length ? `<div class="nota erro" style="margin-top:.9rem">${erros.map(esc).join('<br>')}</div>` : ''}`;
}

/* ---------- Etapas de comparação (critérios e candidatos) ---------- */

function explicacaoConsistencia(a) {
  const [c1, c2, c3] = a.criterios.map((c) => esc(c.nome));

  return `
    <details class="sec">
      <summary><span>Por que verificamos a consistência?</span></summary>
      <div class="sec-corpo">
        <p>
          Ao comparar itens dois a dois é natural surgirem contradições. Por exemplo: se <b>${c1}</b> é mais
          importante que <b>${c2}</b> e <b>${c2}</b> é mais importante que <b>${c3}</b>, espera-se que
          <b>${c1}</b> também seja mais importante que <b>${c3}</b>.
        </p>
        <p>
          O AHP mede isso pela <b>Razão de Consistência (CR)</b>. Até <b>0,10</b> é aceitável. Acima disso o app
          destaca qual comparação revisar, e só libera o próximo passo quando a matriz atual (e as anteriores)
          estiverem consistentes.
        </p>
      </div>
    </details>`;
}

function duelo(par, e, nome, verbo) {
  const [A, B] = par;
  const chave = A + '|' + B;
  const feito = chave in e.J;
  const x = +e.J[chave] || 0;
  const igual = feito && x === 0;

  return `
    <div class="duelo ${feito ? 'feito' : ''}" data-k="${chave}">
      <div class="lados">
        <button class="lado ${x < 0 ? 'sel' : ''} ${igual ? 'eq' : ''}" data-lado="-3">${esc(nome(A))}</button>
        <span class="vs">VS</span>
        <button class="lado ${x > 0 ? 'sel' : ''} ${igual ? 'eq' : ''}" data-lado="3">${esc(nome(B))}</button>
      </div>

      <input type="range" class="pair-range" min="-8" max="8" step="1" value="${x}" style="${barra(x)}"
             data-par="${chave}" aria-label="${esc(nome(A))} contra ${esc(nome(B))}">
      <div class="marcas" aria-hidden="true">${marcasEscala(x)}</div>

      <div class="escala">
        <span>← ${esc(nome(A))} ganha</span>
        <button class="igual" data-lado="0">Igual</button>
        <span>${esc(nome(B))} ganha →</span>
      </div>

      <div class="duelo-res">${feito ? esc(texto(x, nome(A), nome(B), verbo)) : 'Escolha um lado para comparar'}</div>
      <div class="par-flag"></div>
    </div>`;
}

function telaComparar(a, e) {
  const nome = nm(a);
  const crit = e.crit; // undefined na etapa que compara os critérios entre si
  const verbo = crit ? 'melhor' : 'mais importante';

  const titulo = crit ? esc(crit.nome) : 'O que pesa mais na escolha do monitor?';
  const instrucao = crit
    ? `${crit.desc ? esc(crit.desc) + ' ' : ''}Quem é melhor em “${esc(crit.nome)}”? Toque em um lado ou deslize a barra.`
    : 'Toque no critério mais importante de cada par ou deslize a barra.';

  return `
    <div class="cab-passo">
      <span class="tag">${crit ? 'Critério' : 'Critérios'}</span>
      <h3>${titulo}</h3>
      <p>${instrucao}</p>
      <small class="dica">Os números da barra dizem quantas vezes um é preferido ao outro: 1 = iguais, 9 = extremamente mais.</small>
    </div>

    ${crit ? '' : explicacaoConsistencia(a)}
    <div id="cr-badge"></div>

    ${pares(e.ids)
      .map((par) => duelo(par, e, nome, verbo))
      .join('')}`;
}

// Atualiza a razão de consistência, destaca os julgamentos que destoam e libera/bloqueia o "Próximo"
// (sem recriar a tela, para não perder o foco do usuário)
function diagnosticar(a, e) {
  const d = Calc.ahpDiag(e.ids, e.J);
  const nome = nm(a);
  const badge = document.getElementById('cr-badge');
  const proximo = document.querySelector('[data-act="avancar"]');

  const inconsistente = !d.consistente;
  const suspeitos = inconsistente ? d.pares.filter((p) => p.dev >= Math.log(1.8)).slice(0, 3) : [];

  if (proximo) proximo.disabled = inconsistente;

  if (badge) {
    badge.innerHTML =
      e.ids.length < 3
        ? ''
        : `
          <div class="nota ${inconsistente ? 'aviso' : 'ok'}">
            <span>
              <b>Consistência (CR): ${f2(d.cr)}</b> —
              ${inconsistente ? 'ajuste os julgamentos destacados para poder continuar.' : 'boa, pode seguir.'}
            </span>
          </div>`;
  }

  document.querySelectorAll('.duelo').forEach((el) => {
    const [A, B] = el.dataset.k.split('|');
    const p = suspeitos.find((s) => s.a === A && s.b === B);

    el.classList.toggle('suspeito', !!p);
    el.querySelector('.par-flag').innerHTML = p
      ? `
        <span>
          Destoa dos seus outros julgamentos: eles indicam que <b>${esc(nome(A))}</b> é
          ${p.esp >= 1 ? 'melhor' : 'pior'} que <b>${esc(nome(B))}</b> (cerca de ${f1(p.esp >= 1 ? p.esp : 1 / p.esp)}×).
        </span>
        <button class="btn soft sm" data-act="sug" data-k="${el.dataset.k}" data-v="${p.sug}">Usar valor sugerido</button>`
      : '';
  });
}

/* ---------- Resultado ---------- */

const corDoCriterio = (k) => `var(--s${(k % 6) + 1})`;

function itemRanking(x, i, a, topo) {
  const segmentos = x.contrib
    .map(
      (v, k) => `<span style="width:${(v / topo.score) * 100}%;background:${corDoCriterio(k)}"
                       title="${esc(a.criterios[k].nome)}: ${pct(v * 100)}"></span>`
    )
    .join('');

  return `
    <li class="rank-item">
      <span class="rank-pos">${i + 1}</span>
      <div>
        <b>${esc(x.nome)}</b>
        <div class="stack" role="img" aria-label="${esc(x.nome)}: ${pct(x.score * 100)}">${segmentos}</div>
      </div>
      <b class="rank-score">${pct(x.score * 100)}</b>
    </li>`;
}

function tabelaPrioridades(a, r) {
  const cabecalho = a.criterios.map((c) => `<th class="num">${esc(c.nome)}</th>`).join('');

  const linhas = r.ranking
    .map((x, i) => {
      const indice = a.candidatos.findIndex((p) => p.id === x.id);
      const celulas = a.criterios.map((_, k) => `<td class="num">${f3(r.locais[k].w[indice])}</td>`).join('');
      return `<tr class="${i ? '' : 'top'}"><td>${esc(x.nome)}</td>${celulas}<td class="num">${f3(x.score)}</td></tr>`;
    })
    .join('');

  const pesos = r.crit.w.map((w) => `<td class="num">${f3(w)}</td>`).join('');

  return `
    <div class="rolagem">
      <table class="tabela">
        <thead><tr><th>Candidato</th>${cabecalho}<th class="num">Total</th></tr></thead>
        <tbody>${linhas}</tbody>
        <tfoot><tr><td>Peso do critério</td>${pesos}<td class="num">1,000</td></tr></tfoot>
      </table>
    </div>`;
}

function tabelaConsistencia(a, r) {
  const matrizes = [
    { titulo: 'Critérios', d: r.crit },
    ...a.criterios.map((c, k) => ({ titulo: `Candidatos · ${c.nome}`, d: r.locais[k] })),
  ];

  const situacao = (d) => (d.aplicavel ? '<span class="chip ok">Aceitável</span>' : '<span class="chip">n/a (2 itens)</span>');
  const valor = (d, v) => (d.aplicavel ? f3(v) : '—');

  const linhas = matrizes
    .map(
      ({ titulo, d }) => `
        <tr>
          <td>${esc(titulo)}</td>
          <td class="num">${valor(d, d.lam)}</td>
          <td class="num">${valor(d, d.ci)}</td>
          <td class="num">${valor(d, d.cr)}</td>
          <td>${situacao(d)}</td>
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
  const r = Calc.analisar(a);
  const topo = r.ranking[0];
  const empatados = r.ranking.filter((x) => Math.abs(x.score - topo.score) < 1e-9);

  const legenda = a.criterios
    .map(
      (c, k) => `<span><i class="dot" style="background:${corDoCriterio(k)}"></i>${esc(c.nome)} (${Math.round(r.crit.w[k] * 100)}%)</span>`
    )
    .join('');

  return `
    <div class="nota ok"><span>Todos os julgamentos estão consistentes (CR ≤ 0,10).</span></div>

    <div class="campeao">
      <svg class="ico"><use href="#i-award"/></svg>
      <div>
        <small>${empatados.length > 1 ? 'Empate técnico entre os primeiros' : 'Monitor recomendado'}</small>
        <b>${empatados.map((x) => esc(x.nome)).join(' · ')}</b>
        <small>${pct(topo.score * 100)} de prioridade global</small>
      </div>
    </div>

    <ol class="rank">${r.ranking.map((x, i) => itemRanking(x, i, a, topo)).join('')}</ol>
    <div class="legenda">${legenda}</div>

    <h4 class="card-t sub-titulo">Prioridades por critério</h4>
    ${tabelaPrioridades(a, r)}

    <h4 class="card-t sub-titulo">Consistência dos julgamentos</h4>
    ${tabelaConsistencia(a, r)}

    <div class="acoes no-print">
      <button class="btn soft" data-act="json"><svg class="ico"><use href="#i-download"/></svg>Exportar JSON</button>
      <button class="btn soft" data-act="print"><svg class="ico"><use href="#i-printer"/></svg>Imprimir</button>
      <button class="btn ghost" data-act="nova"><svg class="ico"><use href="#i-trash"/></svg>Nova seleção</button>
    </div>
    <small class="dica">Pontuação = soma, ponderada pelo peso de cada critério, do desempenho relativo do candidato.</small>`;
}
