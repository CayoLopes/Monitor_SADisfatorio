const Calc = (() => {
  const biblioteca = typeof module !== 'undefined' ? require('./ahp-lib.js') : AhpLib;

  const LIMITE_CR = 0.1;
  const POSICAO_MAX = 8;
  const ESCALA_MAX = 9;
  const TOLERANCIA = 1e-12;

  const somar = (valores) => valores.reduce((soma, valor) => soma + valor, 0);

  function razao(posicao) {
    const limitada = Math.max(-POSICAO_MAX, Math.min(POSICAO_MAX, Math.round(Number(posicao) || 0)));
    return limitada <= 0 ? 1 - limitada : 1 / (1 + limitada);
  }

  function posicaoDaRazao(valor) {
    if (!(valor > 0) || !isFinite(valor)) return 0;
    if (valor >= 1) return 1 - Math.min(ESCALA_MAX, Math.round(valor));
    return Math.min(ESCALA_MAX, Math.round(1 / valor)) - 1;
  }

  function montarMatriz(ids, comparacoes) {
    const matriz = ids.map(() => Array(ids.length).fill(1));

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const valor = razao(comparacoes?.[`${ids[i]}|${ids[j]}`]);
        matriz[i][j] = valor;
        matriz[j][i] = 1 / valor;
      }
    }
    return matriz;
  }

  function pesosSemContradicao(matriz) {
    const n = matriz.length;
    const proporcoes = n === 2 ? [matriz[0][1], 1] : Array(n).fill(1);
    const total = somar(proporcoes);

    return {
      pesos: proporcoes.map((p) => p / total),
      lambda: n,
      ci: 0,
      cr: 0,
      aplicavel: false,
      consistente: true,
    };
  }

  function calcularPesos(matriz) {
    const n = matriz.length;
    if (n < 3) return pesosSemContradicao(matriz);

    const { pesos, ci, cr } = biblioteca.calcular(matriz);
    const indiceConsistencia = Math.max(0, ci);
    const razaoConsistencia = Math.max(0, cr);

    return {
      pesos,
      lambda: n + indiceConsistencia * (n - 1),
      ci: indiceConsistencia,
      cr: razaoConsistencia,
      aplicavel: true,
      consistente: razaoConsistencia <= LIMITE_CR + TOLERANCIA,
    };
  }

  function diagnosticar(ids, comparacoes) {
    const matriz = montarMatriz(ids, comparacoes);
    const resultado = calcularPesos(matriz);
    const pares = [];

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const esperado = resultado.pesos[i] / resultado.pesos[j];
        const intensidade = Math.min(ESCALA_MAX, Math.max(1, Math.round(esperado >= 1 ? esperado : 1 / esperado)));

        pares.push({
          a: ids[i],
          b: ids[j],
          desvio: Math.abs(Math.log(matriz[i][j] / esperado)),
          esperado,
          sugestao: esperado >= 1 ? 1 - intensidade : intensidade - 1,
        });
      }
    }

    const maiorDesvioPrimeiro = (x, y) => (Math.abs(x.desvio - y.desvio) < 1e-9 ? 0 : y.desvio - x.desvio);
    return { ...resultado, pares: pares.sort(maiorDesvioPrimeiro) };
  }

  function analisar({ criterios, candidatos, comparacoesCriterios, comparacoesCandidatos }) {
    const idsCandidatos = candidatos.map((c) => c.id);
    const pesosCriterios = calcularPesos(montarMatriz(criterios.map((c) => c.id), comparacoesCriterios));
    const porCriterio = criterios.map((criterio) =>
      calcularPesos(montarMatriz(idsCandidatos, comparacoesCandidatos?.[criterio.id]))
    );

    const ranking = candidatos
      .map((candidato, i) => {
        const contribuicoes = criterios.map((_, k) => pesosCriterios.pesos[k] * porCriterio[k].pesos[i]);
        return { id: candidato.id, nome: candidato.nome, contribuicoes, pontuacao: somar(contribuicoes) };
      })
      .sort((x, y) => y.pontuacao - x.pontuacao);

    return {
      criterios: pesosCriterios,
      porCriterio,
      ranking,
      consistente: pesosCriterios.consistente && porCriterio.every((p) => p.consistente),
    };
  }

  return { POSICAO_MAX, razao, posicaoDaRazao, montarMatriz, calcularPesos, diagnosticar, analisar };
})();

if (typeof module !== 'undefined') module.exports = Calc;
