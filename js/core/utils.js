const uid = () => Math.random().toString(36).slice(2, 9);

function esc(texto) {
  const entidades = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  return String(texto ?? '').replace(/[&<>"]/g, (c) => entidades[c]);
}

const formatar = (casas) => (n) => n.toFixed(casas).replace('.', ',');
const f1 = formatar(1);
const f2 = formatar(2);
const f3 = formatar(3);
const pct = (pontos) => (isFinite(pontos) ? f1(pontos) + '%' : '—');

function toast(mensagem) {
  const el = document.getElementById('toast');
  document.getElementById('toast-txt').textContent = mensagem;
  el.classList.add('mostrar');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('mostrar'), 1800);
}

function download(nomeArquivo, conteudo, tipo = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
