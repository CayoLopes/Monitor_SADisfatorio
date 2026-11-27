const EXEMPLOS = {
  ahp: () => {
    state.ahp = exemploAHP();
  },
};

function renderTudo() {
  renderSelecionar();
}

document.querySelectorAll('[data-exemplo]').forEach((botao) => {
  botao.onclick = () => {
    EXEMPLOS[botao.dataset.exemplo]();
    save();
    renderTudo();
    toast('Exemplo carregado');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
});

document.querySelectorAll('[data-limpar]').forEach((botao) => {
  botao.onclick = () => {
    if (!confirm('Apagar candidatos, critérios e comparações?')) return;
    const chave = botao.dataset.limpar;
    state[chave] = estadoInicial()[chave];
    save();
    renderTudo();
    toast('Limpo');
    window.scrollTo({ top: 0 });
  };
});

renderTudo();
