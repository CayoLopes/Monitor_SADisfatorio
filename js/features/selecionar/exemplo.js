const NOTAS_EXEMPLO = {
  cr: [8, 6, 7, 4],
  disp: [3, 8, 5, 7],
  hab: [7, 4, 8, 5],
  nota: [9, 5, 6, 3],
};

const NOTAS_CRITERIOS_EXEMPLO = [6, 5, 3, 4];

function comparacoesPorNotas(notas, ids) {
  const comparacoes = {};

  ids.forEach((a, i) => {
    ids.slice(i + 1).forEach((b, deslocamento) => {
      const j = i + 1 + deslocamento;
      comparacoes[`${a}|${b}`] = Calc.posicaoDaRazao(notas[i] / notas[j]);
    });
  });
  return comparacoes;
}

function exemploAHP() {
  const criterios = Object.keys(NOTAS_EXEMPLO).map((id) => ({
    ...CRITERIOS_SUGERIDOS.find((criterio) => criterio.id === id),
  }));
  const candidatos = ['Ana Beatriz', 'Bruno', 'Carla', 'Diego'].map((nome) => ({ id: uid(), nome }));
  const idsCandidatos = candidatos.map((c) => c.id);

  return {
    passo: 0,
    criterios,
    candidatos,
    comparacoesCriterios: comparacoesPorNotas(NOTAS_CRITERIOS_EXEMPLO, criterios.map((c) => c.id)),
    comparacoesCandidatos: Object.fromEntries(
      criterios.map((criterio) => [criterio.id, comparacoesPorNotas(NOTAS_EXEMPLO[criterio.id], idsCandidatos)])
    ),
  };
}
