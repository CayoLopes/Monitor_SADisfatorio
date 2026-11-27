# Monitor SADisfatório

Sistema de Apoio à Decisão que usa o método **AHP** para escolher monitores acadêmicos.

Os pesos de prioridade e a razão de consistência de cada matriz de comparação são calculados pela
biblioteca [`ahp-lite`](https://www.npmjs.com/package/ahp-lite). O restante (escala da barra, síntese
hierárquica, diagnóstico de julgamentos e interface) fica no projeto.

Link para visualização via github pages: https://cayolopes.github.io/Monitor_SADisfatorio/

## Execução local

```bash
npm install
npm start
```

Abra http://localhost:8080. A biblioteca é carregada de `esm.sh`, então é preciso estar online.

## Testes

```bash
npm install
npm test
```

## Estrutura

```
index.html
css/
  tema.css                      paleta e componentes compartilhados
  modulos.css                   estilos do assistente
js/
  core/
    utils.js                    formatação, toast, download
    state.js                    estado e persistência (localStorage)
    ahp-lib.js                  adaptador da biblioteca ahp-lite
    calc.js                     escala de Saaty, síntese e diagnóstico
    app.js                      inicialização
  features/selecionar/
    dados.js                    critérios sugeridos e limites
    regras.js                   validação, etapas e navegação
    exemplo.js                  dados de exemplo
    telas/                      componentes, passos, montar, comparar, resultado
    index.js                    renderização do assistente
    eventos.js                  ações do usuário
tests/calc.test.js
```
