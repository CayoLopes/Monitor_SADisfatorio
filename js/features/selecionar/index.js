const raiz = () => document.getElementById('sel-app');
let erros = [];

function renderSelecionar() {
  garantir();

  const a = state.ahp;
  const et = etapas(a);
  const ultimo = et.length - 1;

  a.passo = Math.max(0, Math.min(a.passo, passoMax(a, et)));
  const passo = a.passo;
  const etapa = et[passo];

  let corpo;
  if (passo === 0) corpo = telaSetup(a, erros);
  else if (passo === ultimo) corpo = telaResultado(a);
  else corpo = telaComparar(a, etapa);

  raiz().innerHTML = `
    <div class="passos" id="passos" role="tablist"></div>

    <div class="prog" ${passo === 0 ? 'hidden' : ''}>
      <div class="prog-bar"><i id="prog-fill"></i></div>
      <span id="prog-txt"></span>
    </div>

    ${corpo}

    <div class="nav-passos">
      ${passo > 0 ? '<button class="btn ghost" data-act="voltar">← Voltar</button>' : '<span></span>'}
      ${
        passo < ultimo
          ? `<button class="btn" data-act="avancar">${passo === ultimo - 1 ? 'Ver resultado' : 'Próximo →'}</button>`
          : '<span></span>'
      }
    </div>`;

  desenharPassos(a, et);
  if (passo > 0 && passo < ultimo) diagnosticar(a, etapa);
}

// Registra um julgamento (posição x da barrinha) e atualiza só o cartão afetado
function setX(el, x) {
  const a = state.ahp;
  const et = etapas(a);
  const etapa = et[a.passo];
  const chave = el.dataset.k;
  const [A, B] = chave.split('|');
  const nome = nm(a);

  etapa.J[chave] = x;

  el.classList.add('feito');
  const campoBarra = el.querySelector('.pair-range');
  campoBarra.value = x;
  campoBarra.setAttribute('style', barra(x));

  const [ladoA, ladoB] = el.querySelectorAll('.lado');
  ladoA.classList.toggle('sel', x < 0);
  ladoB.classList.toggle('sel', x > 0);
  ladoA.classList.toggle('eq', x === 0);
  ladoB.classList.toggle('eq', x === 0);

  el.querySelectorAll('.marcas span').forEach((marca, i) => marca.classList.toggle('on', i - 8 === x));
  el.querySelector('.duelo-res').textContent = texto(x, nome(A), nome(B), etapa.crit ? 'melhor' : 'mais importante');

  diagnosticar(a, etapa);
  desenharPassos(a, et);
  save();
}

// Destaca nomes de candidatos repetidos enquanto o usuário digita
function marcarDuplicados() {
  const contagem = {};
  state.ahp.candidatos.forEach((c) => {
    const n = norm(c.nome);
    if (n) contagem[n] = (contagem[n] || 0) + 1;
  });

  raiz()
    .querySelectorAll('[data-f="cnome"]')
    .forEach((input) => {
      const n = norm(input.value);
      input.classList.toggle('invalido', !!n && contagem[n] > 1);
    });
}

function exportarJson() {
  const a = state.ahp;
  const r = Calc.analisar(a);

  const dados = {
    geradoEm: new Date().toISOString(),
    candidatos: a.candidatos.map((c) => c.nome),
    criterios: a.criterios.map((c, i) => ({ nome: c.nome, peso: r.crit.w[i] })),
    consistenciaCriterios: r.crit.cr,
    ranking: r.ranking.map((x) => ({ candidato: x.nome, pontuacao: x.score })),
    consistenciaCandidatos: a.criterios.map((c, i) => ({
      criterio: c.nome,
      cr: r.locais[i].cr,
      aceitavel: r.locais[i].consistente,
    })),
  };

  download('resultado-ahp.json', JSON.stringify(dados, null, 2), 'application/json');
}

