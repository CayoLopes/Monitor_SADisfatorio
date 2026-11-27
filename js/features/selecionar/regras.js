const normalizarNome = (nome) => String(nome || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

function validar({ candidatos, criterios }) {
  const erros = [];
  const temRepetidos = new Set(candidatos.map((c) => normalizarNome(c.nome))).size !== candidatos.length;

  if (candidatos.length < LIMITES.minCandidatos) {
    erros.push(`Use pelo menos ${LIMITES.minCandidatos} candidatos.`);
  }
  if (candidatos.some((c) => !normalizarNome(c.nome))) {
    erros.push('Todo candidato precisa de um nome.');
  } else if (temRepetidos) {
    erros.push('Há dois candidatos com o mesmo nome.');
  }
  if (criterios.length < LIMITES.minCriterios) {
    erros.push(`Escolha pelo menos ${LIMITES.minCriterios} critérios.`);
  }
  return erros;
}

function garantirEstado() {
  const a = state.ahp;

  if (!Array.isArray(a.candidatos)) a.candidatos = estadoInicial().ahp.candidatos;
  if (!Array.isArray(a.criterios)) a.criterios = [];
  a.comparacoesCriterios ??= {};
  a.comparacoesCandidatos ??= {};
  a.criterios.forEach((criterio) => {
    a.comparacoesCandidatos[criterio.id] ??= {};
  });
  a.passo = Math.max(0, Number(a.passo) || 0);
}

function podar(a) {
  const idsValidos = new Set([...a.candidatos, ...a.criterios].map((item) => item.id));
  const manterValidas = (comparacoes = {}) =>
    Object.fromEntries(
      Object.entries(comparacoes).filter(([par]) => par.split('|').every((id) => idsValidos.has(id)))
    );

  a.comparacoesCriterios = manterValidas(a.comparacoesCriterios);
  a.comparacoesCandidatos = Object.fromEntries(
    a.criterios.map((criterio) => [criterio.id, manterValidas(a.comparacoesCandidatos[criterio.id])])
  );
}

function montarEtapas(a) {
  const idsCandidatos = a.candidatos.map((c) => c.id);

  return [
    { titulo: 'Montar' },
    {
      titulo: 'Critérios',
      ids: a.criterios.map((c) => c.id),
      comparacoes: a.comparacoesCriterios,
    },
    ...a.criterios.map((criterio) => ({
      titulo: criterio.nome || 'Critério',
      ids: idsCandidatos,
      comparacoes: a.comparacoesCandidatos[criterio.id],
      criterio,
    })),
    { titulo: 'Resultado' },
  ];
}

function nomeDe(a) {
  const itens = [...a.criterios, ...a.candidatos];
  return (id) => itens.find((item) => item.id === id)?.nome ?? '';
}

function paresDe(ids) {
  const pares = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) pares.push([ids[i], ids[j]]);
  }
  return pares;
}

const totalDePares = (etapa) => (etapa.ids ? paresDe(etapa.ids).length : 0);

const paresRespondidos = (etapa) =>
  etapa.ids ? paresDe(etapa.ids).filter(([a, b]) => `${a}|${b}` in etapa.comparacoes).length : 0;

const etapaConsistente = (etapa) => Calc.diagnosticar(etapa.ids, etapa.comparacoes).consistente;

function passoMaximo(a, etapas) {
  if (validar(a).length) return 0;

  for (let i = 1; i < etapas.length - 1; i++) {
    if (!etapaConsistente(etapas[i])) return i;
  }
  return etapas.length - 1;
}
