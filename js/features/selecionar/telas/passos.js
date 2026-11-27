function desenharPassos(a, etapas) {
  const caixa = document.getElementById('passos');
  if (!caixa) return;

  const limite = passoMaximo(a, etapas);

  caixa.innerHTML = etapas
    .map((etapa, i) => {
      const total = totalDePares(etapa);
      const completo = total > 0 && paresRespondidos(etapa) === total;
      const inconsistente = etapa.ids?.length > 2 && !etapaConsistente(etapa);
      const bloqueado = i > limite;
      const marcador = inconsistente ? '!' : completo ? '✓' : i + 1;

      return `
        <button class="passo ${i === a.passo ? 'on' : ''} ${completo ? 'ok' : ''} ${inconsistente ? 'ruim' : ''}"
                data-go="${i}"
                ${bloqueado ? 'disabled title="Conclua os passos anteriores com consistência"' : ''}>
          <span class="pn">${marcador}</span>${esc(etapa.titulo)}
        </button>`;
    })
    .join('');

  const comparacoes = etapas.slice(1, -1);
  const total = comparacoes.reduce((soma, etapa) => soma + totalDePares(etapa), 0);
  const feitas = comparacoes.reduce((soma, etapa) => soma + paresRespondidos(etapa), 0);

  document.getElementById('prog-txt').textContent = `${feitas} de ${total} comparações feitas`;
  document.getElementById('prog-fill').style.width = (total ? (feitas / total) * 100 : 0) + '%';
}
