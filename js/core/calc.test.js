// Rodar: node js/core/calc.test.js
const assert = require('assert');
const Calc = require('./calc.js');
const fixtures = require('./calc.fixtures.json'); // autovetores calculados com numpy.linalg.eig

const perto = (a, b, msg, eps = 1e-6) => assert(Math.abs(a - b) < eps, `${msg}: ${a} != ${b}`);

// ---------------------------------------------------------------------------
// Pesos e λmáx batem com o numpy (18 matrizes, n = 3…10)
// ---------------------------------------------------------------------------
fixtures.forEach((f, k) => {
  const p = Calc.ahpPesos(f.matrix);
  p.w.forEach((w, i) => perto(w, f.weights[i], `caso ${k} peso ${i}`, 1e-9));
  perto(p.lam, f.lambdaMax, `caso ${k} λmáx`, 1e-8);
  perto(p.w.reduce((s, a) => s + a, 0), 1, `caso ${k} soma`, 1e-12);
});

// ---------------------------------------------------------------------------
// Consistência
// ---------------------------------------------------------------------------
const ids = ['a', 'b', 'c'];

// Perfeitamente consistente (pesos 0.6 / 0.3 / 0.1 -> razões 2, 6, 3)
const ok = Calc.ahpDiag(ids, { 'a|b': -1, 'a|c': -5, 'b|c': -2 });
perto(ok.cr, 0, 'CR consistente');
perto(ok.w[0], 0.6, 'peso a');
perto(ok.w[1], 0.3, 'peso b');
perto(ok.w[2], 0.1, 'peso c');
assert(ok.consistente);

// Exemplo clássico de Saaty (3×3): λmáx ≈ 3,0385 e CR com RI = 0,58
const saaty = Calc.ahpPesos([
  [1, 3, 5],
  [1 / 3, 1, 3],
  [1 / 5, 1 / 3, 1],
]);
perto(saaty.lam, 3.0385, 'λmáx Saaty', 1e-3);
perto(saaty.cr, (3.0385 - 3) / 2 / 0.58, 'CR Saaty', 1e-3);
assert(saaty.consistente);

// Inconsistente: A>B, B>C, C>A -> rejeitada
const ciclo = Calc.ahpPesos([
  [1, 9, 1 / 9],
  [1 / 9, 1, 9],
  [9, 1 / 9, 1],
]);
assert.strictEqual(ciclo.consistente, false);

// Inconsistente: a>>b, b>>c, mas a=c.
// Os três pares destoam igualmente: empate, então vale a ordem original (sem depender de ruído numérico).
const ruim = Calc.ahpDiag(ids, { 'a|b': -8, 'b|c': -8, 'a|c': 0 });
assert(ruim.cr > 0.1 && !ruim.consistente, 'CR alto esperado: ' + ruim.cr);
assert.deepStrictEqual(ruim.pares.map((p) => p.a + p.b), ['ab', 'ac', 'bc'], 'ordem estável nos empates');

// Com 4 itens consistentes (pesos 8:4:2:1) e um julgamento corrompido (a|d), o par errado é o mais
// destoante e aplicar o valor sugerido reduz o CR. (Com 3 itens todos os pares destoam igual:
// só dá para apontar o culpado a partir de 4.)
const itens4 = ['a', 'b', 'c', 'd'];
const J4 = { 'a|b': -1, 'a|c': -3, 'a|d': 8, 'b|c': -1, 'b|d': -3, 'c|d': -1 };
const diag4 = Calc.ahpDiag(itens4, J4);
const culpado = diag4.pares[0];
assert(culpado.a === 'a' && culpado.b === 'd', 'par com maior desvio: ' + culpado.a + culpado.b);
assert(Calc.ahpDiag(itens4, { ...J4, 'a|d': culpado.sug }).cr < diag4.cr / 2, 'a sugestão deve reduzir o CR');
perto(Calc.ahpDiag(itens4, { ...J4, 'a|d': -7 }).cr, 0, 'CR com o valor correto');

// Com 2 itens não há contradição possível
const dois = Calc.ahpDiag(['x', 'y'], { 'x|y': -3 });
perto(dois.cr, 0, 'CR com 2 itens');
assert(!dois.aplicavel && dois.consistente);

// RI correto para n > 6 (a versão antiga usava 1,12)
assert.strictEqual(Calc.RI[7], 1.32);
assert.strictEqual(Calc.RI[10], 1.49);

// ---------------------------------------------------------------------------
// Escala da barrinha <-> razão
// ---------------------------------------------------------------------------
for (let v = -8; v <= 8; v++) {
  assert.strictEqual(Calc.posDe(Calc.razao(v)), v, 'ida e volta ' + v);
}
perto(Calc.razao(-8), 9, 'razão -8');
perto(Calc.razao(8), 1 / 9, 'razão +8');
perto(Calc.razao(-1), 2, 'razão -1');
perto(Calc.razao(1), 0.5, 'razão +1');
perto(Calc.razao(0), 1, 'razão 0');

// ---------------------------------------------------------------------------
// Matriz de comparações
// ---------------------------------------------------------------------------
// É recíproca e usa 1 para pares ausentes
const M = Calc.matriz(['a', 'b', 'c'], { 'a|b': -2 });
perto(M[0][1], 3, 'a|b');
perto(M[1][0], 1 / 3, 'b|a');
perto(M[0][2], 1, 'par ausente');

// Ids opacos: nomes com "_" não colidem
const M2 = Calc.matriz(['x_y', 'x', 'y'], { 'x_y|x': -4, 'x|y': -2 });
perto(M2[0][1], 5, 'x_y|x');
perto(M2[1][2], 3, 'x|y');

// ---------------------------------------------------------------------------
// Síntese hierárquica
// ---------------------------------------------------------------------------
const criterios = ['c1', 'c2', 'c3'].map((id) => ({ id }));
const candidatos = ['A', 'B', 'C', 'D'].map((id) => ({ id, nome: id }));

const r = Calc.analisar({
  criterios,
  candidatos,
  jc: { 'c1|c2': -2, 'c1|c3': -4, 'c2|c3': -1 },
  jp: {
    c1: { 'A|B': -2, 'A|C': -4, 'A|D': -6, 'B|C': -1, 'B|D': -2, 'C|D': -1 },
    c2: { 'A|B': 2, 'B|C': -2 },
    c3: {},
  },
});

// Pontuações somam 1, ranking vem ordenado e as contribuições somam a pontuação
perto(r.ranking.reduce((s, x) => s + x.score, 0), 1, 'soma das pontuações', 1e-12);
for (let i = 1; i < r.ranking.length; i++) {
  assert(r.ranking[i - 1].score >= r.ranking[i].score, 'ordem do ranking');
}
assert.strictEqual(r.ranking[0].id, 'A', 'vencedor');
r.ranking.forEach((x) => perto(x.contrib.reduce((s, v) => s + v, 0), x.score, 'contribuições', 1e-12));

// Tudo indiferente -> empate perfeito
Calc.analisar({ criterios: criterios.slice(0, 2), candidatos: candidatos.slice(0, 3), jc: {}, jp: {} })
  .ranking.forEach((x) => perto(x.score, 1 / 3, 'empate', 1e-12));

console.log('Todos os testes passaram.');