function ligarEventos() {
  const r = raiz();
  const ahp = () => state.ahp;

  // Digitação: nome de candidato e barrinha
  r.addEventListener('input', (ev) => {
    const alvo = ev.target;
    const d = alvo.dataset;

    if (d.f === 'cnome') {
      ahp().candidatos.find((c) => c.id === d.p).nome = alvo.value;
      marcarDuplicados();
    } else if (d.par) {
      setX(alvo.closest('.duelo'), +alvo.value);
      return;
    } else {
      return;
    }
    save();
  });

  // Enter: próximo candidato / criar critério
  r.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    const alvo = ev.target;

    if (alvo.id === 'novo-crit') {
      ev.preventDefault();
      r.querySelector('[data-act="add-crit"]').click();
    } else if (alvo.dataset.f === 'cnome') {
      ev.preventDefault();
      const campos = [...r.querySelectorAll('[data-f="cnome"]')];
      const proximo = campos[campos.indexOf(alvo) + 1];
      if (proximo) proximo.focus();
      else r.querySelector('[data-act="add-cand"]:not([disabled])')?.click();
    }
  });

  // Cliques (delegados)
  r.addEventListener('click', (ev) => {
    const lado = ev.target.closest('[data-lado]');
    if (lado) return setX(lado.closest('.duelo'), +lado.dataset.lado);

    const botao = ev.target.closest('[data-act],[data-go]');
    if (!botao || botao.disabled) return;

    const d = botao.dataset;
    const s = ahp();
    const passoAntes = s.passo;
    erros = [];

    if (d.go !== undefined) {
      s.passo = +d.go;
    } else {
      switch (d.act) {
        case 'add-cand':
          if (s.candidatos.length < LIMITES.maxCand) s.candidatos.push({ id: uid(), nome: '' });
          break;

        case 'rm-cand':
          s.candidatos = s.candidatos.filter((c) => c.id !== d.p);
          podar(s);
          break;

        case 'tog-crit': {
          const sugerido = CRITERIOS_SUGERIDOS.find((c) => c.id === d.c);
          if (s.criterios.some((c) => c.id === d.c)) {
            s.criterios = s.criterios.filter((c) => c.id !== d.c);
          } else if (s.criterios.length < LIMITES.maxCrit) {
            s.criterios.push({ ...sugerido });
          }
          podar(s);
          break;
        }

        case 'rm-crit':
          s.criterios = s.criterios.filter((c) => c.id !== d.c);
          podar(s);
          break;

        case 'add-crit': {
          const campo = document.getElementById('novo-crit');
          const nome = campo.value.trim().replace(/\s+/g, ' ');
          const existentes = [...CRITERIOS_SUGERIDOS, ...s.criterios.filter((c) => c.custom)];

          if (!nome) return campo.focus();
          if (existentes.some((c) => norm(c.nome) === norm(nome))) return toast('Esse critério já existe');
          if (s.criterios.length >= LIMITES.maxCrit) return toast(`Máximo de ${LIMITES.maxCrit} critérios`);

          s.criterios.push({ id: uid(), nome, custom: true });
          break;
        }

        case 'voltar':
          s.passo--;
          break;

        case 'avancar':
          if (s.passo === 0) {
            s.candidatos.forEach((c) => {
              c.nome = c.nome.trim().replace(/\s+/g, ' ');
            });
            erros = validar(s);
            if (erros.length) break;
            podar(s);
          }
          s.passo++; // se a matriz atual estiver inconsistente, renderSelecionar() segura o passo
          break;

        case 'sug':
          etapas(s)[s.passo].J[d.k] = +d.v;
          break;

        case 'json':
          return exportarJson();
        case 'print':
          return window.print();
        case 'nova':
          return document.querySelector('[data-limpar]').click();
      }
    }

    save();
    renderSelecionar();

    if (d.act === 'add-cand') {
      const campos = r.querySelectorAll('[data-f="cnome"]');
      campos[campos.length - 1]?.focus();
    }
    if (s.passo !== passoAntes) window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Exemplo: notas de 1 a 9 viram julgamentos par a par (todos consistentes, então o fluxo vai até o resultado)
function exemploAHP() {
  const criterios = ['cr', 'disp', 'hab', 'nota'].map((id) => ({ ...CRITERIOS_SUGERIDOS.find((c) => c.id === id) }));
  const candidatos = ['Ana Beatriz', 'Bruno', 'Carla', 'Diego'].map((nome) => ({ id: uid(), nome }));

  // notas -> julgamentos 'idA|idB' = posição da barrinha
  const julgamentos = (notas, ids) => {
    const J = {};
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) J[ids[i] + '|' + ids[j]] = Calc.posDe(notas[i] / notas[j]);
    }
    return J;
  };

  const notasPorCriterio = {
    cr: [8, 6, 7, 4],
    disp: [3, 8, 5, 7],
    hab: [7, 4, 8, 5],
    nota: [9, 5, 6, 3],
  };

  const idsCandidatos = candidatos.map((p) => p.id);
  const jp = {};
  criterios.forEach((c) => {
    jp[c.id] = julgamentos(notasPorCriterio[c.id], idsCandidatos);
  });

  return {
    passo: 0,
    criterios,
    candidatos,
    jc: julgamentos([6, 5, 3, 4], criterios.map((c) => c.id)),
    jp,
  };
}

ligarEventos();
