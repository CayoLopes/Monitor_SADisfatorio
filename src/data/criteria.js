/* Catálogo de critérios sugeridos para a escolha de monitor. */
(function (global) {
  const App = (global.App = global.App || {});

  App.CRITERIA_CATALOG = [
    { id: 'cr', name: 'Coeficiente de rendimento', desc: 'Desempenho acadêmico geral do aluno.' },
    { id: 'disp', name: 'Disponibilidade', desc: 'Horários livres para atender a turma.' },
    { id: 'proj', name: 'Participação em projetos', desc: 'Pesquisa, extensão e iniciativas acadêmicas.' },
    { id: 'hab', name: 'Habilidades', desc: 'Competências técnicas e didáticas.' },
    { id: 'nota', name: 'Nota na disciplina específica', desc: 'Resultado do aluno na própria disciplina.' },
    { id: 'entr', name: 'Desempenho em entrevistas', desc: 'Avaliação na entrevista de seleção.' },
    { id: 'afin', name: 'Afinidade pessoal', desc: 'Relacionamento e alinhamento de trabalho.' },
  ];

  App.LIMITS = { minCandidates: 2, maxCandidates: 10, minCriteria: 3, maxCriteria: 6 };
})(window);
