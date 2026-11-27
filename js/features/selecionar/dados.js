const CRITERIOS_SUGERIDOS = [
  { id: 'cr', nome: 'Coeficiente de rendimento', desc: 'Desempenho acadêmico geral do aluno.' },
  { id: 'disp', nome: 'Disponibilidade', desc: 'Horários livres para atender a turma.' },
  { id: 'proj', nome: 'Participação em projetos', desc: 'Pesquisa, extensão e iniciativas acadêmicas.' },
  { id: 'hab', nome: 'Habilidades', desc: 'Competências técnicas e didáticas.' },
  { id: 'nota', nome: 'Nota na disciplina específica', desc: 'Resultado do aluno na própria disciplina.' },
  { id: 'entr', nome: 'Desempenho em entrevistas', desc: 'Avaliação na entrevista de seleção.' },
  { id: 'afin', nome: 'Afinidade pessoal', desc: 'Relacionamento e alinhamento de trabalho.' },
];

const LIMITES = {
  minCandidatos: 2,
  maxCandidatos: 10,
  minCriterios: 3,
  maxCriterios: 6,
};
