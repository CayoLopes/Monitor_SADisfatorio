const AhpLib = (() => {
  const emNode = typeof module !== 'undefined';

  const carregar = () =>
    emNode
      ? { getWeights: require('ahp-lite').getWeights, Matrix: require('linear-algebra')().Matrix }
      : window.AhpLite;

  function disponivel() {
    return Boolean(carregar());
  }

  function calcular(matriz) {
    const { getWeights, Matrix } = carregar();
    const { ev, ci, cr } = getWeights(new Matrix(matriz));
    return { pesos: ev, ci, cr };
  }

  return { disponivel, calcular };
})();

if (typeof module !== 'undefined') module.exports = AhpLib;
