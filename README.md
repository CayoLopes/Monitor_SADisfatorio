# AHP Monitor

Sistema de Apoio à Decisão (SAD) que usa o método **AHP** para escolher monitores acadêmicos.
Site estático: abra `index.html` no navegador (ou `npm start` → http://localhost:8080). Sem build, sem internet.

## Estrutura

```
index.html              página única (SPA em 5 etapas)
assets/css/
  tokens.css            paleta pastel (azul · branco · roxo) e medidas
  base.css              reset, tipografia, layout geral
  components.css        botões, stepper, cartões, slider, painel de consistência…
src/
  core/ahp.js           núcleo AHP puro (sem DOM): autovetor, CR, síntese, sugestões
  data/criteria.js      catálogo de critérios e limites
  data/store.js         estado único + persistência (localStorage v2)
  ui/                   dom.js (helper seguro), icons.js, components.js (reutilizáveis)
  views/                uma tela por etapa: candidates, criteria, weights, compare, result
  app.js                stepper e navegação
tests/ahp.test.js       testes do núcleo (validados contra numpy)
```

## Correções em relação à versão anterior

| Problema | Correção |
|---|---|
| `ahp.js` quebrado (`lista` indefinida) e não usado; lógica AHP duplicada em 3 HTMLs; `dados.js` morto | Um único núcleo em `src/core/ahp.js` |
| Pesos por média de colunas (aproximação) | Autovetor principal (método de Saaty) |
| Tabela RI só até n=6 (padrão 1,12 acima disso) | RI de Saaty até n=15 |
| Consistência das comparações entre candidatos nunca checada | Checada em cada critério e exibida no resultado |
| Chaves `"A_B"` / `"crit::A_B"`: nomes repetidos ou com `_` colidiam | Ids opacos para candidatos e critérios; nomes duplicados bloqueados |
| Nomes injetados via `innerHTML` (XSS) | Só nós de texto |
| Nomes vazios/espaços aceitos; 6 chaves soltas no localStorage | Validação; um objeto versionado |
| Recarregar a página perdia os sliders; sem como voltar | Estado persistido, stepper e botão Voltar |
| CR inconsistente só dizia "ajuste" | Painel ao vivo, destaca a comparação a revisar e o valor sugerido |
| Critérios fixos em exatamente 3 | 3 a 6, com critérios personalizados; 2 a 10 candidatos |

Regras: a matriz de **critérios** precisa ter CR ≤ 0,10 para avançar; nas matrizes de **candidatos** há apenas aviso (muitas comparações tornam o limite difícil), e o resultado mostra a situação de cada uma.

## Testes

`npm test` (ou `node tests/ahp.test.js`).
