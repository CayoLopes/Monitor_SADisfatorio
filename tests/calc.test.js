const assert = require('assert');
const Calc = require('../js/core/calc.js');

const perto = (obtido, esperado, mensagem, tolerancia = 1e-6) =>
  assert(Math.abs(obtido - esperado) < tolerancia, `${mensagem}: ${obtido} != ${esperado}`);

const matrizConsistente = (pesos) => pesos.map((a) => pesos.map((b) => a / b));

const testes = {
  'matriz consistente devolve os pesos originais e CR zero'() {
    const pesos = [0.5, 0.3, 0.2];
    const resultado = Calc.calcularPesos(matrizConsistente(pesos));

    resultado.pesos.forEach((peso, i) => perto(peso, pesos[i], `peso ${i}`));
    perto(resultado.cr, 0, 'CR', 1e-6);
    assert(resultado.consistente);
  },

  'pesos somam 1 para matrizes de 3 a 10 itens'() {
    for (let n = 3; n <= 10; n++) {
      const pesos = Array.from({ length: n }, (_, i) => i + 1);
      const resultado = Calc.calcularPesos(matrizConsistente(pesos));
      perto(resultado.pesos.reduce((soma, p) => soma + p, 0), 1, `soma n=${n}`);
    }
  },

  'exemplo clássico de Saaty é aceito como consistente'() {
    const resultado = Calc.calcularPesos([
      [1, 3, 5],
      [1 / 3, 1, 3],
      [1 / 5, 1 / 3, 1],
    ]);

    perto(resultado.pesos[0], 0.633, 'peso 0', 0.02);
    perto(resultado.pesos[1], 0.26, 'peso 1', 0.02);
    perto(resultado.pesos[2], 0.106, 'peso 2', 0.02);
    assert(resultado.consistente);
  },

  'ciclo A>B, B>C, C>A é inconsistente'() {
    const resultado = Calc.calcularPesos([
      [1, 9, 1 / 9],
      [1 / 9, 1, 9],
      [9, 1 / 9, 1],
    ]);
    assert.strictEqual(resultado.consistente, false);
  },

  'com 2 itens o CR não se aplica e os pesos seguem a razão'() {
    const resultado = Calc.calcularPesos([
      [1, 3],
      [1 / 3, 1],
    ]);

    assert(!resultado.aplicavel && resultado.consistente);
    perto(resultado.pesos[0], 0.75, 'peso 0');
    perto(resultado.pesos[1], 0.25, 'peso 1');
  },

  'posição da barra e razão de Saaty são inversas'() {
    for (let posicao = -8; posicao <= 8; posicao++) {
      assert.strictEqual(Calc.posicaoDaRazao(Calc.razao(posicao)), posicao);
    }
    perto(Calc.razao(-8), 9, 'extremo esquerdo');
    perto(Calc.razao(8), 1 / 9, 'extremo direito');
    perto(Calc.razao(0), 1, 'centro');
  },

  'matriz é recíproca, usa 1 para pares ausentes e não confunde ids parecidos'() {
    const matriz = Calc.montarMatriz(['x_y', 'x', 'y'], { 'x_y|x': -4, 'x|y': -2 });

    perto(matriz[0][1], 5, 'x_y|x');
    perto(matriz[1][0], 1 / 5, 'recíproca');
    perto(matriz[1][2], 3, 'x|y');
    perto(matriz[0][2], 1, 'par ausente');
  },

  'diagnóstico aponta o julgamento corrompido e a sugestão reduz o CR'() {
    const ids = ['a', 'b', 'c', 'd'];
    const comparacoes = { 'a|b': -1, 'a|c': -3, 'a|d': 8, 'b|c': -1, 'b|d': -3, 'c|d': -1 };
    const diagnostico = Calc.diagnosticar(ids, comparacoes);
    const [culpado] = diagnostico.pares;

    assert.deepStrictEqual([culpado.a, culpado.b], ['a', 'd']);

    const corrigido = Calc.diagnosticar(ids, { ...comparacoes, 'a|d': culpado.sugestao });
    assert(corrigido.cr < diagnostico.cr / 2, 'a sugestão deve reduzir o CR');
  },

  'análise: pontuações somam 1, ranking ordenado e contribuições fecham a pontuação'() {
    const criterios = ['c1', 'c2', 'c3'].map((id) => ({ id }));
    const candidatos = ['A', 'B', 'C', 'D'].map((id) => ({ id, nome: id }));

    const resultado = Calc.analisar({
      criterios,
      candidatos,
      comparacoesCriterios: { 'c1|c2': -2, 'c1|c3': -4, 'c2|c3': -1 },
      comparacoesCandidatos: {
        c1: { 'A|B': -2, 'A|C': -4, 'A|D': -6, 'B|C': -1, 'B|D': -2, 'C|D': -1 },
        c2: { 'A|B': 2, 'B|C': -2 },
        c3: {},
      },
    });

    perto(resultado.ranking.reduce((soma, c) => soma + c.pontuacao, 0), 1, 'soma das pontuações', 1e-9);
    assert.strictEqual(resultado.ranking[0].id, 'A');
    resultado.ranking.forEach((candidato, i, lista) => {
      if (i) assert(lista[i - 1].pontuacao >= candidato.pontuacao, 'ordem do ranking');
      perto(candidato.contribuicoes.reduce((soma, v) => soma + v, 0), candidato.pontuacao, 'contribuições', 1e-9);
    });
  },

  'tudo indiferente resulta em empate perfeito'() {
    const resultado = Calc.analisar({
      criterios: [{ id: 'c1' }, { id: 'c2' }],
      candidatos: ['A', 'B', 'C'].map((id) => ({ id, nome: id })),
      comparacoesCriterios: {},
      comparacoesCandidatos: {},
    });

    resultado.ranking.forEach((candidato) => perto(candidato.pontuacao, 1 / 3, 'empate', 1e-9));
  },
};

let aprovados = 0;
for (const [nome, teste] of Object.entries(testes)) {
  teste();
  aprovados++;
  console.log('  ✓', nome);
}
console.log(`\n${aprovados} testes passaram.`);
