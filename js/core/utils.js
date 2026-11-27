/* ===== UTILITÁRIOS ===== */

const uid = () => Math.random().toString(36).slice(2, 9);

// Escapa texto digitado antes de colocá-lo em HTML
function esc(s) {
  const trocas = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  return String(s ?? '').replace(/[&<>"]/g, (c) => trocas[c]);
}

// Números no formato brasileiro (vírgula decimal)
const f1 = (x) => x.toFixed(1).replace('.', ',');
const f2 = (x) => x.toFixed(2).replace('.', ',');
const f3 = (x) => x.toFixed(3).replace('.', ',');
const pct = (v) => (isFinite(v) ? f1(v) + '%' : '—'); // recebe pontos percentuais (0-100)

function toast(txt) {
  const el = document.getElementById('toast');
  document.getElementById('toast-txt').textContent = txt;
  el.classList.add('mostrar');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('mostrar'), 1800);
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
