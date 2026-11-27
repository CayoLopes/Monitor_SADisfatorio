const EXEMPLOS = {
  ahp: () => {
    state.ahp = exemploAHP();
  },
};

function renderTudo() {
  renderSelecionar();
}

function avisarBibliotecaAusente() {
  document.getElementById('sel-app').innerHTML = `
    <div class="nota erro">
      Não foi possível carregar a biblioteca AHP (ahp-lite). Verifique a conexão com a internet e recarregue a página.
    </div>`;
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

if (AhpLib.disponivel()) renderTudo();
else avisarBibliotecaAusente();
