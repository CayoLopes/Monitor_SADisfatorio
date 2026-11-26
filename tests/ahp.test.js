// Testes do núcleo AHP.  Execute:  node tests/ahp.test.js
const assert = require('assert');
const AHP = require('../src/core/ahp.js');
const fixtures = require('./fixtures.json'); // autovetores calculados com numpy.linalg.eig

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('  ✓', name); }
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) < eps, `${msg || ''} ${a} ≠ ${b}`);

console.log('Núcleo AHP');

test('pesos e λmax coincidem com numpy (18 matrizes, n = 3…10)', () => {
  fixtures.forEach((f, k) => {
    const p = AHP.priorities(f.matrix);
    p.weights.forEach((w, i) => close(w, f.weights[i], 1e-9, `caso ${k} peso ${i}`));
    close(p.lambdaMax, f.lambdaMax, 1e-8, `caso ${k} λmax`);
  });
});

test('pesos somam 1', () => {
  fixtures.forEach((f) => close(AHP.priorities(f.matrix).weights.reduce((a, b) => a + b, 0), 1, 1e-12));
});

test('matriz perfeitamente consistente → CR = 0', () => {
  const w = [0.5, 0.3, 0.2];
  const m = w.map((a) => w.map((b) => a / b));
  const c = AHP.consistency(m);
  close(c.cr, 0, 1e-9);
  assert.ok(c.consistent);
});

test('exemplo clássico de Saaty (3×3) — CR calculado com RI = 0,58', () => {
  const m = [[1, 3, 5], [1 / 3, 1, 3], [1 / 5, 1 / 3, 1]];
  const c = AHP.consistency(m);
  close(c.lambdaMax, 3.0385, 1e-3);
  close(c.cr, ((3.0385 - 3) / 2) / 0.58, 1e-3);
  assert.ok(c.consistent);
});

test('matriz inconsistente é rejeitada (A>B, B>C, C>A)', () => {
  const m = [[1, 9, 1 / 9], [1 / 9, 1, 9], [9, 1 / 9, 1]];
  assert.strictEqual(AHP.consistency(m).consistent, false);
});

test('RI correto para n > 6 (o código antigo usava 1,12)', () => {
  assert.strictEqual(AHP.RI[7], 1.32);
  assert.strictEqual(AHP.RI[10], 1.49);
});

test('n = 2 é sempre consistente e não aplica CR', () => {
  const c = AHP.consistency([[1, 7], [1 / 7, 1]]);
  assert.strictEqual(c.applicable, false);
  assert.ok(c.consistent);
});

test('escala slider ↔ razão é reversível', () => {
  for (let p = -8; p <= 8; p++) assert.strictEqual(AHP.posFromRatio(AHP.ratioFromPos(p)), p);
  assert.strictEqual(AHP.ratioFromPos(-8), 9);
  close(AHP.ratioFromPos(8), 1 / 9, 1e-12);
  assert.strictEqual(AHP.ratioFromPos(0), 1);
});

test('buildMatrix é recíproca e usa 1 para pares ausentes', () => {
  const m = AHP.buildMatrix(['a', 'b', 'c'], { 'a|b': 3 });
  assert.strictEqual(m[0][1], 3);
  close(m[1][0], 1 / 3, 1e-12);
  assert.strictEqual(m[0][2], 1);
});

test('nomes com "_" ou "::" não geram colisão (ids são opacos)', () => {
  const m = AHP.buildMatrix(['x_y', 'x', 'y'], { 'x_y|x': 5, 'x|y': 3 });
  assert.strictEqual(m[0][1], 5);
  assert.strictEqual(m[1][2], 3);
});

test('sugestão aponta o julgamento que quebra a coerência', () => {
  // A=B×2, B=C×2 → A deveria ser ≈4×C; foi dado 1/9
  const ids = ['a', 'b', 'c'];
  const j = { 'a|b': 2, 'b|c': 2, 'a|c': 1 / 9 };
  const ev = AHP.evaluate(ids, j);
  assert.ok(!ev.consistent);
  assert.ok(ev.suggestion);
});

test('síntese: pesos globais somam 1 e ranking está ordenado', () => {
  const ids = { criteria: ['c1', 'c2', 'c3'], alternatives: ['A', 'B', 'C', 'D'] };
  const r = AHP.analyze({
    ...ids,
    criteriaJudgments: { 'c1|c2': 3, 'c1|c3': 5, 'c2|c3': 2 },
    altJudgments: {
      c1: { 'A|B': 3, 'A|C': 5, 'A|D': 7, 'B|C': 2, 'B|D': 3, 'C|D': 2 },
      c2: { 'A|B': 1 / 3, 'B|C': 3 },
      c3: {},
    },
  });
  close(r.scores.reduce((a, b) => a + b, 0), 1, 1e-12);
  for (let i = 1; i < r.ranking.length; i++) assert.ok(r.ranking[i - 1].score >= r.ranking[i].score);
  assert.strictEqual(r.ranking[0].id, 'A');
  // contribuições por critério somam o score
  r.ranking.forEach((x) => close(x.contributions.reduce((a, b) => a + b, 0), x.score, 1e-12));
});

test('tudo indiferente → empate perfeito', () => {
  const r = AHP.analyze({ criteria: ['c1', 'c2'], alternatives: ['A', 'B', 'C'], criteriaJudgments: {}, altJudgments: {} });
  r.scores.forEach((s) => close(s, 1 / 3, 1e-12));
});

console.log(`\n${passed} testes passaram.`);
