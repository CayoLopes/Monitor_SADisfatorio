// Modelo de decisão AHP (funções puras, testáveis em Node).
// Método de Saaty com autovetor principal.
//
// Posição da barrinha (v) de cada comparação, de -8 a +8:
//   negativo = o 1º item é preferido (|v| + 1 vezes)
//   positivo = o 2º item é preferido (|v| + 1 vezes)
//   zero     = os dois são iguais (escala de Saaty de 1 a 9)
const Calc = (() => {
  // Índice de consistência aleatório de Saaty, para n = 1..15
  const RI = [0, 0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.48, 1.56, 1.57, 1.59];
  const CR_MAX = 0.1; // acima disso os julgamentos são considerados inconsistentes
  const V_MAX = 8;

  const numero = (v) => +v || 0;

  // Posição da barrinha -> razão de Saaty (1/9 ... 1 ... 9)
  function razao(v) {
    const x = Math.max(-V_MAX, Math.min(V_MAX, Math.round(numero(v))));
    return x <= 0 ? 1 - x : 1 / (1 + x);
  }

  // Razão de Saaty -> posição da barrinha (inverso de razao)
  function posDe(r) {
    if (!(r > 0) || !isFinite(r)) return 0;
    if (r >= 1) return 1 - Math.min(9, Math.round(r));
    return Math.min(9, Math.round(1 / r)) - 1;
  }

  // Matriz recíproca de comparações. J['a|b'] = v; pares sem julgamento valem 1 (indiferença).
  function matriz(ids, J) {
    const m = ids.length;
    const A = ids.map(() => Array(m).fill(1));

    for (let i = 0; i < m; i++) {
      for (let j = i + 1; j < m; j++) {
        const r = razao(J?.[ids[i] + '|' + ids[j]]);
        A[i][j] = r;
        A[j][i] = 1 / r;
      }
    }
    return A;
  }

  // Vetor de prioridades (autovetor principal por iteração de potência), λmáx, CI e CR.
  // Com menos de 3 itens não há como haver contradição, então o CR não se aplica.
  function ahpPesos(A) {
    const m = A.length;
    const multiplicar = (v) => A.map((linha) => linha.reduce((soma, a, j) => soma + a * v[j], 0));

    if (m === 0) {
      return { w: [], lam: 0, ci: 0, ri: 0, cr: 0, aplicavel: false, consistente: true };
    }

    let w = Array(m).fill(1 / m);
    for (let k = 0; k < 10000; k++) {
      const x = multiplicar(w);
      const total = x.reduce((s, a) => s + a, 0);
      const novo = x.map((a) => a / total);
      const delta = Math.max(...novo.map((a, i) => Math.abs(a - w[i])));
      w = novo;
      if (delta < 1e-14) break;
    }

    if (m < 3) {
      return { w, lam: m, ci: 0, ri: 0, cr: 0, aplicavel: false, consistente: true };
    }

    const lam = multiplicar(w).reduce((s, a, i) => s + a / w[i], 0) / m;
    const ci = Math.max(0, (lam - m) / (m - 1));
    const ri = RI[Math.min(m, RI.length - 1)];
    const cr = ci / ri;

    return { w, lam, ci, ri, cr, aplicavel: true, consistente: cr <= CR_MAX + 1e-12 };
  }

  // Diagnóstico por par: quanto o julgamento do usuário destoa do que os outros julgamentos
  // implicam, |ln(a_ij / (w_i / w_j))|, e qual valor da barrinha seria coerente (sug).
  function ahpDiag(ids, J) {
    const A = matriz(ids, J);
    const p = ahpPesos(A);
    const pares = [];

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const esperado = p.w[i] / p.w[j];
        const k = Math.min(9, Math.max(1, Math.round(esperado >= 1 ? esperado : 1 / esperado)));
        pares.push({
          a: ids[i],
          b: ids[j],
          dev: Math.abs(Math.log(A[i][j] / esperado)),
          esp: esperado,
          sug: esperado >= 1 ? 1 - k : k - 1,
        });
      }
    }

    // Empates (ruído de ponto flutuante) mantêm a ordem original
    const maiorDesvioPrimeiro = (x, y) => (Math.abs(x.dev - y.dev) < 1e-9 ? 0 : y.dev - x.dev);
    return { ...p, pares: pares.sort(maiorDesvioPrimeiro) };
  }

  // Síntese hierárquica: peso do critério × prioridade local do candidato naquele critério.
  function analisar({ criterios, candidatos, jc, jp }) {
    const crit = ahpPesos(matriz(criterios.map((c) => c.id), jc));
    const locais = criterios.map((c) => ahpPesos(matriz(candidatos.map((p) => p.id), jp?.[c.id])));

    const ranking = candidatos
      .map((p, i) => {
        const contrib = criterios.map((_, k) => crit.w[k] * locais[k].w[i]);
        const score = contrib.reduce((s, v) => s + v, 0);
        return { id: p.id, nome: p.nome, contrib, score };
      })
      .sort((a, b) => b.score - a.score);

    return {
      crit,
      locais,
      ranking,
      consistente: crit.consistente && locais.every((l) => l.consistente),
    };
  }

  return { RI, CR_MAX, V_MAX, razao, posDe, matriz, ahpPesos, ahpDiag, analisar };
})();

if (typeof module !== 'undefined') module.exports = Calc;
