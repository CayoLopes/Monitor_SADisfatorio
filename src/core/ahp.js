/**
 * Núcleo do método AHP (Analytic Hierarchy Process, Saaty).
 *
 * Módulo puro (sem DOM, sem localStorage) — funciona no navegador
 * (window.AHP) e no Node (require), o que permite testá-lo isoladamente.
 *
 * Método de prioridades: autovetor principal (power iteration), que é o
 * método original de Saaty. O projeto anterior usava a média das colunas
 * normalizadas (aproximação) e uma tabela RI incompleta (só até n = 6).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AHP = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Índice Aleatório (RI) de Saaty, indexado por n (1..15). */
  const RI = [0, 0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59];
  const CR_LIMIT = 0.1;
  const MAX_PAIR_POS = 8; // slider vai de -8 a +8  →  razões 9 … 1 … 1/9

  /* ---------- Escala de Saaty ↔ posição do slider ---------- */

  /**
   * pos < 0 → item da ESQUERDA é preferido (razão = |pos| + 1)
   * pos > 0 → item da DIREITA é preferido (razão = 1 / (pos + 1))
   */
  function ratioFromPos(pos) {
    const p = Math.max(-MAX_PAIR_POS, Math.min(MAX_PAIR_POS, Math.round(pos)));
    if (p === 0) return 1;
    return p < 0 ? -p + 1 : 1 / (p + 1);
  }

  function posFromRatio(ratio) {
    if (!(ratio > 0) || !isFinite(ratio)) return 0;
    if (ratio >= 1) return 1 - Math.min(9, Math.round(ratio)) || 0;
    return Math.min(9, Math.round(1 / ratio)) - 1;
  }

  /* ---------- Matriz de comparação ---------- */

  const pairKey = (a, b) => a + '|' + b;

  /** Todos os pares (i < j) de uma lista de ids. */
  function pairs(ids) {
    const out = [];
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) out.push([ids[i], ids[j]]);
    return out;
  }

  /**
   * Monta a matriz recíproca. `judgments[pairKey(a,b)]` = quantas vezes `a`
   * é preferido a `b`. Pares sem julgamento valem 1 (indiferença).
   */
  function buildMatrix(ids, judgments) {
    const n = ids.length;
    const m = Array.from({ length: n }, () => Array(n).fill(1));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const v = judgments && judgments[pairKey(ids[i], ids[j])];
        const r = typeof v === 'number' && v > 0 && isFinite(v) ? v : 1;
        m[i][j] = r;
        m[j][i] = 1 / r;
      }
    }
    return m;
  }

  /* ---------- Prioridades (autovetor principal) ---------- */

  function priorities(matrix) {
    const n = matrix.length;
    if (n === 0) return { weights: [], lambdaMax: 0 };
    if (n === 1) return { weights: [1], lambdaMax: 1 };

    let w = Array(n).fill(1 / n);
    let lambdaMax = n;
    for (let iter = 0; iter < 10000; iter++) {
      const aw = matrix.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));
      const sum = aw.reduce((a, b) => a + b, 0);
      const next = aw.map((v) => v / sum);
      const delta = Math.max(...next.map((v, i) => Math.abs(v - w[i])));
      w = next;
      if (delta < 1e-14) break;
    }
    const aw = matrix.map((row) => row.reduce((s, v, j) => s + v * w[j], 0));
    lambdaMax = aw.reduce((s, v, i) => s + v / w[i], 0) / n;
    return { weights: w, lambdaMax };
  }

  /* ---------- Consistência ---------- */

  function consistency(matrix, prio) {
    const n = matrix.length;
    const { weights, lambdaMax } = prio || priorities(matrix);
    if (n < 3) {
      // Matrizes 1×1 e 2×2 recíprocas são sempre consistentes.
      return { n, lambdaMax: n, ci: 0, ri: 0, cr: 0, consistent: true, applicable: false, weights };
    }
    const ci = Math.max(0, (lambdaMax - n) / (n - 1));
    const ri = RI[n] !== undefined ? RI[n] : RI[RI.length - 1];
    const cr = ci / ri;
    return { n, lambdaMax, ci, ri, cr, consistent: cr <= CR_LIMIT + 1e-12, applicable: true, weights };
  }

  /**
   * Aponta o julgamento mais discrepante do vetor de pesos obtido
   * (maior |ln(a_ij · w_j / w_i)|) e o valor que o tornaria coerente.
   */
  function suggestRevision(ids, matrix, prio) {
    const n = matrix.length;
    if (n < 3) return null;
    const { weights } = prio || priorities(matrix);
    let best = null;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const implied = weights[i] / weights[j];
        const dev = Math.abs(Math.log(matrix[i][j] / implied));
        if (!best || dev > best.deviation) best = { i, j, deviation: dev, implied };
      }
    }
    return {
      a: ids[best.i],
      b: ids[best.j],
      current: matrix[best.i][best.j],
      suggestedPos: posFromRatio(best.implied),
      deviation: best.deviation,
    };
  }

  /* ---------- Avaliação de uma matriz (atalho) ---------- */

  function evaluate(ids, judgments) {
    const matrix = buildMatrix(ids, judgments);
    const prio = priorities(matrix);
    const cons = consistency(matrix, prio);
    return { ids, matrix, weights: prio.weights, ...cons, suggestion: cons.consistent ? null : suggestRevision(ids, matrix, prio) };
  }

  /* ---------- Síntese hierárquica ---------- */

  /**
   * @param {{criteria: string[], alternatives: string[],
   *          criteriaJudgments: object, altJudgments: Object<string, object>}} input
   */
  function analyze(input) {
    const { criteria, alternatives, criteriaJudgments, altJudgments } = input;
    const crit = evaluate(criteria, criteriaJudgments);
    const local = criteria.map((c) => evaluate(alternatives, (altJudgments || {})[c] || {}));

    const contributions = alternatives.map((_, a) => criteria.map((_, c) => crit.weights[c] * local[c].weights[a]));
    const scores = contributions.map((row) => row.reduce((s, v) => s + v, 0));
    const ranking = alternatives
      .map((id, i) => ({ id, index: i, score: scores[i], contributions: contributions[i] }))
      .sort((x, y) => y.score - x.score);

    return {
      criteria: crit,
      local, // um por critério, na mesma ordem de `criteria`
      scores,
      contributions,
      ranking,
      allConsistent: crit.consistent && local.every((l) => l.consistent),
    };
  }

  return {
    RI, CR_LIMIT, MAX_PAIR_POS,
    ratioFromPos, posFromRatio, pairKey, pairs,
    buildMatrix, priorities, consistency, suggestRevision, evaluate, analyze,
  };
});
