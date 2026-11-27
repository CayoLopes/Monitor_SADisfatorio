function linhaCandidato(candidato, indice, a) {
  const podeRemover = a.candidatos.length > LIMITES.minCandidatos;

  return `
    <div class="linha-item">
      <input data-f="cnome" data-p="${candidato.id}" value="${esc(candidato.nome)}" maxlength="60" autocomplete="off"
             placeholder="Nome do candidato ${indice + 1}" aria-label="Nome do candidato ${indice + 1}">
      <button class="ib perigo" data-act="rm-cand" data-p="${candidato.id}"
              aria-label="Remover candidato ${indice + 1}" ${podeRemover ? '' : 'disabled'}>${ICONE_X}</button>
    </div>`;
}

function opcaoCriterio(criterio, a) {
  const marcado = a.criterios.some((c) => c.id === criterio.id);
  const travado = !marcado && a.criterios.length >= LIMITES.maxCriterios;

  return `
    <label class="opcao ${marcado ? 'on' : ''} ${travado ? 'lock' : ''}">
      <input type="checkbox" data-act="tog-crit" data-c="${criterio.id}" ${marcado ? 'checked' : ''} ${travado ? 'disabled' : ''}>
      <span><b>${esc(criterio.nome)}</b><small>${esc(criterio.desc)}</small></span>
    </label>`;
}

function criterioProprio(criterio) {
  return `
    <div class="opcao on custom">
      <span><b>${esc(criterio.nome)}</b><small>Criado por você</small></span>
      <button class="ib perigo" data-act="rm-crit" data-c="${criterio.id}"
              aria-label="Remover critério ${esc(criterio.nome)}">${ICONE_X}</button>
    </div>`;
}

function telaMontar(a, erros) {
  const { minCandidatos, maxCandidatos, minCriterios, maxCriterios } = LIMITES;
  const candidatosOk = a.candidatos.length >= minCandidatos;
  const criteriosOk = a.criterios.length >= minCriterios;

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
          <span class="chip ${candidatosOk ? 'ok' : ''}">${a.candidatos.length}/${maxCandidatos}</span>
        </div>
        ${a.candidatos.map((candidato, i) => linhaCandidato(candidato, i, a)).join('')}
        <button class="btn ghost sm" data-act="add-cand" ${a.candidatos.length >= maxCandidatos ? 'disabled' : ''}>
          <svg class="ico"><use href="#i-plus"/></svg>Adicionar candidato
        </button>
      </section>

      <section class="card">
        <div class="card-cab">
          <h3 class="card-t">Critérios</h3>
          <span class="chip ${criteriosOk ? 'ok' : ''}">${a.criterios.length}/${maxCriterios}</span>
        </div>
        <small class="dica">
          Escolha de ${minCriterios} a ${maxCriterios} critérios para avaliar os candidatos. Você também pode criar o seu.
        </small>
        <div class="opcoes">
          ${CRITERIOS_SUGERIDOS.map((criterio) => opcaoCriterio(criterio, a)).join('')}
          ${a.criterios.filter((criterio) => criterio.custom).map(criterioProprio).join('')}
        </div>
        <div class="novo-crit">
          <input id="novo-crit" maxlength="50" placeholder="Ex.: Pontualidade" aria-label="Novo critério">
          <button class="btn soft sm" data-act="add-crit"><svg class="ico"><use href="#i-plus"/></svg>Criar</button>
        </div>
      </section>
    </div>

    ${erros.length ? `<div class="nota erro" style="margin-top:.9rem">${erros.map(esc).join('<br>')}</div>` : ''}`;
}
