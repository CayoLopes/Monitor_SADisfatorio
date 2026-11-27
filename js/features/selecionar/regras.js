// Regras do fluxo (sem DOM): validação, limpeza de julgamentos órfãos e lista de etapas.

// Normaliza um nome para comparação (sem espaços sobrando, minúsculo)
const norm = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

// Erros da tela "Montar" (lista vazia = pode avançar)
function validar({ candidatos, criterios }) {
  const erros = [];
  const temRepetido = (lista) => new Set(lista.map((x) => norm(x.nome))).size !== lista.length;

  if (candidatos.length < LIMITES.minCand) {
    erros.push(`Use pelo menos ${LIMITES.minCand} candidatos.`);
  }
  if (candidatos.some((c) => !norm(c.nome))) {
    erros.push('Todo candidato precisa de um nome.');
  } else if (temRepetido(candidatos)) {
    erros.push('Há dois candidatos com o mesmo nome.');
  }
  if (criterios.length < LIMITES.minCrit) {
    erros.push(`Escolha pelo menos ${LIMITES.minCrit} critérios.`);
  }
  return erros;
}

// Garante que o estado salvo tem o formato esperado
function garantir() {
  const a = state.ahp;
  if (!Array.isArray(a.candidatos)) a.candidatos = estadoInicial().ahp.candidatos;
  if (!Array.isArray(a.criterios)) a.criterios = [];
  a.jc ??= {};
  a.jp ??= {};
  a.criterios.forEach((c) => {
    a.jp[c.id] ??= {};
  });
  a.passo = Math.max(0, +a.passo || 0);
}

// Remove julgamentos de candidatos/critérios que não existem mais
function podar(a) {
  const ids = new Set([...a.candidatos, ...a.criterios].map((x) => x.id));
  const manter = (J) =>
    Object.fromEntries(Object.entries(J || {}).filter(([par]) => par.split('|').every((id) => ids.has(id))));

  a.jc = manter(a.jc);
  a.jp = Object.fromEntries(a.criterios.map((c) => [c.id, manter(a.jp[c.id])]));
}

// Etapas do assistente: Montar -> Critérios -> um passo por critério -> Resultado
function etapas(a) {
  return [
    { t: 'Montar' },
    { t: 'Critérios', ids: a.criterios.map((c) => c.id), J: a.jc },
    ...a.criterios.map((c) => ({
      t: c.nome || 'Critério',
      ids: a.candidatos.map((p) => p.id),
      J: a.jp[c.id],
      crit: c,
    })),
    { t: 'Resultado' },
  ];
}

// id -> nome (de critério ou candidato)
const nm = (a) => (id) => (a.criterios.find((c) => c.id === id) || a.candidatos.find((p) => p.id === id) || {}).nome || '';

// Todos os pares {i < j} de uma lista de ids
function pares(ids) {
  const lista = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) lista.push([ids[i], ids[j]]);
  }
  return lista;
}

const totalPares = (e) => (e.ids ? pares(e.ids).length : 0);
const feitos = (e) => (e.ids ? pares(e.ids).filter(([A, B]) => (A + '|' + B) in e.J).length : 0);

// Uma etapa de comparação está consistente quando o CR da sua matriz é <= 0,10
const consistente = (e) => Calc.ahpDiag(e.ids, e.J).consistente;

// Até onde o usuário pode ir:
//  - dados incompletos na tela "Montar" seguram nela;
//  - a primeira matriz inconsistente (critérios ou candidatos) segura nela;
//  - só com todas as matrizes consistentes o resultado é liberado.
function passoMax(a, et) {
  if (validar(a).length) return 0;

  for (let i = 1; i < et.length - 1; i++) {
    if (!consistente(et[i])) return i;
  }
  return et.length - 1;
}
